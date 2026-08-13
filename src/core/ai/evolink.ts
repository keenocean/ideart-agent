import {
  AIMediaType,
  AITaskStatus,
  type AIFile,
  type AIGenerateParams,
  type AIImage,
  type AIProvider,
  type AITaskResult,
  type AIVideo,
  type SaveFilesFunction,
  type UuidFunction,
} from './types';

const EVOLINK_DEFAULT_BASE_URL = 'https://api.evolink.ai';
const defaultUuid: UuidFunction = () => crypto.randomUUID();

type EvoLinkFetch = (
  input: string | URL | Request,
  init?: RequestInit
) => Promise<Response>;

/** EvoLink multimodal API configuration. */
export interface EvoLinkConfigs {
  apiKey: string;
  baseUrl?: string;
  customStorage?: boolean;
  saveFiles?: SaveFilesFunction;
  uuid?: UuidFunction;
  fetch?: EvoLinkFetch;
}

function cleanString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function record(value: unknown): Record<string, any> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, any>)
    : {};
}

function firstString(...values: unknown[]): string {
  for (const value of values) {
    const clean = cleanString(value);
    if (clean) return clean;
  }
  return '';
}

function validCallbackUrl(value: unknown): string {
  const clean = cleanString(value);
  if (!clean) return '';
  try {
    const url = new URL(clean);
    const hostname = url.hostname.toLowerCase();
    if (url.protocol !== 'https:') return '';
    if (
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname === '::1' ||
      hostname.endsWith('.localhost')
    ) {
      return '';
    }
    return url.toString();
  } catch {
    return '';
  }
}

function taskCreatedAt(value: unknown): Date {
  const seconds = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(seconds) && seconds > 0
    ? new Date(seconds * 1000)
    : new Date();
}

/**
 * EvoLink image/video provider.
 *
 * Multimodal requests use EvoLink's common submit -> poll -> result flow.
 * Generated URLs are normalized into the same AITaskResult shape used by the
 * existing Fal, gRouter, and Replicate providers.
 */
export class EvoLinkProvider implements AIProvider {
  readonly name = 'evolink';
  configs: EvoLinkConfigs;

  constructor(configs: EvoLinkConfigs) {
    this.configs = configs;
  }

  private get baseUrl(): string {
    return (
      cleanString(this.configs.baseUrl) || EVOLINK_DEFAULT_BASE_URL
    ).replace(/\/+$/g, '');
  }

  private get request(): EvoLinkFetch {
    return this.configs.fetch ?? fetch;
  }

  private getUuid(): string {
    return (this.configs.uuid || defaultUuid)();
  }

