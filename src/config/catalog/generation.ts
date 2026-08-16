import {
  DEFAULT_IMAGE_MODEL,
  defaultVideoModelForOperation,
  imageModelOptionFor,
  videoModelAttachmentPolicy,
  videoOperationAttachmentPolicy,
} from '@/lib/agent-settings';
import type { GenerationPreset } from '@/lib/generation-entry';

import type { CatalogDefinition } from './types';

/** UI-only projection. POST /api/agent/chat rebuilds the policy from entityId. */
export function generationPresetFor(
  definition: CatalogDefinition
): GenerationPreset {
  if (definition.kind === 'tool') {
    const videoOperation =
      definition.execution.mediaMode === 'video'
        ? definition.execution.videoOperation
        : undefined;
    const defaultVideoModel = videoOperation
      ? defaultVideoModelForOperation(videoOperation)
      : undefined;
    const inputPolicy = videoOperation
      ? (definition.execution.inputPolicy ??
        videoOperationAttachmentPolicy(videoOperation))
      : definition.execution.inputPolicy;
    return {
      target:
        definition.execution.mediaMode === 'image'
          ? { mediaMode: 'image', modelKey: DEFAULT_IMAGE_MODEL }
          : {
              mediaMode: 'video',
              ...(defaultVideoModel ? { modelKey: defaultVideoModel } : {}),
              operation: definition.execution.videoOperation,
            },
      inputPolicy,
      locks: { mediaMode: true, model: false },
    };
  }

  if (definition.modality === 'image') {
    const model = imageModelOptionFor(definition.runtimeModelKey)!;
    return {
      target: { mediaMode: 'image', modelKey: definition.runtimeModelKey },
      inputPolicy: {
        minimum: 0,
        maximum: model.maxImages,
        accepts: ['image'],
      },
      locks: { mediaMode: true, model: true },
    };
  }
  return {
    target: { mediaMode: 'video', modelKey: definition.runtimeModelKey },
    inputPolicy: videoModelAttachmentPolicy(definition.runtimeModelKey),
    locks: { mediaMode: true, model: true },
  };
}
