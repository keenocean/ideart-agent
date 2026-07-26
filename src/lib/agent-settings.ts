/** The image backends an admin can route generation through. */
export type ImageProviderName = 'fal' | 'replicate' | 'grouter';

export interface AgentGenerationSettings {
  /** Picker key (`gpt-image-2`) — the concrete provider model id is resolved
   *  server-side, once the active provider is known. */
  modelName?: string;
  aspectRatio?: string;
  resolution?: string;
  creditCost?: number;
}

export const AUTO_ASPECT_RATIO = 'auto';
export const AUTO_RESOLUTION = 'auto';
export const DEFAULT_RESOLUTION = AUTO_RESOLUTION;

/**
 * The models offered in the composer, each mapped to the id every supported
 * provider knows it by. Switching the admin's default provider therefore
 * doesn't change what the user picked — only which id we send.
 *
 * `grouter` ids are route names inside the gateway, which the admin defines;
 * these are the sensible defaults and `grouter_model_map` overrides them —
 * one route serves both directions there, since the gateway resolves the edit
 * upstream model itself. Where a provider serves generation and editing from
 * one id, both fields carry the same value.
 *
 * Credit prices are set against each model's real upstream cost, on the
 * standard ruler of 200 credits per US dollar (the $10 top-up rate). Plans
 * hand out credits more cheaply than that — Ultra yearly works out to ~304
 * credits per dollar — so a heavy subscriber on the top tier is subsidised.
 * That is deliberate; what isn't acceptable is a price below cost at every
 * tier, which is what nano-banana-pro's old 30 credits was.
 */
export const AGENT_MODEL_OPTIONS = [
  {
    value: 'gpt-image-2',
    label: 'GPT Image 2',
    // Upstream $0.22. Credits sell at 200 per US dollar at the standard
    // rate, so 50 credits is $0.25 — see the note above the list.
    credits: 50,
    providers: {
      fal: {
        model: 'openai/gpt-image-2',
        editModel: 'openai/gpt-image-2/edit',
      },
      replicate: {
        model: 'openai/gpt-image-2',
        editModel: 'openai/gpt-image-2',
      },
      grouter: { model: 'gpt-image-2', editModel: 'gpt-image-2' },
    },
  },
  {
    value: 'nano-banana-pro',
    label: 'Nano Banana Pro',
    // Upstream $0.30 — the priciest of the three, despite the name reading
    // like a step up from nano-banana-2 rather than from gpt-image-2.
    credits: 70,
    providers: {
      fal: {
        model: 'fal-ai/nano-banana-pro',
        editModel: 'fal-ai/nano-banana-pro/edit',
      },
      replicate: {
        model: 'google/nano-banana-pro',
        editModel: 'google/nano-banana-pro',
      },
      grouter: { model: 'nano-banana-pro', editModel: 'nano-banana-pro' },
    },
  },
  {
    value: 'nano-banana-2',
    label: 'Nano Banana 2',
    // Upstream $0.16, the cheapest of the three — which is why it's the
    // default a new account starts on.
    credits: 40,
    providers: {
      fal: {
        model: 'fal-ai/nano-banana-2',
        editModel: 'fal-ai/nano-banana-2/edit',
      },
      replicate: {
        model: 'google/nano-banana-2',
        editModel: 'google/nano-banana-2',
      },
      grouter: { model: 'nano-banana-2', editModel: 'nano-banana-2' },
    },
  },
] as const;

export const AGENT_ASPECT_RATIOS = [
  AUTO_ASPECT_RATIO,
  '1:1',
  '4:3',
  '3:4',
  '16:9',
  '9:16',
  '21:9',
  '9:21',
] as const;

export const AGENT_RESOLUTIONS = [
  {
    value: AUTO_RESOLUTION,
    label: 'Auto',
  },
  {
    value: '1k',
    label: '1K',
  },
  {
    value: '2k',
    label: '2K',
  },
  {
    value: '4k',
    label: '4K',
  },
] as const;

