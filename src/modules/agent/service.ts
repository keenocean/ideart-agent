import { createAgent } from '@keenocean/open-agent-sdk';

import { buildAgentPrompt } from '@/core/agent/prompt-builder';
import { promptByteLength } from '@/core/agent/prompt-config';
import type { PreparedAgentTurn } from '@/core/agent/types';
import { envConfigs } from '@/config';
import { DEFAULT_AGENT_SYSTEM_PROMPT } from '@/config/agent';
import type { ChatWithMessages } from '@/modules/chats/service';
import { getAllConfigs } from '@/modules/config/service';
import type { AgentGenerationSettings } from '@/lib/agent-settings';
import {
  normalizeAnthropicBaseUrl,
  normalizeOpenAIBaseUrl,
} from '@/lib/llm-base-url';

import type { EffectiveGenerationPolicy } from './entry-policy';
import { loadAgentHistory, LONG_RUNNING_MEDIA_TOOL_NAMES } from './history';
import { resolveAgentProfile } from './profile';
import { buildSkillSystemPrompt, type PromptSkill } from './skills';
import { createAgentTools } from './tools';
import { assertTurnLeaseOwnership } from './turn-lease';

// In-process runtime for the Video Agent chat, replacing the remote
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

export function buildAgentSystemPrompt(
  settings: AgentGenerationSettings | undefined
) {
  return `${DEFAULT_AGENT_SYSTEM_PROMPT}\n\n${mediaModeInstruction(settings)}`;
}

export interface RunAgentTurnParams {
  sessionId: string;
  userId: string;
  message: string;
  persistedUserMessageId: string;
  skill?: PromptSkill | null;
  settings?: AgentGenerationSettings;
  signal?: AbortSignal;
  prepared?: PreparedAgentTurn;
  policy?: EffectiveGenerationPolicy;
}

type LlmProvider = 'openai' | 'anthropic';

export interface LlmSetup {
  provider: LlmProvider;
  apiKey: string;
  baseURL?: string;
  apiType: 'openai-completions' | 'anthropic-messages';
  model: string;
}

export interface PrepareAgentTurnParams {
  turnId: string;
  sessionId: string;
  userId: string;
  message: string;
  persistedUserMessageId?: string;
  skill?: PromptSkill | null;
  settings?: AgentGenerationSettings;
  leaseOwner?: PreparedAgentTurn['leaseOwner'];
  policy?: EffectiveGenerationPolicy;
  preloadedChat?: ChatWithMessages;
}

