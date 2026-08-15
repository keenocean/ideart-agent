import {
  EvoLinkProvider,
  FalProvider,
  GRouterProvider,
  ReplicateProvider,
  type AIProvider,
} from '@/core/ai';
import { envConfigs } from '@/config';
import {
  DEFAULT_IMAGE_MODEL,
  imageModelOptionFor,
  imageProviderModelFor,
  normalizeImageAspectRatio,
  normalizeImageQuality,
  normalizeImageResolution,
  type AgentImageModelOptionValue,
  type ImageProviderName,
} from '@/lib/agent-settings';

export function createImageProvider(
  provider: ImageProviderName,
  configs: Record<string, any>
): AIProvider {
  switch (provider) {
    case 'evolink':
      return new EvoLinkProvider({
        apiKey: configs.evolink_api_key,
        baseUrl: configs.evolink_base_url,
      });
    case 'grouter':
      return new GRouterProvider({
        apiKey: configs.grouter_api_key,
        baseUrl: configs.grouter_base_url,
        appName: envConfigs.app_name,
        appUrl: envConfigs.app_url,
      });
    case 'replicate':
      return new ReplicateProvider({
        apiToken: configs.replicate_api_token,
      });
    case 'fal':
      return new FalProvider({ apiKey: configs.fal_api_key });
  }
}

function grouterModelMap(
  configs: Record<string, any>
): Record<string, string> | undefined {
  const raw = String(configs.grouter_model_map ?? '').trim();
  if (!raw) return undefined;
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return undefined;
    }
    const mapping: Record<string, string> = {};
    for (const [key, value] of Object.entries(parsed)) {
      if (typeof value === 'string' && value.trim()) {
        mapping[key] = value.trim();
      }
    }
    return Object.keys(mapping).length > 0 ? mapping : undefined;
  } catch {
    console.warn('[agent tools] grouter_model_map is not valid JSON');
    return undefined;
  }
}

export function resolveImageProviderModel(params: {
  configs: Record<string, any>;
  modelKey: string;
  provider: ImageProviderName;
  kind: 'generate' | 'edit';
}): string | undefined {
  return imageProviderModelFor(
    params.modelKey,
    params.provider,
    params.kind,
    params.provider === 'grouter' ? grouterModelMap(params.configs) : undefined
  );
}

export function hasConfiguredImageProvider(
  configs: Record<string, any>
): boolean {
  return Boolean(
    configs.evolink_api_key ||
    (configs.grouter_api_key && configs.grouter_base_url) ||
    configs.fal_api_key ||
    configs.replicate_api_token
  );
}

export function pickImageProvider(
  configs: Record<string, any>,
  modelKey: string = DEFAULT_IMAGE_MODEL,
  kind: 'generate' | 'edit' = 'generate',
  resolution: unknown = '1K',
  aspectRatio: unknown = '1:1'
): ImageProviderName | null {
  const configured: Record<ImageProviderName, boolean> = {
    evolink: !!configs.evolink_api_key,
    grouter: !!configs.grouter_api_key && !!configs.grouter_base_url,
    fal: !!configs.fal_api_key,
    replicate: !!configs.replicate_api_token,
  };
  const preferred = String(configs.default_image_provider || 'auto');
  const fallbackOrder: ImageProviderName[] = [
    'evolink',
    'grouter',
    'replicate',
    'fal',
  ];
  const order =
    preferred !== 'auto' &&
    fallbackOrder.includes(preferred as ImageProviderName)
      ? [
          preferred as ImageProviderName,
          ...fallbackOrder.filter((name) => name !== preferred),
        ]
      : fallbackOrder;
  const normalizedResolution = normalizeImageResolution(resolution);
  const normalizedAspectRatio = normalizeImageAspectRatio(aspectRatio);

  return (
    order.find(
      (provider) =>
        configured[provider] &&
        imageProviderSupports(
          provider,
          normalizedResolution,
          normalizedAspectRatio
        ) &&
        !!resolveImageProviderModel({
          configs,
          modelKey,
          provider,
          kind,
        })
    ) ?? null
  );
}

