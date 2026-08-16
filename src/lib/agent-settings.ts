/** The video backends an admin can route generation through. */
export type VideoProviderName = 'evolink' | 'grouter' | 'fal' | 'replicate';
export type ImageProviderName = 'evolink' | 'grouter' | 'fal' | 'replicate';

export const VIDEO_GENERATION_KINDS = [
  'generate',
  'animate',
  'reference',
  'edit',
  'extend',
] as const;
export type VideoGenerationKind = (typeof VIDEO_GENERATION_KINDS)[number];
export type VideoAttachmentType = 'image' | 'audio' | 'video';
export type VideoOperationInputLimits = {
  minimum: number;
  maximum: number;
  accepts: readonly VideoAttachmentType[];
  maximumByType: Partial<Record<VideoAttachmentType, number>>;
};

type VideoOperationConfig = {
  input: Omit<VideoOperationInputLimits, 'accepts'>;
  /** Reserved for provider/model modes whose upstream price differs. */
  creditMultiplier: number;
};

type VideoProviderRoute =
  | string
  | {
      default: string;
      byResolution?: Readonly<Record<string, string>>;
    };

type VideoProviderRoutes = Partial<
  Record<VideoGenerationKind, VideoProviderRoute>
>;

type AgentVideoModelOption = {
  value: string;
  label: string;
  creditsPerSecond: number;
  autoBillingSeconds: number;
  resolutionCreditMultipliers: Readonly<Record<string, number>>;
  durations: readonly number[];
  defaultDuration: number;
  durationMin: number;
  durationMax: number;
  supportsAutoDuration: boolean;
  resolutions: readonly string[];
  defaultResolution: string;
  aspectRatios: readonly string[];
  defaultAspectRatio: string;
  audio: boolean;
  operations: Partial<Record<VideoGenerationKind, VideoOperationConfig>>;
  providers: Record<VideoProviderName, VideoProviderRoutes | null>;
};

export interface AgentGenerationSettings {
  /** Explicit output-medium choice from the composer. */
  mediaMode?: AgentMediaMode;
  /** Picker key (`minimax-h3`) — resolved to a provider model server-side. */
  modelName?: string;
  aspectRatio?: string;
  resolution?: string;
  /** Clip length in seconds. */
  duration?: number;
  creditCost?: number;
  /** Still-image settings are separate from the video catalog above. */
  imageModelName?: AgentImageModelOptionValue;
  imageAspectRatio?: string;
  imageResolution?: string;
  imageQuality?: string;
  imageCreditCost?: number;
}

export const AGENT_MEDIA_MODES = ['auto', 'image', 'video'] as const;
export type AgentMediaMode = (typeof AGENT_MEDIA_MODES)[number];

export const AUTO_ASPECT_RATIO = 'auto';
export const ADAPTIVE_ASPECT_RATIO = 'adaptive';
export const AUTO_RESOLUTION = 'auto';
export const DEFAULT_RESOLUTION = '2K';
export const DEFAULT_DURATION = 5;

/**
 * The agent runtime starts from the ShipAny video catalog and adds provider-
 * specific models only under distinct picker keys. Never map an older provider
 * model to a newer label: the picker key is also the pricing and capability
 * boundary.
 */
