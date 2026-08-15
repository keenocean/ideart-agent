import {
  DEFAULT_IMAGE_MODEL,
  imageModelOptionFor,
  modelOptionFor,
} from '@/lib/agent-settings';
import type { GenerationPreset } from '@/lib/generation-entry';

import type { CatalogDefinition } from './types';

/** UI-only projection. POST /api/agent/chat rebuilds the policy from entityId. */
export function generationPresetFor(
  definition: CatalogDefinition
): GenerationPreset {
  if (definition.kind === 'tool') {
    return {
      target:
        definition.execution.mediaMode === 'image'
          ? { mediaMode: 'image', modelKey: DEFAULT_IMAGE_MODEL }
          : { mediaMode: 'video' },
      inputPolicy: definition.execution.inputPolicy,
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
  const model = modelOptionFor(definition.runtimeModelKey)!;
  return {
    target: { mediaMode: 'video', modelKey: definition.runtimeModelKey },
    inputPolicy: {
      minimum: 0,
      maximum: model.maxImages,
      accepts: ['image'],
    },
    locks: { mediaMode: true, model: true },
  };
}