export async function prepareAgentTurn(
  params: PrepareAgentTurnParams
): Promise<PreparedAgentTurn> {
  const tools = createAgentTools({
    userId: params.userId,
    sessionId: params.sessionId,
    settings: params.settings,
    skill: params.skill,
    turnId: params.turnId,
    requireTurnLease: Boolean(params.leaseOwner),
    policy: params.policy,
  });
  const toolNames = tools.map((tool) => tool.name);
  if (new Set(toolNames).size !== toolNames.length) {
    throw new Error('Agent tool names must be unique.');
  }
  const longRunningSet = new Set<string>(LONG_RUNNING_MEDIA_TOOL_NAMES);
  const longRunningToolNames = toolNames.filter((name) =>
    longRunningSet.has(name)
  );
  const [configs, profile, history] = await Promise.all([
    getAllConfigs(),
    resolveAgentProfile(),
    loadAgentHistory(
      params.sessionId,
      params.userId,
      params.persistedUserMessageId,
      toolNames,
      params.preloadedChat
    ),
  ]);
  const llm = resolveLlm(configs);
  if (!llm) {
    throw new Error(
      'The chat model is not configured: add an OpenAI or Anthropic API key under Admin Settings → AI.'
    );
  }
  if (!llm.model) {
    throw new Error(
      'No chat model set: fill in Admin Settings → AI → Chat Model → Model (OpenAI-compatible endpoints have no safe default).'
    );
  }
  const builtPrompt = await buildAgentPrompt({
    appName: envConfigs.app_name,
    agentName: profile.definition.name,
    businessPrompt: profile.businessPrompt,
    promptSource: profile.promptSource,
    toolNames,
    capabilityInstructions: mediaModeInstruction(params.settings),
    skillPrompt: params.skill
      ? buildSkillSystemPrompt(params.skill).trim()
      : undefined,
  });

  console.info('[agent prompt] prepared', {
    agentDefinitionId: profile.definition.id,
    promptSource: builtPrompt.promptSource,
    businessPromptHash: builtPrompt.businessPromptHash,
    effectivePromptHash: builtPrompt.effectivePromptHash,
    businessPromptBytes: promptByteLength(profile.businessPrompt),
    effectivePromptBytes: promptByteLength(builtPrompt.systemPrompt),
  });

  return {
    turnId: params.turnId,
    definitionId: profile.definition.id,
    settings: params.settings,
    history,
    systemPrompt: builtPrompt.systemPrompt,
    userMessage: withGenerationSettings(params.message, params.settings),
    tools,
    llm,
    maxTurns: profile.definition.maxTurns,
    leaseOwner: params.leaseOwner,
    audit: {
      schemaVersion: 1,
      kind: 'user',
      turnId: params.turnId,
      agentDefinitionId: profile.definition.id,
      businessPromptHash: builtPrompt.businessPromptHash,
      effectivePromptHash: builtPrompt.effectivePromptHash,
      promptSource: builtPrompt.promptSource,
      llmProvider: llm.provider,
      llmModel: llm.model,
      skillName: params.skill?.name ?? null,
      skillReleaseId: params.skill?.releaseId ?? null,
      toolNames,
      longRunningToolNames,
      ...(params.policy ? { generationEntrySource: params.policy.source } : {}),
      ...(params.policy?.requestAttachments?.length
        ? {
            media: params.policy.requestAttachments.map((attachment) => ({
              mediaType: attachment.mediaType,
              url: attachment.url,
            })),
          }
        : {}),
    },
  };
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
    skill,
    settings,
    signal,
  } = params;
  let prepared: PreparedAgentTurn;
  try {
    prepared =
      params.prepared ??
      (await prepareAgentTurn({
        turnId: crypto.randomUUID(),
        sessionId,
        userId,
        message,
        persistedUserMessageId,
        skill,
        settings,
        policy: params.policy,
      }));
  } catch (error: any) {
    yield {
      type: 'error',
      data: { message: String(error?.message ?? error) },
    };
    yield { type: 'done' };
    return;
  }

  if (prepared.leaseOwner) {
    await assertTurnLeaseOwnership(prepared.leaseOwner);
  }

  const agent = createAgent({
    model: prepared.llm.model,
    apiKey: prepared.llm.apiKey,
    baseURL: prepared.llm.baseURL,
    apiType: prepared.llm.apiType,
    sessionId,
    history: prepared.history,
    persistSession: false,
    systemPrompt: prepared.systemPrompt,
    tools: [...prepared.tools],
    maxTurns: prepared.maxTurns,
    permissionMode: 'bypassPermissions',
    abortSignal: signal,
    includePartialMessages: true,
  });

  let streamedAssistantText = false;
  try {
    for await (const msg of agent.query(prepared.userMessage)) {
      if (signal?.aborted) break;
      if (prepared.leaseOwner) {
        await assertTurnLeaseOwnership(prepared.leaseOwner);
      }
      switch (msg.type) {
        case 'partial_message': {
          if (msg.partial.type === 'text' && msg.partial.text) {
            streamedAssistantText = true;
            yield {
              type: 'content',
              data: { content: msg.partial.text },
            };
          }
          break;
        }
        case 'assistant': {
          for (const block of msg.message.content) {
            if (block.type === 'text' && block.text && !streamedAssistantText) {
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
          streamedAssistantText = false;
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