export const AGENT_MODEL_OPTIONS = [
  {
    value: 'minimax-h3',
    label: 'MiniMax H3',
    creditsPerSecond: 110,
    autoBillingSeconds: 5,
    resolutionCreditMultipliers: {
      '768P': 0.75,
      '2K': 1,
      '4K': 1.5,
    },
    durations: [5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
    defaultDuration: 5,
    durationMin: 5,
    durationMax: 15,
    supportsAutoDuration: false,
    resolutions: ['768P', '2K', '4K'],
    defaultResolution: '2K',
    aspectRatios: ['adaptive', '21:9', '16:9', '4:3', '1:1', '3:4', '9:16'],
    defaultAspectRatio: 'adaptive',
    audio: false,
    operations: {
      generate: {
        input: { minimum: 0, maximum: 0, maximumByType: {} },
        creditMultiplier: 1,
      },
      animate: {
        input: {
          minimum: 1,
          maximum: 1,
          maximumByType: { image: 1 },
        },
        creditMultiplier: 1,
      },
    },
    providers: {
      evolink: null,
      grouter: {
        generate: 'minimax-h3',
        animate: 'minimax-h3',
      },
      fal: {
        generate: {
          default: 'fal-ai/minimax/hailuo-2.3/pro/text-to-video',
          byResolution: {
            '768P': 'fal-ai/minimax/hailuo-2.3/standard/text-to-video',
          },
        },
        animate: {
          default: 'fal-ai/minimax/hailuo-2.3/pro/image-to-video',
          byResolution: {
            '768P': 'fal-ai/minimax/hailuo-2.3/standard/image-to-video',
          },
        },
      },
      replicate: {
        generate: 'minimax/hailuo-2.3',
        animate: 'minimax/hailuo-2.3',
      },
    },
  },
  {
    value: 'seedance-2-5',
    label: 'Seedance 2.5',
    creditsPerSecond: 200,
    autoBillingSeconds: 5,
    resolutionCreditMultipliers: {
      '480p': 0.75,
      '720p': 1,
    },
    durations: [
      4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23,
      24, 25, 26, 27, 28, 29, 30,
    ],
    defaultDuration: 5,
    durationMin: 4,
    durationMax: 30,
    supportsAutoDuration: false,
    resolutions: ['480p', '720p'],
    defaultResolution: '720p',
    aspectRatios: ['auto', '21:9', '16:9', '4:3', '1:1', '3:4', '9:16'],
    defaultAspectRatio: 'auto',
    audio: true,
    operations: {
      generate: {
        input: { minimum: 0, maximum: 0, maximumByType: {} },
        creditMultiplier: 1,
      },
      animate: {
        input: {
          minimum: 1,
          maximum: 2,
          maximumByType: { image: 2 },
        },
        creditMultiplier: 1,
      },
      reference: {
        input: {
          minimum: 1,
          maximum: 50,
          maximumByType: { image: 30, video: 10, audio: 10 },
        },
        creditMultiplier: 1,
      },
      edit: {
        input: {
          minimum: 1,
          maximum: 1,
          maximumByType: { video: 1 },
        },
        creditMultiplier: 1,
      },
      extend: {
        input: {
          minimum: 1,
          maximum: 1,
          maximumByType: { video: 1 },
        },
        creditMultiplier: 1,
      },
    },
    providers: {
      evolink: {
        generate: 'seedance-2.5-text-to-video',
        animate: 'seedance-2.5-image-to-video',
        reference: 'seedance-2.5-reference-to-video',
        edit: 'seedance-2.5-video-edit',
        extend: 'seedance-2.5-video-extend',
      },
      grouter: {
        generate: 'seedance-2.5',
        animate: 'seedance-2.5',
        reference: 'seedance-2.5',
      },
      fal: {
        generate: 'bytedance/seedance-2.5/text-to-video',
        animate: 'bytedance/seedance-2.5/image-to-video',
      },
      // shipany-video-lite deliberately leaves this unsupported instead of
      // silently substituting an older Seedance model.
      replicate: null,
    },
  },
  {
    value: 'seedance-2-0',
    label: 'Seedance 2.0',
    creditsPerSecond: 200,
    autoBillingSeconds: 5,
    resolutionCreditMultipliers: {
      '480p': 0.46,
      '720p': 1,
      '1080p': 2.48,
    },
    durations: [4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
    defaultDuration: 5,
    durationMin: 4,
    durationMax: 15,
    supportsAutoDuration: false,
    resolutions: ['480p', '720p', '1080p'],
    defaultResolution: '720p',
    aspectRatios: ['adaptive', '21:9', '16:9', '4:3', '1:1', '3:4', '9:16'],
    defaultAspectRatio: 'adaptive',
    audio: true,
    operations: {
      generate: {
        input: { minimum: 0, maximum: 0, maximumByType: {} },
        creditMultiplier: 1,
      },
      animate: {
        input: {
          minimum: 1,
          maximum: 2,
          maximumByType: { image: 2 },
        },
        creditMultiplier: 1,
      },
      reference: {
        input: {
          minimum: 1,
          maximum: 15,
          maximumByType: { image: 9, video: 3, audio: 3 },
        },
        creditMultiplier: 1,
      },
    },
    providers: {
      evolink: {
        generate: 'seedance-2.0-text-to-video',
        animate: 'seedance-2.0-image-to-video',
        reference: 'seedance-2.0-reference-to-video',
      },
      grouter: null,
      fal: null,
      replicate: null,
    },
  },
] as const satisfies readonly AgentVideoModelOption[];

/** Image models are separate from the video composer catalog. */
export const AGENT_IMAGE_MODEL_OPTIONS = [
  {
    value: 'gpt-image-2',
    label: 'GPT Image 2',
    defaultAspectRatio: '1:1',
    defaultResolution: '1K',
    defaultQuality: 'medium',
    maxImages: 16,
    providers: {
      evolink: { model: 'gpt-image-2', editModel: 'gpt-image-2' },
      grouter: { model: 'gpt-image-2', editModel: 'gpt-image-2' },
      fal: {
        model: 'openai/gpt-image-2',
        editModel: 'openai/gpt-image-2/edit',
      },
      replicate: {
        model: 'openai/gpt-image-2',
        editModel: 'openai/gpt-image-2',
      },
    },
  },
] as const;

export type AgentImageModelOptionValue =
  (typeof AGENT_IMAGE_MODEL_OPTIONS)[number]['value'];

export const DEFAULT_IMAGE_MODEL: AgentImageModelOptionValue = 'gpt-image-2';
export const AGENT_IMAGE_ASPECT_RATIOS = [
  'auto',
  '1:1',
  '1:2',
  '2:1',
  '1:3',
  '3:1',
  '2:3',
  '3:2',
  '3:4',
  '4:3',
  '4:5',
  '5:4',
  '9:16',
  '16:9',
  '21:9',
  '9:21',
] as const;
export const AGENT_IMAGE_RESOLUTIONS = ['1K', '2K', '4K'] as const;
export const AGENT_IMAGE_QUALITIES = ['low', 'medium', 'high'] as const;

const GPT_IMAGE_2_CREDITS = {
  '1K': { low: 6, medium: 48, high: 190 },
  '2K': { low: 11, medium: 97, high: 386 },
  '4K': { low: 18, medium: 161, high: 641 },
} as const;

export type AgentModelOptionValue =
  (typeof AGENT_MODEL_OPTIONS)[number]['value'];

export const AGENT_DURATIONS = [
  4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24,
  25, 26, 27, 28, 29, 30,
] as const;

export const AGENT_ASPECT_RATIOS = [
  AUTO_ASPECT_RATIO,
  ADAPTIVE_ASPECT_RATIO,
  '21:9',
  '16:9',
  '4:3',
  '1:1',
  '3:4',
  '9:16',
] as const;

export const AGENT_RESOLUTIONS = [
  { value: '768P', label: '768P' },
  { value: '2K', label: '2K' },
  { value: '4K', label: '4K' },
  { value: '480p', label: '480p' },
  { value: '720p', label: '720p' },
  { value: '1080p', label: '1080p' },
] as const;

export interface AgentComposerSettings {
  mediaMode: AgentMediaMode;
  modelOption: AgentModelOptionValue;
  imageModelOption: AgentImageModelOptionValue;
  aspectRatio: string;
  resolution: string;
  duration: number;
  imageAspectRatio: string;
  imageResolution: string;
  imageQuality: string;
}

export function isAgentMediaMode(value: unknown): value is AgentMediaMode {
  return (AGENT_MEDIA_MODES as readonly unknown[]).includes(value);
}

export function modelOptionFor(
  value: string | undefined
): (AgentVideoModelOption & { value: AgentModelOptionValue }) | undefined {
  return AGENT_MODEL_OPTIONS.find((item) => item.value === value) as
    | (AgentVideoModelOption & { value: AgentModelOptionValue })
    | undefined;
}

export function imageModelOptionFor(value: string | undefined) {
  return AGENT_IMAGE_MODEL_OPTIONS.find((item) => item.value === value);
}

export function isImageModelOptionValue(
  value: string | undefined
): value is AgentImageModelOptionValue {
  return !!imageModelOptionFor(value);
}

export function normalizeImageAspectRatio(value: unknown): string {
  const requested = String(value ?? '');
  return (AGENT_IMAGE_ASPECT_RATIOS as readonly string[]).includes(requested)
    ? requested
    : imageModelOptionFor(DEFAULT_IMAGE_MODEL)!.defaultAspectRatio;
}

export function normalizeImageResolution(value: unknown): string {
  const requested = String(value ?? '').toUpperCase();
  return (AGENT_IMAGE_RESOLUTIONS as readonly string[]).includes(requested)
    ? requested
    : imageModelOptionFor(DEFAULT_IMAGE_MODEL)!.defaultResolution;
}

export function normalizeImageQuality(value: unknown): string {
  const requested = String(value ?? '').toLowerCase();
  return (AGENT_IMAGE_QUALITIES as readonly string[]).includes(requested)
    ? requested
    : imageModelOptionFor(DEFAULT_IMAGE_MODEL)!.defaultQuality;
}

/** Server-authoritative GPT Image 2 cost for one output image. */
export function creditsForImageGeneration(
  modelKey: string | undefined,
  resolution?: unknown,
  quality?: unknown
): number {
  if (!isImageModelOptionValue(modelKey)) {
    return Math.max(
      ...Object.values(GPT_IMAGE_2_CREDITS).flatMap((prices) =>
        Object.values(prices)
      )
    );
  }
  const normalizedResolution = normalizeImageResolution(resolution);
  const normalizedQuality = normalizeImageQuality(quality);
  return (GPT_IMAGE_2_CREDITS as Record<string, Record<string, number>>)[
    normalizedResolution
  ][normalizedQuality];
}

export function imageProviderModelFor(
  modelKey: string | undefined,
  provider: ImageProviderName,
  kind: 'generate' | 'edit',
  overrides?: Record<string, string>
): string | undefined {
  if (!isImageModelOptionValue(modelKey)) return undefined;
  const override = overrides?.[modelKey];
  if (override) return override;
  const ids = imageModelOptionFor(modelKey)?.providers[provider];
  return kind === 'edit' ? ids?.editModel : ids?.model;
}

export function isModelOptionValue(
  value: string | undefined
): value is AgentModelOptionValue {
  return !!modelOptionFor(value);
}

export function durationsForModel(
  value: string | undefined
): readonly number[] {
  return modelOptionFor(value)?.durations ?? [DEFAULT_DURATION];
}

export function aspectRatiosForModel(
  value: string | undefined
): readonly string[] {
  return modelOptionFor(value)?.aspectRatios ?? [ADAPTIVE_ASPECT_RATIO];
}

export function resolutionsForModel(
  value: string | undefined
): readonly string[] {
  return modelOptionFor(value)?.resolutions ?? [DEFAULT_RESOLUTION];
}

export function isAutoAspectRatio(value: string): boolean {
  return value === AUTO_ASPECT_RATIO || value === ADAPTIVE_ASPECT_RATIO;
}

export function isAspectRatioValue(value: unknown): value is string {
  return AGENT_ASPECT_RATIOS.some((ratio) => ratio === value);
}

export function isResolutionValue(value: unknown): value is string {
  return AGENT_RESOLUTIONS.some((item) => item.value === value);
}

export function isDurationValue(value: unknown): value is number {
  return (
    typeof value === 'number' &&
    Number.isFinite(value) &&
    AGENT_DURATIONS.some((seconds) => seconds === value)
  );
}

/** Match video-lite: continuous integer duration, clamped to model bounds. */
export function normalizeDurationForModel(
  modelKey: string | undefined,
  value: unknown
): number {
  const option = modelOptionFor(modelKey);
  if (!option) return DEFAULT_DURATION;
  const requested =
    typeof value === 'number' && Number.isFinite(value)
      ? Math.round(value)
      : option.defaultDuration;
  return Math.min(option.durationMax, Math.max(option.durationMin, requested));
}

/** Reset values that are invalid for the newly selected model. */
export function settingsForModel(
  settings: AgentComposerSettings,
  modelKey: AgentModelOptionValue
): AgentComposerSettings {
  const option = modelOptionFor(modelKey);
  if (!option) return defaultComposerSettings();

  // video-lite resets all controls to the new model's defaults when the
  // picker changes, even when an old value happens to be supported by both.
  if (settings.modelOption !== modelKey) {
    return {
      ...settings,
      modelOption: modelKey,
      duration: option.defaultDuration,
      aspectRatio: option.defaultAspectRatio,
      resolution: option.defaultResolution,
    };
  }

  return {
    ...settings,
    modelOption: modelKey,
    duration: normalizeDurationForModel(modelKey, settings.duration),
    aspectRatio: (option.aspectRatios as readonly string[]).includes(
      settings.aspectRatio
    )
      ? settings.aspectRatio
      : option.defaultAspectRatio,
    resolution: (option.resolutions as readonly string[]).includes(
      settings.resolution
    )
      ? settings.resolution
      : option.defaultResolution,
  };
}

export function settingsForImageModel(
  settings: AgentComposerSettings,
  modelKey: AgentImageModelOptionValue
): AgentComposerSettings {
  const option = imageModelOptionFor(modelKey);
  if (!option) return defaultComposerSettings();
  if (settings.imageModelOption !== modelKey) {
    return {
      ...settings,
      imageModelOption: modelKey,
      imageAspectRatio: option.defaultAspectRatio,
      imageResolution: option.defaultResolution,
      imageQuality: option.defaultQuality,
    };
  }
  return {
    ...settings,
    imageModelOption: modelKey,
    imageAspectRatio: normalizeImageAspectRatio(settings.imageAspectRatio),
    imageResolution: normalizeImageResolution(settings.imageResolution),
    imageQuality: normalizeImageQuality(settings.imageQuality),
  };
}

export function defaultComposerSettings(): AgentComposerSettings {
  const option = AGENT_MODEL_OPTIONS[0];
  const imageOption = imageModelOptionFor(DEFAULT_IMAGE_MODEL)!;
  return {
    mediaMode: 'auto',
    modelOption: option.value,
    imageModelOption: imageOption.value,
    aspectRatio: option.defaultAspectRatio,
    resolution: option.defaultResolution,
    duration: option.defaultDuration,
    imageAspectRatio: imageOption.defaultAspectRatio,
    imageResolution: imageOption.defaultResolution,
    imageQuality: imageOption.defaultQuality,
  };
}

/** Hydrate persisted or pre-upgrade composer state against today's catalog. */
export function normalizeComposerSettings(
  settings: Partial<AgentComposerSettings> | undefined
): AgentComposerSettings {
  const defaults = defaultComposerSettings();
  const modelOption = isModelOptionValue(settings?.modelOption)
    ? settings.modelOption
    : defaults.modelOption;
  const imageModelOption = isImageModelOptionValue(settings?.imageModelOption)
    ? settings.imageModelOption
    : defaults.imageModelOption;
  return settingsForModel(
    {
      mediaMode: isAgentMediaMode(settings?.mediaMode)
        ? settings.mediaMode
        : defaults.mediaMode,
      modelOption,
      imageModelOption,
      aspectRatio: isAspectRatioValue(settings?.aspectRatio)
        ? settings.aspectRatio
        : defaults.aspectRatio,
      resolution: isResolutionValue(settings?.resolution)
        ? settings.resolution
        : defaults.resolution,
      duration: isDurationValue(settings?.duration)
        ? settings.duration
        : defaults.duration,
      imageAspectRatio: normalizeImageAspectRatio(settings?.imageAspectRatio),
      imageResolution: normalizeImageResolution(settings?.imageResolution),
      imageQuality: normalizeImageQuality(settings?.imageQuality),
    },
    modelOption
  );
}

export function resolveGenerationSettings(
  settings: AgentComposerSettings
): AgentGenerationSettings {
  const normalized = normalizeComposerSettings(settings);
  return {
    mediaMode: normalized.mediaMode,
    modelName: normalized.modelOption,
    aspectRatio: normalized.aspectRatio,
    resolution: normalized.resolution,
    duration: normalized.duration,
    creditCost: creditsForGeneration(
      normalized.modelOption,
      normalized.duration,
      normalized.resolution
    ),
    imageModelName: normalized.imageModelOption,
    imageAspectRatio: normalizeImageAspectRatio(normalized.imageAspectRatio),
    imageResolution: normalizeImageResolution(normalized.imageResolution),
    imageQuality: normalizeImageQuality(normalized.imageQuality),
    imageCreditCost: creditsForImageGeneration(
      normalized.imageModelOption,
      normalized.imageResolution,
      normalized.imageQuality
    ),
  };
}

/** Validate settings from the API request against the server catalog. */
export function normalizeClientGenerationSettings(
  settings: AgentGenerationSettings | undefined
): AgentGenerationSettings | null {
  const defaults = defaultComposerSettings();
  const mediaMode = settings?.mediaMode ?? defaults.mediaMode;
  if (!isAgentMediaMode(mediaMode)) return null;
  const modelOption = settings?.modelName ?? defaults.modelOption;
  if (!isModelOptionValue(modelOption)) return null;
  const imageModelOption =
    settings?.imageModelName ?? defaults.imageModelOption;
  if (!isImageModelOptionValue(imageModelOption)) return null;

  return resolveGenerationSettings(
    settingsForModel(
      {
        mediaMode,
        modelOption,
        imageModelOption,
        aspectRatio: settings?.aspectRatio ?? defaults.aspectRatio,
        resolution: settings?.resolution ?? defaults.resolution,
        duration:
          typeof settings?.duration === 'number'
            ? settings.duration
            : defaults.duration,
        imageAspectRatio: normalizeImageAspectRatio(
          settings?.imageAspectRatio ?? defaults.imageAspectRatio
        ),
        imageResolution: normalizeImageResolution(
          settings?.imageResolution ?? defaults.imageResolution
        ),
        imageQuality: normalizeImageQuality(
          settings?.imageQuality ?? defaults.imageQuality
        ),
      },
      modelOption
    )
  );
}

/** Server-authoritative price formula and per-model resolution multipliers. */
export function creditsForGeneration(
  modelKey: string | undefined,
  durationSeconds?: number,
  resolution?: string,
  operation: VideoGenerationKind = 'generate'
): number {
  const option = modelOptionFor(modelKey);
  const highestRate = Math.max(
    ...AGENT_MODEL_OPTIONS.map((item) => item.creditsPerSecond)
  );
  const seconds = option
    ? normalizeDurationForModel(option.value, durationSeconds)
    : Number.isFinite(durationSeconds) && Number(durationSeconds) > 0
      ? Math.round(Number(durationSeconds))
      : DEFAULT_DURATION;
  const rate = option?.creditsPerSecond ?? highestRate;
  const multiplier = option
    ? ((option.resolutionCreditMultipliers as Record<string, number>)[
        resolution ?? option.defaultResolution
      ] ?? 1)
    : 1;
  const operationMultiplier = option
    ? (option.operations[operation]?.creditMultiplier ?? 1)
    : 1;
  return (
    Math.ceil((rate * seconds * multiplier * operationMultiplier) / 10) * 10
  );
}

function routeIds(route: VideoProviderRoute): string[] {
  return typeof route === 'string'
    ? [route]
    : [route.default, ...Object.values(route.byResolution ?? {})];
}

/** Friendly name for a picker key or a provider id recorded on a task. */
export function labelForGeneratedModel(modelId: string): string {
  const imageOption = AGENT_IMAGE_MODEL_OPTIONS.find(
    (item) =>
      item.value === modelId ||
      Object.values(item.providers).some(
        (ids) => ids.model === modelId || ids.editModel === modelId
      )
  );
  if (imageOption) return imageOption.label;
  const option = AGENT_MODEL_OPTIONS.find(
    (item) =>
      item.value === modelId ||
      Object.values(
        item.providers as Record<VideoProviderName, VideoProviderRoutes | null>
      ).some(
        (routes) =>
          routes !== null &&
          (Object.values(routes) as VideoProviderRoute[]).some((route) =>
            routeIds(route).includes(modelId)
          )
      )
  );
  return option?.label ?? modelId;
}

export function labelForModelOption(value: string) {
  return modelOptionFor(value)?.label || 'Auto';
}

/** Resolve the exact provider route used by video-lite. */
export function providerModelFor(
  modelKey: string | undefined,
  provider: VideoProviderName,
  kind: VideoGenerationKind,
  resolution?: string
): string | undefined {
  const option = modelOptionFor(modelKey);
  if (!option) return undefined;
  const route = option.providers[provider]?.[kind];
  if (!route) return undefined;
  return typeof route === 'string'
    ? route
    : (route.byResolution?.[resolution ?? ''] ?? route.default);
}

export function videoOperationSupported(
  modelKey: string | undefined,
  kind: VideoGenerationKind
): boolean {
  const option = modelOptionFor(modelKey);
  return (
    Boolean(option?.operations[kind]) &&
    (['evolink', 'grouter', 'fal', 'replicate'] as const).some((provider) =>
      Boolean(providerModelFor(modelKey, provider, kind))
    )
  );
}

export function videoOperationsForModel(
  modelKey: string | undefined
): VideoGenerationKind[] {
  return VIDEO_GENERATION_KINDS.filter((kind) =>
    videoOperationSupported(modelKey, kind)
  );
}

export function defaultVideoModelForOperation(
  operation: VideoGenerationKind
): AgentModelOptionValue | undefined {
  return AGENT_MODEL_OPTIONS.find((option) =>
    videoOperationSupported(option.value, operation)
  )?.value;
}

export function videoOperationInputLimits(
  modelKey: string | undefined,
  kind: VideoGenerationKind
): VideoOperationInputLimits | null {
  const option = modelOptionFor(modelKey);
  if (!option || !videoOperationSupported(modelKey, kind)) return null;
  const config = option.operations[kind];
  if (!config) return null;
  const accepts = (['image', 'video', 'audio'] as const).filter(
    (mediaType) => (config.input.maximumByType[mediaType] ?? 0) > 0
  );
  return {
    minimum: config.input.minimum,
    maximum: config.input.maximum,
    accepts,
    maximumByType: config.input.maximumByType,
  };
}

/** Union policy for the composer; the selected tool applies the stricter mode policy. */
export function videoModelAttachmentPolicy(modelKey: string | undefined): {
  minimum: 0;
  maximum: number;
  accepts: readonly VideoAttachmentType[];
} {
  const limits = VIDEO_GENERATION_KINDS.flatMap((kind) => {
    const value = videoOperationInputLimits(modelKey, kind);
    return value ? [value] : [];
  });
  const accepts = (['image', 'video', 'audio'] as const).filter((mediaType) =>
    limits.some((limit) => limit.accepts.includes(mediaType))
  );
  return {
    minimum: 0,
    maximum: Math.max(0, ...limits.map((limit) => limit.maximum)),
    accepts,
  };
}

/** Union policy for a semantic tool page across every compatible model. */
export function videoOperationAttachmentPolicy(
  operation: VideoGenerationKind
): VideoOperationInputLimits {
  const limits = AGENT_MODEL_OPTIONS.flatMap((option) => {
    const value = videoOperationInputLimits(option.value, operation);
    return value ? [value] : [];
  });
  const accepts = (['image', 'video', 'audio'] as const).filter((mediaType) =>
    limits.some((limit) => limit.accepts.includes(mediaType))
  );
  return {
    minimum: limits.length
      ? Math.min(...limits.map((limit) => limit.minimum))
      : 0,
    maximum: Math.max(0, ...limits.map((limit) => limit.maximum)),
    accepts,
    maximumByType: Object.fromEntries(
      accepts.map((mediaType) => [
        mediaType,
        Math.max(
          0,
          ...limits.map((limit) => limit.maximumByType[mediaType] ?? 0)
        ),
      ])
    ),
  };
}

export function videoModelMaximumForType(
  modelKey: string | undefined,
  mediaType: VideoAttachmentType
): number {
  return Math.max(
    0,
    ...VIDEO_GENERATION_KINDS.map(
      (kind) =>
        videoOperationInputLimits(modelKey, kind)?.maximumByType[mediaType] ?? 0
    )
  );
}
