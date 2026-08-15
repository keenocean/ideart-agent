import { catalog } from '@/config/catalog/registry';
import type {
  CatalogDefinition,
  ModelDefinition,
  ToolDefinition,
} from '@/config/catalog/types';
import { isSupportedLocale, type AppLocale } from '@/config/locale';
import { splitAttachedImages } from '@/lib/agent-chat';
import {
  imageModelOptionFor,
  modelOptionFor,
  normalizeClientGenerationSettings,
  type AgentGenerationSettings,
  type AgentImageModelOptionValue,
  type AgentMediaMode,
  type AgentModelOptionValue,
} from '@/lib/agent-settings';
import {
  generationEntrySource,
  validateGenerationAttachments,
  type GenerationEntryContext,
  type GenerationInputPolicy,
  type GenerationRequestAttachment,
} from '@/lib/generation-entry';

import { resolveReferenceImage } from './media';

const MAX_RUNTIME_ATTACHMENTS = 16;
const ALL_ATTACHMENT_TYPES = ['image', 'video', 'audio'] as const;

export type EffectiveGenerationPolicy = {
  entryContext: GenerationEntryContext;
  source: string;
  lockedMediaMode?: Exclude<AgentMediaMode, 'auto'>;
  lockedVideoModel?: AgentModelOptionValue;
  lockedImageModel?: AgentImageModelOptionValue;
  inputPolicy: GenerationInputPolicy;
  /** Bound by the API after message/payload validation, before tool creation. */
  requestAttachments?: readonly GenerationRequestAttachment[];
};

export class GenerationEntryPolicyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'GenerationEntryPolicyError';
  }
}

function localePageExists(
  definition: CatalogDefinition,
  locale: AppLocale
): boolean {
  return definition.publication === 'hidden'
    ? false
    : Boolean(definition.localePages[locale]);
}

function modelInputPolicy(definition: ModelDefinition): GenerationInputPolicy {
  const maximum =
    definition.modality === 'image'
      ? imageModelOptionFor(definition.runtimeModelKey)?.maxImages
      : modelOptionFor(definition.runtimeModelKey)?.maxImages;
  return {
    minimum: 0,
    maximum: Math.min(
      maximum ?? MAX_RUNTIME_ATTACHMENTS,
      MAX_RUNTIME_ATTACHMENTS
    ),
    accepts: ['image'],
  };
}

/** Rebuild client page intent from the server-owned Catalog. */
export function resolveEffectiveGenerationPolicy(
  context: GenerationEntryContext
): EffectiveGenerationPolicy {
  if (context.kind === 'home') {
    return {
      entryContext: context,
      source: 'home',
      inputPolicy: {
        minimum: 0,
        maximum: MAX_RUNTIME_ATTACHMENTS,
        accepts: ALL_ATTACHMENT_TYPES,
      },
    };
  }
  if (!isSupportedLocale(context.locale)) {
    throw new GenerationEntryPolicyError('Generation entry is not available.');
  }
  const definition = (catalog as readonly CatalogDefinition[]).find(
    (entry) =>
      entry.kind === context.kind && entry.entityId === context.entityId
  );
  if (
    !definition ||
    definition.publication === 'hidden' ||
    definition.availability === 'coming-soon' ||
    !localePageExists(definition, context.locale)
  ) {
    throw new GenerationEntryPolicyError('Generation entry is not available.');
  }

  if (definition.kind === 'tool') {
    const execution: ToolDefinition['execution'] = definition.execution;
    if (execution.kind !== 'agent-preset') {
      throw new GenerationEntryPolicyError(
        'Generation entry execution is unsupported.'
      );
    }
    return {
      entryContext: context,
      source: generationEntrySource(context),
      lockedMediaMode: execution.mediaMode,
      inputPolicy: {
        ...execution.inputPolicy,
        maximum: Math.min(
          execution.inputPolicy.maximum ?? MAX_RUNTIME_ATTACHMENTS,
          MAX_RUNTIME_ATTACHMENTS
        ),
      },
    };
  }

  return {
    entryContext: context,
    source: generationEntrySource(context),
    lockedMediaMode: definition.modality,
    ...(definition.modality === 'image'
      ? { lockedImageModel: definition.runtimeModelKey }
      : { lockedVideoModel: definition.runtimeModelKey }),
    inputPolicy: modelInputPolicy(definition),
  };
}