export type AgentModelOptionValue =
  (typeof AGENT_MODEL_OPTIONS)[number]['value'];

export interface AgentComposerSettings {
  modelOption: AgentModelOptionValue;
  aspectRatio: string;
  resolution: string;
}

export function isAspectRatioValue(value: unknown): value is string {
  return AGENT_ASPECT_RATIOS.some((ratio) => ratio === value);
}

export function isResolutionValue(value: unknown): value is string {
  return AGENT_RESOLUTIONS.some((item) => item.value === value);
}

export function defaultComposerSettings(): AgentComposerSettings {
  return {
    // The cheapest model by default: a new account's 200-credit grant buys
    // five images here, and the first couple usually go on getting the
    // prompt right. Anyone can switch in the composer.
    modelOption: 'nano-banana-2',
    aspectRatio: AUTO_ASPECT_RATIO,
    resolution: DEFAULT_RESOLUTION,
  };
}

export function resolveGenerationSettings(
  settings: AgentComposerSettings
): AgentGenerationSettings {
  const modelOption = AGENT_MODEL_OPTIONS.find(
    (item) => item.value === settings.modelOption
  );
  const creditCost = modelOption?.credits;
  return {
    modelName: modelOption?.value,
    aspectRatio:
      settings.aspectRatio && settings.aspectRatio !== AUTO_ASPECT_RATIO
        ? settings.aspectRatio
        : undefined,
    resolution:
      settings.resolution && settings.resolution !== AUTO_RESOLUTION
        ? settings.resolution
        : undefined,
    creditCost,
  };
}

/**
 * What one image on this model costs, resolved from the catalog.
 *
 * The server calls this instead of reading the `creditCost` the composer
 * sends: the request body is the user's to write, and a client-supplied
 * price would let anyone mint free images.
 */
export function creditsForModelOption(modelKey: string | undefined): number {
  const option = AGENT_MODEL_OPTIONS.find((item) => item.value === modelKey);
  // Unknown key: fall back to the priciest model rather than the cheapest,
  // so a bad request can never buy an image below cost.
  return (
    option?.credits ?? Math.max(...AGENT_MODEL_OPTIONS.map((i) => i.credits))
  );
}

/**
 * Friendly name for a model id recorded on a past generation.
 *
 * What gets stored is the provider's id (`fal-ai/nano-banana-2`), not the
 * picker key, so match on either and fall back to the raw id — an image made
 * by a model that has since left the catalog still deserves a label.
 */
export function labelForGeneratedModel(modelId: string): string {
  const option = AGENT_MODEL_OPTIONS.find(
    (item) =>
      item.value === modelId ||
      Object.values(item.providers).some(
        (ids) => ids.model === modelId || ids.editModel === modelId
      )
  );
  return option?.label ?? modelId;
}

export function labelForModelOption(value: string) {
  return (
    AGENT_MODEL_OPTIONS.find((item) => item.value === value)?.label || 'Auto'
  );
}

/** Is this a picker key (`gpt-image-2`) rather than a raw provider id? */
export function isModelOptionValue(value: string | undefined): boolean {
  if (!value) return false;
  return AGENT_MODEL_OPTIONS.some((item) => item.value === value);
}

/**
 * The id `provider` knows this model by. `overrides` remaps picker key →
 * provider id (used for gRouter, whose route names the admin chooses);
 * returns undefined when the model isn't mapped for that provider.
 */
export function providerModelFor(
  modelKey: string | undefined,
  provider: ImageProviderName,
  kind: 'generate' | 'edit',
  overrides?: Record<string, string>
): string | undefined {
  if (!modelKey) return undefined;
  const override = overrides?.[modelKey];
  if (override) return override;

  const option = AGENT_MODEL_OPTIONS.find((item) => item.value === modelKey);
  const ids = option?.providers?.[provider];
  if (!ids) return undefined;
  return kind === 'edit' ? ids.editModel : ids.model;
}
