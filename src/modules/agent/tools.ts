import { defineTool, type ToolDefinition } from '@codeany/open-agent-sdk';

import {
  AIMediaType,
  AITaskStatus,
  FalProvider,
  GRouterProvider,
  ReplicateProvider,
  type AIProvider,
  type AITaskResult,
} from '@/core/ai';
import { envConfigs } from '@/config';
import {
  createTask,
  AITaskStatus as DbTaskStatus,
  updateTask,
} from '@/modules/ai-tasks/service';
import { getAllConfigs } from '@/modules/config/service';
import { getStorage } from '@/modules/storage/service';
import {
  creditsForModelOption,
  isModelOptionValue,
  providerModelFor,
  type AgentGenerationSettings,
  type ImageProviderName,
} from '@/lib/agent-settings';

// Tools the ImgAny agent can call. They are the ONLY tools the agent gets —
// no filesystem/bash base tools — so the agent loop can't touch anything
// outside image generation.

export interface AgentToolContext {
  userId: string;
  sessionId: string;
  settings?: AgentGenerationSettings;
}

const POLL_INTERVAL_MS = 2000;
const POLL_TIMEOUT_MS = 180_000;

function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolveSleep, rejectSleep) => {
    const timer = setTimeout(resolveSleep, ms);
    signal?.addEventListener(
      'abort',
      () => {
        clearTimeout(timer);
        rejectSleep(new Error('aborted'));
      },
      { once: true }
    );
  });
}

/**
 * Reference images arrive as public URLs (uploads and previous generations
 * both live in object storage) or as data URIs. Anything else can't be read
 * from a Worker, so it's rejected instead of silently failing upstream.
 */
function resolveReferenceImage(src: string): string {
  const value = src.trim();
  if (/^https?:\/\//i.test(value) || value.startsWith('data:')) return value;
  throw new Error(`unsupported image reference: ${src}`);
}

function extFromUrl(url: string): string {
  const m = url.match(/\.(png|jpe?g|gif|webp)(?:\?|$)/i);
  return m ? m[1].toLowerCase().replace('jpeg', 'jpg') : 'png';
}

function contentTypeFromExt(ext: string): string {
  switch (ext.toLowerCase()) {
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg';
    case 'png':
      return 'image/png';
    case 'webp':
      return 'image/webp';
    case 'gif':
      return 'image/gif';
    default:
      return 'application/octet-stream';
  }
}

/**
 * Persist the provider's images to object storage and return their public
 * URLs. Nothing touches a local disk — the agent runs on Workers, where there
 * isn't one, and storage is the single home for generated files.
 */
async function storeGeneratedImages(
  urls: string[],
  sessionId: string
): Promise<{ files: string[]; storage: string }> {
  const storage = await getStorage();
  if (!storage) {
    throw new Error(
      'Object storage is not configured. Ask the site admin to set up R2 in Admin Settings — generated images have nowhere to live otherwise.'
    );
  }

  const files: string[] = [];
  for (let i = 0; i < urls.length; i++) {
    const buf = await fetchImageBuffer(urls[i]);
    const ext = extFromUrl(urls[i]);
    const uploaded = await storage.uploadFile({
      body: buf,
      key: `agent/sessions/${sessionId}/img_${Date.now()}_${i}.${ext}`,
      contentType: contentTypeFromExt(ext),
      disposition: 'inline',
    });
    if (!uploaded.success || !uploaded.url) {
      throw new Error(uploaded.error || 'storage upload failed');
    }
    files.push(uploaded.url);
  }
  return { files, storage: storage.getProviderNames()[0] };
}

async function fetchImageBuffer(url: string): Promise<Buffer> {
  let lastError: unknown;
  const host = safeUrlHost(url);

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch(url);
      if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(
          `image download from ${host} failed (${res.status}): ${text.slice(0, 300)}`
        );
      }
      return Buffer.from(await res.arrayBuffer());
    } catch (error: any) {
      lastError = error;
      if (attempt < 3) {
        await sleep(attempt * 800);
        continue;
      }
    }
  }

  const cause =
    lastError instanceof Error
      ? `${lastError.message}${lastError.cause ? `; cause: ${String(lastError.cause)}` : ''}`
      : String(lastError);
  throw new Error(`image download from ${host} failed after retries: ${cause}`);
}