function imageProviderSupports(
  provider: ImageProviderName,
  resolution: string,
  aspectRatio: string
): boolean {
  if (provider !== 'replicate') return true;
  return (
    resolution === '1K' && ['auto', '1:1', '3:2', '2:3'].includes(aspectRatio)
  );
}

export function imageProviderOptionsFor(params: {
  modelKey: AgentImageModelOptionValue;
  aspectRatio?: unknown;
  resolution?: unknown;
  quality?: unknown;
  imageInput?: unknown;
}): Record<string, unknown> {
  const model = imageModelOptionFor(params.modelKey)!;
  const imageInput = Array.isArray(params.imageInput)
    ? params.imageInput.map(String).filter(Boolean).slice(0, model.maxImages)
    : [];
  return {
    aspect_ratio: normalizeImageAspectRatio(params.aspectRatio),
    resolution: normalizeImageResolution(params.resolution),
    quality: normalizeImageQuality(params.quality),
    n: 1,
    ...(imageInput.length > 0 ? { image_input: imageInput } : {}),
  };
}

const LANDSCAPE_DIMENSIONS = {
  '1K': {
    '1:1': [1024, 1024],
    '2:1': [1456, 720],
    '3:1': [1776, 592],
    '3:2': [1248, 832],
    '4:3': [1184, 880],
    '5:4': [1152, 912],
    '16:9': [1360, 768],
    '21:9': [1568, 672],
  },
  '2K': {
    '1:1': [2048, 2048],
    '2:1': [2896, 1456],
    '3:1': [3552, 1184],
    '3:2': [2512, 1680],
    '4:3': [2368, 1776],
    '5:4': [2288, 1824],
    '16:9': [2736, 1536],
    '21:9': [3136, 1344],
  },
  '4K': {
    '1:1': [2880, 2880],
    '2:1': [3840, 1920],
    '3:1': [3840, 1280],
    '3:2': [3520, 2352],
    '4:3': [3312, 2480],
    '5:4': [3216, 2576],
    '16:9': [3840, 2160],
    '21:9': [3840, 1632],
  },
} as const;

function imageDimensions(
  aspectRatio: string,
  resolution: string
): { width: number; height: number } | undefined {
  if (aspectRatio === 'auto') return undefined;
  const [widthRatio, heightRatio] = aspectRatio.split(':').map(Number);
  if (!widthRatio || !heightRatio) return undefined;
  const landscape =
    widthRatio >= heightRatio ? aspectRatio : `${heightRatio}:${widthRatio}`;
  const dimensions = (
    LANDSCAPE_DIMENSIONS as Record<
      string,
      Record<string, readonly [number, number]>
    >
  )[resolution]?.[landscape];
  if (!dimensions) return undefined;
  const [width, height] = dimensions;
  return widthRatio >= heightRatio
    ? { width, height }
    : { width: height, height: width };
}

/** Convert the canonical EvoLink-shaped options to each adapter's API. */
export function imageProviderOptionsForProvider(
  provider: ImageProviderName,
  options: Record<string, unknown>
): Record<string, unknown> {
  const aspectRatio = String(options.aspect_ratio ?? '1:1');
  const resolution = String(options.resolution ?? '1K');
  const quality = String(options.quality ?? 'medium');
  const imageInput = Array.isArray(options.image_input)
    ? options.image_input
    : undefined;
  const dimensions = imageDimensions(aspectRatio, resolution);

  if (provider === 'evolink') return options;
  if (provider === 'fal') {
    return {
      image_size: dimensions ?? 'auto',
      quality,
      num_images: 1,
      ...(imageInput ? { image_input: imageInput } : {}),
    };
  }
  if (provider === 'replicate') {
    return {
      aspect_ratio: aspectRatio === 'auto' ? '1:1' : aspectRatio,
      quality,
      number_of_images: 1,
      ...(imageInput ? { image_input: imageInput } : {}),
    };
  }
  return {
    ...(dimensions ? { size: `${dimensions.width}x${dimensions.height}` } : {}),
    quality,
    n: 1,
    ...(imageInput ? { image_input: imageInput } : {}),
  };
}
