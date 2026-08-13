import { createAgent } from '@codeany/open-agent-sdk';

import { CORE_AGENT_GUARDRAILS } from '@/core/agent/guardrails';
import { applyAgentPromptVariables } from '@/core/agent/prompt-config';
import { envConfigs } from '@/config';
import { DEFAULT_AGENT_SYSTEM_PROMPT } from '@/config/agent';
import { getAllConfigs, getConfigLatest } from '@/modules/config/service';
import type { AgentGenerationSettings } from '@/lib/agent-settings';
import {
  normalizeAnthropicBaseUrl,
  normalizeOpenAIBaseUrl,
} from '@/lib/llm-base-url';

import { loadAgentHistory } from './history';
import { createAgentTools } from './tools';

// In-process runtime for the Ideart chat, replacing the remote
// FastClaw runtime the Next.js version proxied to. Each request creates a
// fresh Agent seeded with the conversation replayed from the database, runs
// one turn, and emits the same event shapes the old runtime streamed:
// content / tool_call / tool_result / error / done.
//
// Nothing here touches a filesystem: history comes from `chat_message` and
// generated images and clips go to object storage, so the whole runtime works on
// Cloudflare Workers.

export interface AgentStreamEvent {
  type: 'content' | 'tool_call' | 'tool_result' | 'error' | 'done';
  data?: Record<string, unknown>;
}

const AGENT_SYSTEM_PROMPT_CONFIG_KEY = 'agent_system_prompt';
const DEFAULT_TOOL_NAMES = [
  'generate_image',
  'generate_video',
  'animate_image',
] as const;

export function buildAgentSystemPrompt(
  settings: AgentGenerationSettings | undefined,
  businessPrompt = DEFAULT_AGENT_SYSTEM_PROMPT,
  toolNames: readonly string[] = DEFAULT_TOOL_NAMES
) {
  const availableTools = [...toolNames].join(', ') || 'none';
  const resolvedBusinessPrompt = applyAgentPromptVariables(businessPrompt, {
    app_name: envConfigs.app_name,
    agent_name: 'Ideart',
    available_tools: availableTools,
  });
  return [
    CORE_AGENT_GUARDRAILS,
    resolvedBusinessPrompt,
    `Effective tool policy:\n- Available tools for this turn: ${availableTools}.\n- No other tool is authorized.`,
    mediaModeInstruction(settings),
  ].join('\n\n');
}

export interface RunAgentTurnParams {
  sessionId: string;
  userId: string;
  message: string;
  persistedUserMessageId: string;
  settings?: AgentGenerationSettings;
  signal?: AbortSignal;
}

type LlmProvider = 'openai' | 'anthropic';

