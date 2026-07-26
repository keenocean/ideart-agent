import { createAgent } from '@codeany/open-agent-sdk';

import { getAllConfigs } from '@/modules/config/service';
import type { AgentGenerationSettings } from '@/lib/agent-settings';
import {
  normalizeAnthropicBaseUrl,
  normalizeOpenAIBaseUrl,
} from '@/lib/llm-base-url';

import { loadAgentHistory } from './history';
import { createAgentTools } from './tools';

// In-process agent runtime for the ImgAny chat, replacing the remote
// FastClaw runtime the Next.js version proxied to. Each request creates a
// fresh Agent seeded with the conversation replayed from the database, runs
// one turn, and emits the same event shapes the old runtime streamed:
// content / tool_call / tool_result / error / done.
//
// Nothing here touches a filesystem: history comes from `chat_message` and
// generated images go to object storage, so the whole runtime works on
// Cloudflare Workers.

export interface AgentStreamEvent {
  type: 'content' | 'tool_call' | 'tool_result' | 'error' | 'done';
  data?: Record<string, unknown>;
}

const SYSTEM_PROMPT = `You are ImgAny, an image-generation agent. You help users create and edit images through conversation.

Rules:
- Understand the user's intent, then call generate_image (text-to-image) or edit_image (when the user refers to an existing image or provides one).
- When the user message includes "Attached images", use those URLs as source images for edit_image if the request asks to transform, restyle, repair, remove, replace, extend, or otherwise modify an image.
- Write image prompts in English, enriching the user's request with useful visual detail (style, lighting, composition), but never changing their intent.
- Reply to the user in the language they used.
- After a tool returns generated files, ALWAYS embed each one in your reply as a markdown image using the returned URL: ![description](<url>).
- If a tool returns an error, explain it briefly and suggest what the user can do (e.g. top up credits, try a simpler prompt). Never invent image paths.`;

export interface RunAgentTurnParams {
  sessionId: string;
  userId: string;
  message: string;
  settings?: AgentGenerationSettings;
  signal?: AbortSignal;
}

type LlmProvider = 'openai' | 'anthropic';

interface LlmSetup {
  provider: LlmProvider;
  apiKey: string;
  baseURL?: string;
  apiType: 'openai-completions' | 'anthropic-messages';
  model: string;
}

/**
 * Resolve which LLM the agent talks to, entirely from Admin Settings.
 *
 * `default_llm_provider` picks the card whose credentials are used; `auto`
 * prefers OpenAI and falls back to Anthropic. The protocol follows from that
 * choice rather than being guessed from the URL — an OpenAI-compatible
 * gateway can live on any host.
 */
function resolveLlm(configs: Record<string, string>): LlmSetup | null {
  const openaiKey = configs.openai_api_key?.trim();
  const anthropicKey = configs.anthropic_api_key?.trim();
  const preference = configs.default_llm_provider?.trim() || 'auto';

  // Either preference still falls back to the other card, so a missing key
  // degrades to "whatever is configured" instead of a dead agent.
  const order: LlmProvider[] =
    preference === 'anthropic'
      ? ['anthropic', 'openai']
      : ['openai', 'anthropic'];

  const provider = order.find((name) =>
    name === 'openai' ? openaiKey : anthropicKey
  );
  if (!provider) return null;

  const model = configs.agent_model?.trim();
  if (provider === 'anthropic') {
    return {
      provider,
      apiKey: anthropicKey!,
      baseURL: normalizeAnthropicBaseUrl(configs.anthropic_base_url),
      apiType: 'anthropic-messages',
      model: model || 'claude-sonnet-4-6',
    };
  }
  return {
    provider,
    apiKey: openaiKey!,
    baseURL: normalizeOpenAIBaseUrl(configs.openai_base_url),
    apiType: 'openai-completions',
    model,
  };
}

/** Whether an LLM provider is configured in Admin Settings. */
export async function isAgentConfigured(): Promise<boolean> {
  return resolveLlm(await getAllConfigs()) !== null;
}

/**
 * Run one chat turn through the in-process agent loop, yielding stream
 * events as they happen.
 */