  private headers(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${this.configs.apiKey}`,
    };
  }

  private async responsePayload(response: Response): Promise<unknown> {
    return response.json().catch(() => ({}));
  }

  private providerError(payload: unknown, status: number): string {
    const body = record(payload);
    const error = record(body.error);
    return (
      firstString(error.message, body.message) ||
      `EvoLink request failed (${status})`
    );
  }

  private async trySaveFiles(files: AIFile[]): Promise<AIFile[] | undefined> {
    if (!this.configs.saveFiles) return undefined;
    try {
      return await this.configs.saveFiles(files);
    } catch (error) {
      console.error('save files failed:', error);
      return undefined;
    }
  }

  private formatInput(params: AIGenerateParams): Record<string, unknown> {
    const options = record(params.options);
    const input: Record<string, unknown> = { ...options };
    const imageInput = Array.isArray(options.image_input)
      ? options.image_input
      : Array.isArray(options.image_urls)
        ? options.image_urls
        : [];
    const videoInput = Array.isArray(options.video_input)
      ? options.video_input
      : Array.isArray(options.video_urls)
        ? options.video_urls
        : [];

    delete input.image_input;
    delete input.video_input;
    delete input.model;
    delete input.prompt;

    if (imageInput.length > 0) input.image_urls = imageInput;
    if (videoInput.length > 0) input.video_urls = videoInput;

    if (params.mediaType === AIMediaType.IMAGE) {
      const aspectRatio = firstString(options.aspect_ratio);
      if (aspectRatio && !firstString(options.size)) input.size = aspectRatio;
      delete input.aspect_ratio;
    }

    input.model = params.model;
    input.prompt = params.prompt;

    const callbackUrl = validCallbackUrl(params.callbackUrl);
    if (callbackUrl) input.callback_url = callbackUrl;

    return input;
  }

  async generate({
    params,
  }: {
    params: AIGenerateParams;
  }): Promise<AITaskResult> {
    if (
      params.mediaType !== AIMediaType.IMAGE &&
      params.mediaType !== AIMediaType.VIDEO
    ) {
      throw new Error(`mediaType not supported: ${params.mediaType}`);
    }
    if (!params.model) throw new Error('model is required');
    if (!params.prompt) throw new Error('prompt is required');

    const resource =
      params.mediaType === AIMediaType.VIDEO ? 'videos' : 'images';
    const response = await this.request(
      `${this.baseUrl}/v1/${resource}/generations`,
      {
        method: 'POST',
        headers: this.headers(),
        body: JSON.stringify(this.formatInput(params)),
      }
    );
    const payload = await this.responsePayload(response);
    if (!response.ok) {
      throw new Error(this.providerError(payload, response.status));
    }

    const body = record(payload);
    const taskId = firstString(body.id);
    if (!taskId) throw new Error('EvoLink generation failed: no task id');

    return {
      taskStatus: this.mapStatus(firstString(body.status) || 'pending'),
      taskId,
      taskInfo: {},
      taskResult: payload,
    };
  }

  private async persistResults(params: {
    mediaType: AIMediaType;
    urls: string[];
    createdAt: Date;
  }): Promise<{ images?: AIImage[]; videos?: AIVideo[] }> {
    if (params.mediaType === AIMediaType.VIDEO) {
      const videos: AIVideo[] = params.urls.map((videoUrl) => ({
        id: '',
        createTime: params.createdAt,
        videoUrl,
      }));
      if (!this.configs.customStorage || videos.length === 0) {
        return { videos };
      }
      const saved = await this.trySaveFiles(
        videos.map((video, index) => ({
          url: video.videoUrl || '',
          contentType: 'video/mp4',
          key: `evolink/video/${this.getUuid()}.mp4`,
          index,
          type: 'video',
        }))
      );
      for (const file of saved ?? []) {
        if (file.index !== undefined && videos[file.index] && file.url) {
          videos[file.index].videoUrl = file.url;
        }
      }
      return { videos };
    }

    const images: AIImage[] = params.urls.map((imageUrl) => ({
      id: '',
      createTime: params.createdAt,
      imageUrl,
    }));
    if (!this.configs.customStorage || images.length === 0) return { images };
    const saved = await this.trySaveFiles(
      images.map((image, index) => ({
        url: image.imageUrl || '',
        contentType: 'image/png',
        key: `evolink/image/${this.getUuid()}.png`,
        index,
        type: 'image',
      }))
    );
    for (const file of saved ?? []) {
      if (file.index !== undefined && images[file.index] && file.url) {
        images[file.index].imageUrl = file.url;
      }
    }
    return { images };
  }

  async query({
    taskId,
    mediaType,
  }: {
    taskId: string;
    mediaType?: string;
    model?: string;
  }): Promise<AITaskResult> {
    if (!taskId) throw new Error('taskId is required');
    const response = await this.request(
      `${this.baseUrl}/v1/tasks/${encodeURIComponent(taskId)}`,
      {
        method: 'GET',
        headers: this.headers(),
      }
    );
    const payload = await this.responsePayload(response);
    if (!response.ok) {
      throw new Error(this.providerError(payload, response.status));
    }

    const body = record(payload);
    const taskStatus = this.mapStatus(firstString(body.status));
    const resolvedMediaType =
      mediaType === AIMediaType.VIDEO ||
      firstString(body.type).toLowerCase() === 'video'
        ? AIMediaType.VIDEO
        : AIMediaType.IMAGE;
    const urls = Array.isArray(body.results)
      ? body.results.map(cleanString).filter(Boolean)
      : [];
    const createdAt = taskCreatedAt(body.created);
    const persisted =
      taskStatus === AITaskStatus.SUCCESS
        ? await this.persistResults({
            mediaType: resolvedMediaType,
            urls,
            createdAt,
          })
        : {};
    const error = record(body.error);

    return {
      taskId,
      taskStatus,
      taskInfo: {
        ...persisted,
        status: firstString(body.status),
        errorCode: firstString(error.code),
        errorMessage: firstString(error.message),
        createTime: createdAt,
      },
      taskResult: payload,
    };
  }

  private mapStatus(status: string): AITaskStatus {
    switch (status.toLowerCase()) {
      case 'pending':
      case 'queued':
        return AITaskStatus.PENDING;
      case 'processing':
      case 'running':
        return AITaskStatus.PROCESSING;
      case 'completed':
      case 'success':
        return AITaskStatus.SUCCESS;
      case 'failed':
      case 'error':
        return AITaskStatus.FAILED;
      case 'cancelled':
      case 'canceled':
        return AITaskStatus.CANCELED;
      default:
        throw new Error(`unknown status: ${status}`);
    }
  }
}
