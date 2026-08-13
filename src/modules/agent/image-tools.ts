import { defineTool, type ToolDefinition } from '@keenocean/open-agent-sdk';

import { AIMediaType, AITaskStatus, type AITaskResult } from '@/core/ai';
import type { StorageManager } from '@/core/storage';
import {
  createTask,
  AITaskStatus as DbTaskStatus,
  findTask,
  markTaskProcessing,
  updateTask,
} from '@/modules/ai-tasks/service';
import { getAllConfigs } from '@/modules/config/service';
import { getStorage } from '@/modules/storage/service';
import {
  creditsForImageGeneration,
  DEFAULT_IMAGE_MODEL,
  isImageModelOptionValue,
  type AgentGenerationSettings,
  type AgentImageModelOptionValue,
} from '@/lib/agent-settings';

import {
  createImageProvider,
  imageProviderOptionsFor,
  imageProviderOptionsForProvider,
  pickImageProvider,
  resolveImageProviderModel,
} from './image-provider';
import { resolveReferenceImage } from './media';
import { summarizeProviderError } from './provider-error';
import { assertTurnLeaseOwnership } from './turn-lease';

const IMAGE_POLL_INTERVAL_MS = 2000;
const IMAGE_POLL_TIMEOUT_MS = 180_000;
const MAX_IMAGE_BYTES = 50 * 1024 * 1024;
const MAX_IMAGE_REDIRECTS = 3;

class ImageRedirectError extends Error {}

interface ImageToolContext {
  userId: string;
  sessionId: string;
  turnId?: string;
  requireTurnLease?: boolean;
  settings?: AgentGenerationSettings;
}

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

function extensionForContentType(contentType: string): string {
  switch (contentType.split(';')[0].trim().toLowerCase()) {
    case 'image/jpeg':
      return 'jpg';
    case 'image/webp':
      return 'webp';
    case 'image/gif':
      return 'gif';
    default:
      return 'png';
  }
}

function contentTypeForUrl(url: string): string {
  const match = url.match(/\.(png|jpe?g|gif|webp)(?:\?|$)/i);
  switch (match?.[1]?.toLowerCase()) {
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg';
    case 'webp':
      return 'image/webp';
    case 'gif':
      return 'image/gif';
    default:
      return 'image/png';
  }
}

async function readResponseBody(
  response: Response,
  maxBytes: number
): Promise<Buffer> {
  if (!response.body) return Buffer.from(await response.arrayBuffer());
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let received = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (!value) continue;
    received += value.byteLength;
    if (received > maxBytes) {
      await reader.cancel();
      throw new Error('generated image exceeds the 50 MB storage limit');
    }
    chunks.push(value);
  }
  return Buffer.concat(
    chunks.map((chunk) => Buffer.from(chunk)),
    received
  );
}

function redirectedImageUrl(location: string, currentUrl: string): string {
  let redirected: string;
  try {
    redirected = new URL(location, currentUrl).toString();
  } catch {
    throw new ImageRedirectError('image download returned an invalid redirect');
  }
  if (!/^https?:\/\//i.test(redirected)) {
    throw new ImageRedirectError(`unsupported image reference: ${redirected}`);
  }
  try {
    return resolveReferenceImage(redirected);
  } catch (error) {
    throw new ImageRedirectError(
      error instanceof Error ? error.message : String(error)
    );
  }
}

async function fetchGeneratedImage(url: string): Promise<{
  response: Response;
  finalUrl: string;
}> {
  let currentUrl = resolveReferenceImage(url);
  for (let redirects = 0; ; redirects++) {
    const response = await fetch(currentUrl, { redirect: 'manual' });
    if (response.status < 300 || response.status >= 400) {
      return { response, finalUrl: currentUrl };
    }

    const location = response.headers.get('location');
    if (!location) {
      throw new ImageRedirectError(
        `image download redirect (${response.status}) has no location`
      );
    }
    if (redirects >= MAX_IMAGE_REDIRECTS) {
      throw new ImageRedirectError('image download exceeded 3 redirects');
    }
    await response.body?.cancel();
    currentUrl = redirectedImageUrl(location, currentUrl);
  }
}

