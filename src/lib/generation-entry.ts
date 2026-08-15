import { isSupportedLocale, type AppLocale } from '@/config/locale';
import {
  mediaTypeForAttachment,
  type AttachmentMediaType,
  type PendingAttachment,
} from '@/lib/agent';
import {
  defaultComposerSettings,
  isAgentMediaMode,
  isAspectRatioValue,
  isDurationValue,
  isImageModelOptionValue,
  isModelOptionValue,
  isResolutionValue,
  normalizeComposerSettings,
  normalizeImageAspectRatio,
  normalizeImageQuality,
  normalizeImageResolution,
  type AgentComposerSettings,
  type AgentImageModelOptionValue,
  type AgentModelOptionValue,
} from '@/lib/agent-settings';

export type GenerationEntryContext =
  | { kind: 'home' }
  | {
      kind: 'tool' | 'model';
      entityId: string;
      locale: AppLocale;
    };

export type GenerationInputPolicy = {
  minimum: number;
  maximum?: number;
  accepts: readonly AttachmentMediaType[];
};

export type GenerationPreset = {
  initialPrompt?: string;
  target:
    | { mediaMode: 'auto'; modelKey?: never }
    | { mediaMode: 'image'; modelKey: AgentImageModelOptionValue }
    | { mediaMode: 'video'; modelKey?: AgentModelOptionValue };
  settings?: Omit<
    Partial<AgentComposerSettings>,
    'mediaMode' | 'modelOption' | 'imageModelOption'
  >;
  inputPolicy?: GenerationInputPolicy;
  locks?: {
    mediaMode?: boolean;
    model?: boolean;
  };
};

export type GenerationSettingSource =
  | 'runtime-default'
  | 'persisted'
  | 'page-default'
  | 'page-lock';

export type GenerationSettingSources = Record<
  keyof AgentComposerSettings,
  GenerationSettingSource
>;

export type GenerationRequestAttachment = {
  mediaType: AttachmentMediaType;
  url: string;
  receipt?: string;
};

function own(value: object | undefined, key: PropertyKey): boolean {
  return !!value && Object.prototype.hasOwnProperty.call(value, key);
}

function hasLegalPersistedSetting(
  persisted: Partial<AgentComposerSettings> | undefined,
  key: keyof AgentComposerSettings
): boolean {
  if (!own(persisted, key)) return false;
  const value = persisted?.[key];
  switch (key) {
    case 'mediaMode':
      return isAgentMediaMode(value);
    case 'modelOption':
      return isModelOptionValue(value as string | undefined);
    case 'imageModelOption':
      return isImageModelOptionValue(value as string | undefined);
    case 'aspectRatio':
      return (
        isAspectRatioValue(value) &&
        normalizeComposerSettings(persisted).aspectRatio === value
      );
    case 'resolution':
      return (
        isResolutionValue(value) &&
        normalizeComposerSettings(persisted).resolution === value
      );
    case 'duration':
      return (
        isDurationValue(value) &&
        normalizeComposerSettings(persisted).duration === value
      );
    case 'imageAspectRatio':
      return (
        typeof value === 'string' && normalizeImageAspectRatio(value) === value
      );
    case 'imageResolution':
      return (
        typeof value === 'string' &&
        normalizeImageResolution(value) === value.toUpperCase()
      );
    case 'imageQuality':
      return (
        typeof value === 'string' &&
        normalizeImageQuality(value) === value.toLowerCase()
      );
  }
}

function initialSources(
  persisted: Partial<AgentComposerSettings> | undefined
): GenerationSettingSources {
  const source = (key: keyof AgentComposerSettings) =>
    hasLegalPersistedSetting(persisted, key) ? 'persisted' : 'runtime-default';
  return {
    mediaMode: source('mediaMode'),
    modelOption: source('modelOption'),
    imageModelOption: source('imageModelOption'),
    aspectRatio: source('aspectRatio'),
    resolution: source('resolution'),
    duration: source('duration'),
    imageAspectRatio: source('imageAspectRatio'),
    imageResolution: source('imageResolution'),
    imageQuality: source('imageQuality'),
  };
}