export interface LlmSetup {
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
export function resolveLlm(configs: Record<string, string>): LlmSetup | null {
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
  const {
    sessionId,
    userId,
    message,
    persistedUserMessageId,
    settings,
    signal,
  } = params;

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

  let businessPrompt = DEFAULT_AGENT_SYSTEM_PROMPT;
  try {
    const configuredPrompt = await getConfigLatest(
      AGENT_SYSTEM_PROMPT_CONFIG_KEY
    );
    if (configuredPrompt?.trim()) businessPrompt = configuredPrompt;
  } catch (error) {
    console.error('[agent prompt] latest read failed', error);
    yield {
      type: 'error',
      data: {
        message: 'The Agent configuration is temporarily unavailable.',
      },
    };
    yield { type: 'done' };
    return;
  }

  // Stateless: the transcript comes from the database and goes back to it
  // (the chat route persists each round), so the SDK never reads or writes
  // session files — there's no disk to write to on Workers.
  const history = await loadAgentHistory(
    sessionId,
    userId,
    persistedUserMessageId
  );

  const tools = createAgentTools({ userId, sessionId, settings });
  let systemPrompt: string;
  try {
    systemPrompt = buildAgentSystemPrompt(
      settings,
      businessPrompt,
      tools.map((tool) => tool.name)
    );
  } catch (error) {
    console.error('[agent prompt] invalid database override', error);
    yield {
      type: 'error',
      data: { message: 'The configured Agent System Prompt is invalid.' },
    };
    yield { type: 'done' };
    return;
  }

  const agent = createAgent({
    model: llm.model,
    apiKey: llm.apiKey,
    baseURL: llm.baseURL,
    apiType: llm.apiType,
    sessionId,
    history,
    persistSession: false,
    systemPrompt,
    tools,
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

export function withGenerationSettings(
  message: string,
  settings: AgentGenerationSettings | undefined
) {
  if (
    !settings?.modelName &&
    !settings?.aspectRatio &&
    !settings?.resolution &&
    !settings?.duration &&
    !settings?.imageAspectRatio &&
    !settings?.imageResolution &&
    !settings?.imageQuality
  )
    return message;
  const lines = [
    '',
    'UI generation settings:',
    settings.mediaMode === 'image'
      ? '- Image output is selected. If the user explicitly requests an image result, call generate_image; otherwise answer without calling a tool.'
      : settings.mediaMode === 'video'
        ? '- The user explicitly selected video output. You must call generate_video or animate_image; do not produce a still image.'
        : '- Output mode is Auto. Infer whether the user wants a still image or a video from their request.',
    // The tools resolve this name to whatever id the active provider uses —
    // the agent should pass the name through, not invent a provider id.
    settings.mediaMode !== 'image' && settings.modelName
      ? `- The user picked the "${settings.modelName}" video model. Leave the \`model\` argument of generate_video/animate_image empty so it is used, unless the user explicitly asks for a different model.`
      : '',
    settings.mediaMode !== 'image' && settings.aspectRatio
      ? `- Use aspect_ratio "${settings.aspectRatio}" when calling generate_video or animate_image unless the user explicitly asks for a different aspect ratio.`
      : '',
    settings.mediaMode !== 'image' && settings.duration
      ? `- Generate ${settings.duration}-second clips unless the user explicitly asks for a different length.`
      : '',
    settings.mediaMode !== 'image' && settings.resolution
      ? `- Target ${settings.resolution} output. If the selected video model supports a resolution parameter, use it; otherwise incorporate "${settings.resolution}, sharp detail, clean motion" into the video prompt.`
      : '',
    settings.mediaMode !== 'image' && settings.creditCost
      ? `- The selected model costs ${settings.creditCost} credits for a clip of this length.`
      : '',
    settings.mediaMode === 'image' && settings.imageModelName
      ? `- The selected image model is "${settings.imageModelName}". Leave the \`model\` argument of generate_image empty so it is used.`
      : '',
    settings.mediaMode === 'image' && settings.imageAspectRatio
      ? `- When calling generate_image, use aspect_ratio "${settings.imageAspectRatio}" unless the user explicitly asks for another ratio.`
      : '',
    settings.mediaMode === 'image' && settings.imageResolution
      ? `- When calling generate_image, use resolution "${settings.imageResolution}" unless the user explicitly asks for another resolution.`
      : '',
    settings.mediaMode === 'image' && settings.imageQuality
      ? `- When calling generate_image, use quality "${settings.imageQuality}" unless the user explicitly asks for another quality.`
      : '',
    settings.mediaMode === 'image' && settings.imageCreditCost
      ? `- An image with the selected settings costs ${settings.imageCreditCost} credits.`
      : '',
  ].filter(Boolean);
  return `${message}\n\n${lines.join('\n')}`;
}

function mediaModeInstruction(settings: AgentGenerationSettings | undefined) {
  if (settings?.mediaMode === 'image') {
    return 'Composer output mode: IMAGE. Only generate_image is available. Selecting Image mode alone is not a request to generate.';
  }
  if (settings?.mediaMode === 'video') {
    return 'Composer output mode: VIDEO. Only video tools are available. Use animate_image for a supplied opening frame when appropriate; otherwise use generate_video.';
  }
  return 'Composer output mode: AUTO. Infer the intended medium and select the matching available tool.';
}