export async function readGeneratedImage(url: string): Promise<{
  body: Buffer;
  contentType: string;
  extension: string;
}> {
  const data = url.match(/^data:(image\/[a-z0-9.+-]+);base64,(.+)$/is);
  if (data) {
    const body = Buffer.from(data[2].replace(/\s+/g, ''), 'base64');
    if (body.byteLength > MAX_IMAGE_BYTES) {
      throw new Error('generated image exceeds the 50 MB storage limit');
    }
    return {
      body,
      contentType: data[1].toLowerCase(),
      extension: extensionForContentType(data[1]),
    };
  }
  if (url.startsWith('data:')) {
    throw new Error('generated image returned an unsupported data URI');
  }
  const downloadUrl = resolveReferenceImage(url);

  let lastError: unknown;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const { response, finalUrl } = await fetchGeneratedImage(downloadUrl);
      if (!response.ok) {
        const text = await response.text().catch(() => '');
        throw new Error(
          `image download failed (${response.status}): ${text.slice(0, 300)}`
        );
      }
      const declaredSize = Number(response.headers.get('content-length'));
      if (Number.isFinite(declaredSize) && declaredSize > MAX_IMAGE_BYTES) {
        throw new Error('generated image exceeds the 50 MB storage limit');
      }
      const body = await readResponseBody(response, MAX_IMAGE_BYTES);
      if (body.byteLength > MAX_IMAGE_BYTES) {
        throw new Error('generated image exceeds the 50 MB storage limit');
      }
      const responseType =
        response.headers.get('content-type')?.split(';')[0].trim() || '';
      if (
        responseType &&
        responseType !== 'application/octet-stream' &&
        !responseType.startsWith('image/')
      ) {
        throw new Error(`image download returned ${responseType}`);
      }
      const contentType = responseType.startsWith('image/')
        ? responseType
        : contentTypeForUrl(finalUrl);
      return {
        body,
        contentType,
        extension: extensionForContentType(contentType),
      };
    } catch (error) {
      if (error instanceof ImageRedirectError) throw error;
      lastError = error;
      if (attempt < 3) await sleep(attempt * 800);
    }
  }
  const host = (() => {
    try {
      return new URL(url).host;
    } catch {
      return 'unknown host';
    }
  })();
  throw new Error(
    `image download from ${host} failed after retries: ${lastError instanceof Error ? lastError.message : String(lastError)}`
  );
}

async function storeGeneratedImages(
  urls: string[],
  sessionId: string,
  storage: StorageManager
): Promise<{ files: string[]; storage: string }> {
  const files: string[] = [];
  for (let index = 0; index < urls.length; index++) {
    const image = await readGeneratedImage(urls[index]);
    const uploaded = await storage.uploadFile({
      body: image.body,
      key: `agent/sessions/${sessionId}/img_${Date.now()}_${index}.${image.extension}`,
      contentType: image.contentType,
      disposition: 'inline',
    });
    if (!uploaded.success || !uploaded.url) {
      throw new Error(uploaded.error || 'storage upload failed');
    }
    files.push(uploaded.url);
  }
  return { files, storage: storage.getProviderNames()[0] };
}