/**
 * Resolve page defaults without letting a marketing preset replace a user's
 * valid saved choice. Locks are applied last and normalization remains the
 * final authority for model-specific parameters.
 */
export function applyGenerationPreset(
  persisted: Partial<AgentComposerSettings> | undefined,
  preset?: GenerationPreset
): {
  settings: AgentComposerSettings;
  sources: GenerationSettingSources;
} {
  const defaults = defaultComposerSettings();
  let draft = normalizeComposerSettings(persisted);
  const sources = initialSources(persisted);
  if (!preset) return { settings: draft, sources };

  const hasPersistedMode = isAgentMediaMode(persisted?.mediaMode);
  if (!hasPersistedMode) {
    draft = { ...draft, mediaMode: preset.target.mediaMode };
    sources.mediaMode = 'page-default';
  }

  if (preset.target.mediaMode === 'image') {
    if (!isImageModelOptionValue(persisted?.imageModelOption)) {
      draft = { ...draft, imageModelOption: preset.target.modelKey };
      sources.imageModelOption = 'page-default';
    }
  } else if (
    preset.target.mediaMode === 'video' &&
    preset.target.modelKey &&
    !isModelOptionValue(persisted?.modelOption)
  ) {
    draft = { ...draft, modelOption: preset.target.modelKey };
    sources.modelOption = 'page-default';
  }

  for (const [key, value] of Object.entries(preset.settings ?? {}) as [
    keyof AgentComposerSettings,
    AgentComposerSettings[keyof AgentComposerSettings],
  ][]) {
    if (value === undefined || hasLegalPersistedSetting(persisted, key))
      continue;
    draft = { ...draft, [key]: value };
    sources[key] = 'page-default';
  }

  if (preset.locks?.mediaMode) {
    draft = { ...draft, mediaMode: preset.target.mediaMode };
    sources.mediaMode = 'page-lock';
  }
  if (preset.locks?.model && preset.target.mediaMode === 'image') {
    draft = { ...draft, imageModelOption: preset.target.modelKey };
    sources.imageModelOption = 'page-lock';
  }
  if (
    preset.locks?.model &&
    preset.target.mediaMode === 'video' &&
    preset.target.modelKey
  ) {
    draft = { ...draft, modelOption: preset.target.modelKey };
    sources.modelOption = 'page-lock';
  }

  return { settings: normalizeComposerSettings(draft), sources };
}

export function normalizeGenerationEntryContext(
  value: unknown
): GenerationEntryContext | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const record = value as Record<string, unknown>;
  if (record.kind === 'home') return { kind: 'home' };
  if (
    (record.kind === 'tool' || record.kind === 'model') &&
    typeof record.entityId === 'string' &&
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(record.entityId) &&
    isSupportedLocale(record.locale)
  ) {
    return {
      kind: record.kind,
      entityId: record.entityId,
      locale: record.locale,
    };
  }
  return null;
}

export function generationEntrySource(context: GenerationEntryContext): string {
  return context.kind === 'home'
    ? 'home'
    : `${context.kind}:${context.entityId}`;
}

export function requestAttachments(
  attachments: readonly PendingAttachment[]
): GenerationRequestAttachment[] {
  return attachments.flatMap((attachment) =>
    attachment.status === 'uploaded' && attachment.url
      ? [
          {
            mediaType: mediaTypeForAttachment(attachment),
            url: attachment.url,
            ...(attachment.receipt ? { receipt: attachment.receipt } : {}),
          },
        ]
      : []
  );
}

export function validateGenerationAttachments(
  attachments: readonly GenerationRequestAttachment[],
  policy: GenerationInputPolicy
): string | null {
  if (attachments.length < policy.minimum) {
    return `This entry requires at least ${policy.minimum} attachment${policy.minimum === 1 ? '' : 's'}.`;
  }
  if (policy.maximum !== undefined && attachments.length > policy.maximum) {
    return `This entry accepts at most ${policy.maximum} attachment${policy.maximum === 1 ? '' : 's'}.`;
  }
  for (const attachment of attachments) {
    if (!policy.accepts.includes(attachment.mediaType)) {
      return `This entry does not accept ${attachment.mediaType} attachments.`;
    }
  }
  return null;
}