/** Normalize first, then apply immutable server Catalog fields, then normalize again. */
export function applyEffectiveGenerationPolicy(
  settings: AgentGenerationSettings,
  policy: EffectiveGenerationPolicy
): AgentGenerationSettings {
  const normalized = normalizeClientGenerationSettings(settings);
  if (!normalized) {
    throw new GenerationEntryPolicyError(
      'Generation settings are unsupported.'
    );
  }
  const locked = normalizeClientGenerationSettings({
    ...normalized,
    ...(policy.lockedMediaMode ? { mediaMode: policy.lockedMediaMode } : {}),
    ...(policy.lockedVideoModel ? { modelName: policy.lockedVideoModel } : {}),
    ...(policy.lockedImageModel
      ? { imageModelName: policy.lockedImageModel }
      : {}),
  });
  if (!locked) {
    throw new GenerationEntryPolicyError('Generation policy is unsupported.');
  }
  return locked;
}

export function parseGenerationRequestAttachments(
  value: unknown
): GenerationRequestAttachment[] | null {
  if (value === undefined) return [];
  if (!Array.isArray(value) || value.length > MAX_RUNTIME_ATTACHMENTS) {
    return null;
  }
  const parsed: GenerationRequestAttachment[] = [];
  for (const item of value) {
    if (!item || typeof item !== 'object' || Array.isArray(item)) return null;
    const record = item as Record<string, unknown>;
    if (
      !ALL_ATTACHMENT_TYPES.includes(
        record.mediaType as (typeof ALL_ATTACHMENT_TYPES)[number]
      ) ||
      typeof record.url !== 'string' ||
      !/^https?:\/\//i.test(record.url)
    ) {
      return null;
    }
    try {
      resolveReferenceImage(record.url);
    } catch {
      return null;
    }
    parsed.push({
      mediaType: record.mediaType as GenerationRequestAttachment['mediaType'],
      url: record.url.trim(),
    });
  }
  return parsed;
}

function messageAttachments(message: string): GenerationRequestAttachment[] {
  const parsed = splitAttachedImages(message);
  return [
    ...parsed.images.map((url) => ({ mediaType: 'image' as const, url })),
    ...parsed.audios.map((url) => ({ mediaType: 'audio' as const, url })),
    ...parsed.videos.map((url) => ({ mediaType: 'video' as const, url })),
  ];
}

function attachmentKey(attachment: GenerationRequestAttachment): string {
  return `${attachment.mediaType}:${attachment.url}`;
}

export function validateRequestAttachments(params: {
  message: string;
  attachments: readonly GenerationRequestAttachment[];
  policy: EffectiveGenerationPolicy;
  settings: AgentGenerationSettings;
}): string | null {
  const declared = params.attachments.map(attachmentKey).sort();
  const embedded = messageAttachments(params.message).map(attachmentKey).sort();
  if (
    declared.length !== embedded.length ||
    declared.some((value, index) => value !== embedded[index])
  ) {
    return 'Attachment payload does not match the message attachment block.';
  }
  const policyError = validateGenerationAttachments(
    params.attachments,
    params.policy.inputPolicy
  );
  if (policyError) return policyError;

  const imageCount = params.attachments.filter(
    (attachment) => attachment.mediaType === 'image'
  ).length;
  const runtimeImageMaximum =
    params.settings.mediaMode === 'image'
      ? imageModelOptionFor(params.settings.imageModelName)?.maxImages
      : params.settings.mediaMode === 'video'
        ? modelOptionFor(params.settings.modelName)?.maxImages
        : MAX_RUNTIME_ATTACHMENTS;
  if (runtimeImageMaximum !== undefined && imageCount > runtimeImageMaximum) {
    return `The selected model accepts at most ${runtimeImageMaximum} image attachment${runtimeImageMaximum === 1 ? '' : 's'}.`;
  }
  return null;
}

export function validateToolPolicyAttachments(
  policy: EffectiveGenerationPolicy | undefined,
  attachments: readonly GenerationRequestAttachment[]
): string | null {
  if (!policy) return null;
  const policyError = validateGenerationAttachments(
    attachments,
    policy.inputPolicy
  );
  if (policyError) return policyError;
  if (!policy.requestAttachments) return null;
  const allowed = new Set(policy.requestAttachments.map(attachmentKey));
  const undeclared = attachments.find(
    (attachment) => !allowed.has(attachmentKey(attachment))
  );
  return undeclared
    ? 'Tool reference media must come from the validated entry attachments.'
    : null;
}