function safeUrlHost(url: string): string {
  try {
    return new URL(url).host;
  } catch {
    return 'unknown host';
  }
}

async function runImageGeneration(params: {
  ctx: AgentToolContext;
  prompt: string;
  /** Picker key (`gpt-image-2`) — mapped to the active provider's id. */
  modelKey?: string;
  /** A raw provider id the agent asked for, used verbatim when present. */
  rawModel?: string;
  kind: 'generate' | 'edit';
  options: Record<string, unknown>;
  signal?: AbortSignal;
}): Promise<string> {
  const { ctx, prompt, options, signal, kind } = params;
  const configs = await getAllConfigs();

  const selectedProvider = pickImageProvider(configs);

  if (!selectedProvider) {
    return JSON.stringify({
      status: 'error',
      message:
        'Image provider is not configured. Ask the site admin to add a Replicate API token or a Fal API key in Admin Settings.',
    });
  }

  const model =
    providerModelFor(
      params.modelKey,
      selectedProvider,
      kind,
      selectedProvider === 'grouter' ? grouterModelMap(configs) : undefined
    ) ||
    params.rawModel ||
    defaultModelFor(selectedProvider);

  if (!model) {
    return JSON.stringify({
      status: 'error',
      message: `Model "${params.modelKey ?? params.rawModel ?? ''}" has no id configured for the ${selectedProvider} provider.`,
    });
  }

  let provider: AIProvider;
  if (selectedProvider === 'grouter') {
    provider = new GRouterProvider({
      apiKey: configs.grouter_api_key,
      baseUrl: configs.grouter_base_url,
      appName: envConfigs.app_name,
      appUrl: envConfigs.app_url,
    });
  } else if (selectedProvider === 'replicate') {
    provider = new ReplicateProvider({ apiToken: configs.replicate_api_token });
  } else {
    provider = new FalProvider({ apiKey: configs.fal_api_key });
  }

  // Priced from the model catalog, never from the request body — the
  // composer sends `creditCost` for display, but trusting it would let a
  // crafted request buy a 50-credit image for nothing.
  const costCredits = creditsForModelOption(ctx.settings?.modelName);

  // createTask consumes credits atomically and stores the credit id so a
  // failed generation can be refunded via updateTask(FAILED).
  let task: { id: string };
  try {
    task = await createTask({
      userId: ctx.userId,
      mediaType: 'image',
      provider: selectedProvider,
      model,
      prompt,
      costCredits,
      // Which chat asked for it. The gallery reads images out of the message
      // rows today, but recording it here keeps the task row self-contained
      // for support questions — and leaves the door open to serving the
      // gallery from this table instead.
      options: { ...(options ?? {}), sessionId: ctx.sessionId },
    });
  } catch (err: any) {
    if (String(err?.message).includes('Insufficient credits')) {
      return JSON.stringify({
        status: 'error',
        message:
          'Insufficient credits. The user needs to top up before generating more images.',
      });
    }
    throw err;
  }

  try {
    const providerOptions = { ...options };
    const nativeResolution = nativeResolutionForModel(
      selectedProvider,
      model,
      providerOptions.resolution
    );
    if (nativeResolution) providerOptions.resolution = nativeResolution;
    else delete providerOptions.resolution;

    const created = await provider.generate({
      params: {
        mediaType: AIMediaType.IMAGE,
        model,
        prompt,
        options: providerOptions,
      },
    });

    const deadline = Date.now() + POLL_TIMEOUT_MS;
    const pollTask = provider.query?.bind(provider);
    let result: AITaskResult = created;
    while (
      result.taskStatus !== AITaskStatus.SUCCESS &&
      result.taskStatus !== AITaskStatus.FAILED &&
      result.taskStatus !== AITaskStatus.CANCELED
    ) {
      if (!pollTask) {
        throw new Error(`provider ${selectedProvider} cannot poll tasks`);
      }
      if (Date.now() > deadline) throw new Error('image generation timed out');
      await sleep(POLL_INTERVAL_MS, signal);
      result = await pollTask({
        taskId: created.taskId,
        model,
        mediaType: AIMediaType.IMAGE,
      });
    }

    if (result.taskStatus !== AITaskStatus.SUCCESS) {
      throw new Error(
        result.taskInfo?.errorMessage || `generation ${result.taskStatus}`
      );
    }

    const urls = (result.taskInfo?.images ?? [])
      .map((img) => img.imageUrl)
      .filter((u): u is string => !!u);
    if (urls.length === 0) throw new Error('no image returned');

    const saved = await storeGeneratedImages(urls, ctx.sessionId);
    const files = saved.files;

    await updateTask({
      taskId: task.id,
      status: DbTaskStatus.SUCCESS,
      taskResult: { files, model, storage: saved.storage },
    });

    return JSON.stringify({
      status: 'success',
      files,
      storage: saved.storage,
      provider: selectedProvider,
      model,
      note:
        'Reference each file in your reply as a markdown image using the storage URL, e.g. ![alt](' +
        files[0] +
        ')',
    });
  } catch (err: any) {
    const raw = String(err?.message ?? err);
    // Refunds the consumed credits (updateTask revokes on FAILED). The raw
    // message is kept in the task record; the agent (and the chat) only get
    // the readable summary.
    await updateTask({
      taskId: task.id,
      status: DbTaskStatus.FAILED,
      taskResult: { error: raw },
    }).catch(() => {});
    return JSON.stringify({
      status: 'error',
      message: summarizeProviderError(raw),
    });
  }
}