async function runImageGeneration(params: {
  ctx: ImageToolContext;
  prompt: string;
  modelKey: AgentImageModelOptionValue;
  options: Record<string, unknown>;
  signal?: AbortSignal;
}): Promise<string> {
  const { ctx, prompt, modelKey, signal } = params;
  const kind =
    Array.isArray(params.options.image_input) &&
    params.options.image_input.length > 0
      ? 'edit'
      : 'generate';
  const configs = await getAllConfigs();
  const normalizedOptions = imageProviderOptionsFor({
    modelKey,
    aspectRatio: params.options.aspect_ratio,
    resolution: params.options.resolution,
    quality: params.options.quality,
    imageInput: params.options.image_input,
  });
  const selectedProvider = pickImageProvider(
    configs,
    modelKey,
    kind,
    normalizedOptions.resolution,
    normalizedOptions.aspect_ratio
  );
  if (!selectedProvider) {
    return JSON.stringify({
      status: 'error',
      message:
        'No configured image provider supports GPT Image 2. Ask the site admin to configure EvoLink, gRouter, Replicate, or Fal in Admin Settings.',
    });
  }

  const model = resolveImageProviderModel({
    configs,
    modelKey,
    provider: selectedProvider,
    kind,
  });
  if (!model) {
    return JSON.stringify({
      status: 'error',
      message: `GPT Image 2 is not available on ${selectedProvider}.`,
    });
  }

  const storage = await getStorage();
  if (!storage) {
    return JSON.stringify({
      status: 'error',
      message:
        'Object storage is not configured. Ask the site admin to set up R2 in Admin Settings before generating images.',
    });
  }

  const providerOptions = imageProviderOptionsForProvider(
    selectedProvider,
    normalizedOptions
  );
  const costCredits = creditsForImageGeneration(
    modelKey,
    normalizedOptions.resolution,
    normalizedOptions.quality
  );
  let task: { id: string };
  try {
    task = await createTask({
      userId: ctx.userId,
      mediaType: 'image',
      provider: selectedProvider,
      model,
      prompt,
      costCredits,
      options: {
        ...normalizedOptions,
        providerModel: model,
        sessionId: ctx.sessionId,
        ...(ctx.turnId ? { turnId: ctx.turnId } : {}),
      },
    });
  } catch (error: any) {
    if (String(error?.message).includes('Insufficient credits')) {
      return JSON.stringify({
        status: 'error',
        message:
          'Insufficient credits. The user needs to top up before generating more images.',
      });
    }
    throw error;
  }

  const provider = createImageProvider(selectedProvider, configs);
  let providerTaskId = '';
  try {
    if (ctx.requireTurnLease && ctx.turnId) {
      await assertTurnLeaseOwnership({
        chatId: ctx.sessionId,
        userId: ctx.userId,
        turnId: ctx.turnId,
      });
    }
    const created = await provider.generate({
      params: {
        mediaType: AIMediaType.IMAGE,
        model,
        prompt,
        options: providerOptions,
      },
    });
    providerTaskId = created.taskId;
    let result: AITaskResult = created;
    if (
      result.taskStatus !== AITaskStatus.SUCCESS &&
      result.taskStatus !== AITaskStatus.FAILED &&
      result.taskStatus !== AITaskStatus.CANCELED
    ) {
      if (!providerTaskId) throw new Error('generation returned no task id');
      const processing = await markTaskProcessing({
        taskId: task.id,
        providerTaskId,
      });
      if (!processing) throw new Error('generation canceled');
    }

    const deadline = Date.now() + IMAGE_POLL_TIMEOUT_MS;
    const pollTask = provider.query?.bind(provider);
    while (
      result.taskStatus !== AITaskStatus.SUCCESS &&
      result.taskStatus !== AITaskStatus.FAILED &&
      result.taskStatus !== AITaskStatus.CANCELED
    ) {
      if (!pollTask) {
        throw new Error(`provider ${selectedProvider} cannot poll tasks`);
      }
      if (Date.now() > deadline) throw new Error('image generation timed out');
      await sleep(IMAGE_POLL_INTERVAL_MS, signal);
      const durableTask = await findTask(task.id);
      if (durableTask?.status === DbTaskStatus.CANCELED) {
        throw new Error('generation canceled');
      }
      result = await pollTask({
        taskId: providerTaskId,
        model,
        mediaType: AIMediaType.IMAGE,
      });
    }

    if (result.taskStatus !== AITaskStatus.SUCCESS) {
      throw new Error(
        result.taskInfo?.errorMessage || `generation ${result.taskStatus}`
      );
    }
    const durableTask = await findTask(task.id);
    if (durableTask?.status === DbTaskStatus.CANCELED) {
      throw new Error('generation canceled');
    }
    const urls = (result.taskInfo?.images ?? [])
      .map((image) => image.imageUrl)
      .filter((url): url is string => !!url)
      .slice(0, 1);
    if (urls.length === 0) throw new Error('no image returned');

    const saved = await storeGeneratedImages(urls, ctx.sessionId, storage);
    const completed = await updateTask({
      taskId: task.id,
      status: DbTaskStatus.SUCCESS,
      taskResult: { files: saved.files, model, storage: saved.storage },
    });
    if (completed.status === DbTaskStatus.CANCELED) {
      throw new Error('generation canceled');
    }
    return JSON.stringify({
      status: 'success',
      files: saved.files,
      storage: saved.storage,
      provider: selectedProvider,
      model,
      credits: costCredits,
      note: 'The chat already displays the image. Reference it in the reply as a markdown image using the returned storage URL.',
    });
  } catch (error: any) {
    const raw = String(error?.message ?? error);
    const canceled =
      signal?.aborted === true ||
      raw === 'aborted' ||
      raw.includes('generation canceled');
    if (
      (canceled || raw.includes('image generation timed out')) &&
      providerTaskId &&
      provider.cancel
    ) {
      await provider
        .cancel({
          taskId: providerTaskId,
          model,
          mediaType: AIMediaType.IMAGE,
        })
        .catch((cancelError) => {
          console.error(
            `failed to cancel ${selectedProvider} image task ${providerTaskId}:`,
            cancelError
          );
        });
    }
    await updateTask({
      taskId: task.id,
      status: canceled ? DbTaskStatus.CANCELED : DbTaskStatus.FAILED,
      taskResult: { error: raw },
    }).catch((refundError) => {
      console.error('failed to refund image generation credits:', refundError);
    });
    return JSON.stringify({
      status: canceled ? 'canceled' : 'error',
      message: canceled
        ? 'Generation stopped by the user.'
        : summarizeProviderError(raw),
    });
  }
}