export async function* runAgentTurn(
  params: RunAgentTurnParams
): AsyncGenerator<AgentStreamEvent> {
  const { sessionId, userId, message, settings, signal } = params;

  const configs = await getAllConfigs();
  const llm = resolveLlm(configs);

  if (!llm) {
    yield {
      type: 'error',
      data: {
        message:
          'The chat model is not configured: add an OpenAI or Anthropic API key under Admin Settings → AI.',
      },
    };
    yield { type: 'done' };
    return;
  }

  if (!llm.model) {
    yield {
      type: 'error',
      data: {
        message:
          'No chat model set: fill in Admin Settings → AI → Chat Model → Model (OpenAI-compatible endpoints have no safe default).',
      },
    };
    yield { type: 'done' };
    return;
  }

  // Stateless: the transcript comes from the database and goes back to it
  // (the chat route persists each round), so the SDK never reads or writes
  // session files — there's no disk to write to on Workers.
  const history = await loadAgentHistory(sessionId, userId);

  const agent = createAgent({
    model: llm.model,
    apiKey: llm.apiKey,
    baseURL: llm.baseURL,
    apiType: llm.apiType,
    sessionId,
    history,
    persistSession: false,
    systemPrompt: SYSTEM_PROMPT,
    tools: createAgentTools({ userId, sessionId, settings }),
    maxTurns: 12,
    permissionMode: 'bypassPermissions',
    abortSignal: signal,
  });

  try {
    for await (const msg of agent.query(
      withGenerationSettings(message, settings)
    )) {
      if (signal?.aborted) break;
      switch (msg.type) {
        case 'assistant': {
          for (const block of msg.message.content) {
            if (block.type === 'text' && block.text) {
              yield { type: 'content', data: { content: block.text } };
            } else if (block.type === 'tool_use') {
              yield {
                type: 'tool_call',
                data: {
                  id: block.id,
                  name: block.name,
                  arguments: JSON.stringify(block.input ?? {}),
                },
              };
            }
          }
          break;
        }
        case 'tool_result': {
          yield {
            type: 'tool_result',
            data: {
              id: msg.result.tool_use_id,
              name: msg.result.tool_name,
              result: msg.result.output,
            },
          };
          break;
        }
        case 'result': {
          // The engine's failure results don't always set is_error (a plain
          // `subtype: 'error'` is emitted when the LLM call fails after
          // retries) — treat any non-success subtype as an error.
          if (msg.is_error || msg.subtype !== 'success') {
            const errors = Array.isArray(msg.errors)
              ? msg.errors.filter(Boolean).map(String)
              : [];
            yield {
              type: 'error',
              data: {
                message:
                  errors.join('; ') ||
                  String(msg.result || '') ||
                  `agent run failed (${msg.subtype})`,
              },
            };
          }
          break;
        }
        default:
          break;
      }
    }
  } catch (err: any) {
    if (err?.name !== 'AbortError' && !signal?.aborted) {
      yield {
        type: 'error',
        data: { message: String(err?.message ?? err) },
      };
    }
  } finally {
    // Closes MCP links and drops the engine; persistence is the database's
    // job (persistSession: false), so nothing is written here.
    await agent.close().catch(() => {});
  }

  yield { type: 'done' };
}

function withGenerationSettings(
  message: string,
  settings: AgentGenerationSettings | undefined
) {
  if (!settings?.modelName && !settings?.aspectRatio && !settings?.resolution)
    return message;
  const lines = [
    '',
    'UI generation settings:',
    // The tools resolve this name to whatever id the active provider uses —
    // the agent should pass the name through, not invent a provider id.
    settings.modelName
      ? `- The user picked the "${settings.modelName}" image model. Leave the \`model\` argument of generate_image/edit_image empty so it is used, unless the user explicitly asks for a different model.`
      : '',
    settings.aspectRatio
      ? `- Use aspect_ratio "${settings.aspectRatio}" when calling generate_image or edit_image unless the user explicitly asks for a different aspect ratio.`
      : '',
    settings.resolution
      ? `- Target ${settings.resolution.toUpperCase()} output quality. If the selected image model supports a resolution/quality parameter, use it; otherwise incorporate "${settings.resolution.toUpperCase()} high-resolution, sharp detail" into the image prompt.`
      : '',
    settings.creditCost
      ? `- The selected image model costs ${settings.creditCost} credits per generation.`
      : '',
  ].filter(Boolean);
  return `${message}\n\n${lines.join('\n')}`;
}