/**
 * Providers report failures by pasting the upstream response body into their
 * error message, which drags in the echoed request (prompt, image sizes, even
 * `openai_api_key: null`). Pull out the sentence a human needs — fal's
 * `detail[].msg`, an OpenAI-style `error.message`, or a plain `detail` — and
 * keep the prefix that says who failed and with what status.
 */
function summarizeProviderError(message: string): string {
  const start = message.search(/[[{]/);
  if (start === -1) return truncate(message);

  const prefix = message
    .slice(0, start)
    .trim()
    .replace(/[:\s]+$/, '');
  let payload: any;
  try {
    payload = JSON.parse(message.slice(start));
  } catch {
    return truncate(message);
  }

  const detail = payload?.detail ?? payload;
  const first = Array.isArray(detail) ? detail[0] : detail;
  const summary =
    (typeof first?.msg === 'string' && first.msg) ||
    (typeof first?.message === 'string' && first.message) ||
    (typeof payload?.error?.message === 'string' && payload.error.message) ||
    (typeof detail === 'string' && detail) ||
    '';
  if (!summary) return truncate(message);

  const type = typeof first?.type === 'string' ? ` (${first.type})` : '';
  return truncate(
    prefix ? `${prefix}: ${summary}${type}` : `${summary}${type}`
  );
}

function truncate(value: string, max = 300): string {
  const trimmed = value.trim();
  return trimmed.length > max ? `${trimmed.slice(0, max)}…` : trimmed;
}

function promptWithResolution(prompt: string, resolution: unknown) {
  const value = typeof resolution === 'string' ? resolution.trim() : '';
  if (!value) return prompt;
  const upper = value.toUpperCase();
  return `${prompt}. ${upper} high-resolution output, sharp detail, clean edges.`;
}

/**
 * Resolve which provider serves this call.
 *
 * The admin's `default_image_provider` decides; `auto` prefers the gRouter
 * gateway (a configured gateway exists to be the single egress for image
 * traffic), then Replicate, then Fal. An explicitly chosen provider that
 * isn't usable falls back to whatever is configured rather than failing.
 * Returns null when nothing usable is configured.
 */
function pickImageProvider(
  configs: Record<string, any>
): ImageProviderName | null {
  const configured: Record<ImageProviderName, boolean> = {
    // gRouter is a self-hosted gateway rather than a service you sign up for,
    // so it is not offered in Admin Settings; the provider is still wired up
    // for anyone who runs one and sets the two config keys directly.
    grouter: !!configs.grouter_api_key && !!configs.grouter_base_url,
    fal: !!configs.fal_api_key,
    replicate: !!configs.replicate_api_token,
  };

  const preferred = String(configs.default_image_provider || 'auto');
  const order: ImageProviderName[] =
    preferred === 'auto'
      ? ['replicate', 'fal', 'grouter']
      : [preferred as ImageProviderName, 'replicate', 'fal', 'grouter'];

  return order.find((name) => configured[name]) ?? null;
}

/**
 * Admin-supplied picker-key → gRouter route-name overrides, stored as JSON in
 * `grouter_model_map` (route names are chosen inside the gateway, so the
 * built-in defaults can't always be right). Malformed JSON is ignored rather
 * than failing the generation.
 */
function grouterModelMap(
  configs: Record<string, any>
): Record<string, string> | undefined {
  const raw = String(configs.grouter_model_map ?? '').trim();
  if (!raw) return undefined;
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return undefined;
    const out: Record<string, string> = {};
    for (const [key, value] of Object.entries(parsed)) {
      if (typeof value === 'string' && value.trim()) out[key] = value.trim();
    }
    return Object.keys(out).length > 0 ? out : undefined;
  } catch {
    console.warn('[agent tools] grouter_model_map is not valid JSON');
    return undefined;
  }
}

/** Last-resort model when the picker key maps to nothing for this provider. */
function defaultModelFor(provider: ImageProviderName): string {
  switch (provider) {
    case 'replicate':
      return 'black-forest-labs/flux-schnell';
    case 'fal':
      return 'fal-ai/flux/schnell';
    default:
      return '';
  }
}

/**
 * `resolution` is a Fal-only input — the same model id on Replicate takes
 * `quality`/`aspect_ratio` instead and rejects unknown fields, and the gateway
 * speaks `size`. Everywhere else the target clarity rides along in the prompt.
 */
function nativeResolutionForModel(
  provider: ImageProviderName,
  model: string,
  resolution: unknown
) {
  const value = typeof resolution === 'string' ? resolution.trim() : '';
  if (!value || provider !== 'fal') return undefined;
  const supported = [
    'openai/gpt-image-2',
    'openai/gpt-image-2/edit',
    'fal-ai/nano-banana-2',
    'fal-ai/nano-banana-2/edit',
    'fal-ai/nano-banana-pro',
    'fal-ai/nano-banana-pro/edit',
  ];
  return supported.includes(model) ? value.toUpperCase() : undefined;
}

/**
 * The agent may name a model as a picker key (`gpt-image-2`) or as a raw
 * provider id. A key is mapped per provider; a raw id is passed through
 * untouched so "use flux-kontext" style requests still work.
 */
function modelSelection(
  requested: string,
  ctx: AgentToolContext
): { modelKey?: string; rawModel?: string } {
  if (requested && !isModelOptionValue(requested))
    return { rawModel: requested };
  return { modelKey: requested || ctx.settings?.modelName };
}

export function createAgentTools(ctx: AgentToolContext): ToolDefinition[] {
  const generateImage = defineTool({
    name: 'generate_image',
    description:
      'Generate one image from a text prompt. Returns JSON with `files` — public URLs of the generated images. Always show the result to the user as a markdown image.',
    inputSchema: {
      type: 'object',
      properties: {
        prompt: {
          type: 'string',
          description:
            'Detailed English prompt describing the image to generate',
        },
        aspect_ratio: {
          type: 'string',
          description:
            'Aspect ratio, e.g. "1:1", "16:9", "9:16", "4:3". Default "1:1".',
        },
        model: {
          type: 'string',
          description:
            'Optional Replicate model id override (owner/name). Leave empty to use the default text-to-image model.',
        },
        resolution: {
          type: 'string',
          description:
            'Optional target output clarity, e.g. "2k" or "4k". If the model does not support a native resolution field, include it in the prompt.',
        },
      },
      required: ['prompt'],
    },
    isConcurrencySafe: true,
    async call(input, context) {
      const requested = String(input.model ?? '');
      const options: Record<string, unknown> = {};
      const aspectRatio = input.aspect_ratio || ctx.settings?.aspectRatio;
      if (aspectRatio) options.aspect_ratio = aspectRatio;
      const resolution = input.resolution || ctx.settings?.resolution;
      if (resolution) options.resolution = resolution;
      return runImageGeneration({
        ctx,
        prompt: promptWithResolution(String(input.prompt ?? ''), resolution),
        ...modelSelection(requested, ctx),
        kind: 'generate',
        options,
        signal: context.abortSignal,
      });
    },
  });

  const editImage = defineTool({
    name: 'edit_image',
    description:
      'Edit, restyle or combine existing images based on instructions. Accepts the http(s) URLs of uploaded or previously generated images. Pass several to compose them — e.g. a person plus a garment for a virtual try-on. Returns JSON with `files` — public URLs of the edited images.',
    inputSchema: {
      type: 'object',
      properties: {
        prompt: {
          type: 'string',
          description: 'English instruction describing the desired edit',
        },
        image: {
          type: 'string',
          description:
            'Source image: the http(s) URL of an uploaded or previously generated image. Use `images` instead when the edit needs more than one.',
        },
        images: {
          type: 'array',
          items: { type: 'string' },
          description:
            'Several source images, in the order the prompt refers to them (e.g. ["<person>", "<garment>"]). Takes precedence over `image`.',
        },
        aspect_ratio: {
          type: 'string',
          description: 'Optional output aspect ratio, e.g. "match_input_image"',
        },
        model: {
          type: 'string',
          description:
            'Optional Replicate model id override. Leave empty to use the default image-editing model.',
        },
        resolution: {
          type: 'string',
          description:
            'Optional target output clarity, e.g. "2k" or "4k". If the model does not support a native resolution field, include it in the prompt.',
        },
      },
      required: ['prompt'],
    },
    isConcurrencySafe: true,
    async call(input, context) {
      const requested = String(input.model ?? '');
      const sources = (
        Array.isArray(input.images) && input.images.length > 0
          ? input.images
          : [input.image]
      )
        .map((item: unknown) => String(item ?? '').trim())
        .filter(Boolean);
      if (sources.length === 0) {
        return JSON.stringify({
          status: 'error',
          message: 'edit_image needs at least one source image',
        });
      }
      const inputImages = sources.map((src: string) =>
        resolveReferenceImage(src)
      );
      // Normalized key — each provider's formatInput() maps this to the
      // field name the selected model actually expects (e.g. `image_url`
      // for fal-ai/flux-pro/kontext, `input_image` for Replicate's
      // flux-kontext family). Don't hardcode a provider-specific key here.
      const options: Record<string, unknown> = { image_input: inputImages };
      const aspectRatio = input.aspect_ratio || ctx.settings?.aspectRatio;
      if (aspectRatio) options.aspect_ratio = aspectRatio;
      const resolution = input.resolution || ctx.settings?.resolution;
      if (resolution) options.resolution = resolution;
      return runImageGeneration({
        ctx,
        prompt: promptWithResolution(String(input.prompt ?? ''), resolution),
        ...modelSelection(requested, ctx),
        kind: 'edit',
        options,
        signal: context.abortSignal,
      });
    },
  });

  return [generateImage, editImage];
}