export function createImageTool(ctx: ImageToolContext): ToolDefinition {
  return defineTool({
    name: 'generate_image',
    description:
      'Generate or edit one still image with GPT Image 2. To edit, restyle, or combine existing images, pass their public URLs in `reference_images`. Returns JSON with public storage URLs in `files`.',
    inputSchema: {
      type: 'object',
      properties: {
        prompt: {
          type: 'string',
          description:
            'Detailed English prompt describing the desired still image or edit',
        },
        reference_images: {
          type: 'array',
          items: { type: 'string' },
          description:
            'Optional public http(s) URLs of source images to edit, restyle, or combine, in the order the prompt refers to them.',
        },
        aspect_ratio: {
          type: 'string',
          description:
            'Optional aspect ratio such as 1:1, 16:9, 9:16, 4:3, or auto. Default 1:1.',
        },
        resolution: {
          type: 'string',
          description: 'Optional output resolution: 1K, 2K, or 4K. Default 1K.',
        },
        quality: {
          type: 'string',
          description:
            'Optional output quality: low, medium, or high. Default medium.',
        },
        model: {
          type: 'string',
          description:
            'Optional image model key. Currently only gpt-image-2 is supported.',
        },
      },
      required: ['prompt'],
    },
    isConcurrencySafe: true,
    async call(input, context) {
      const requested = String(input.model ?? DEFAULT_IMAGE_MODEL);
      if (!isImageModelOptionValue(requested)) {
        return JSON.stringify({
          status: 'error',
          message: `Unsupported image model "${requested}". Choose gpt-image-2.`,
        });
      }
      const prompt = String(input.prompt ?? '').trim();
      if (!prompt) {
        return JSON.stringify({
          status: 'error',
          message: 'generate_image needs a prompt.',
        });
      }
      if ([...prompt].length > 32_000) {
        return JSON.stringify({
          status: 'error',
          message: 'The image prompt exceeds the 32,000-character limit.',
        });
      }
      const references = Array.isArray(input.reference_images)
        ? input.reference_images
            .map((item: unknown) => String(item ?? '').trim())
            .filter(Boolean)
            .map(resolveReferenceImage)
        : [];
      return runImageGeneration({
        ctx,
        modelKey: requested,
        prompt,
        options: {
          aspect_ratio:
            input.aspect_ratio ??
            (ctx.settings?.mediaMode === 'image'
              ? ctx.settings.imageAspectRatio
              : undefined),
          resolution:
            input.resolution ??
            (ctx.settings?.mediaMode === 'image'
              ? ctx.settings.imageResolution
              : undefined),
          quality:
            input.quality ??
            (ctx.settings?.mediaMode === 'image'
              ? ctx.settings.imageQuality
              : undefined),
          ...(references.length > 0 ? { image_input: references } : {}),
        },
        signal: context.abortSignal,
      });
    },
  });
}
