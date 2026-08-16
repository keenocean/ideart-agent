import type { ModelDefinition } from '@/config/catalog/types';

import type { ModelMediaReference, ModelPageContent } from './types';

function assertMediaKind(
  media: ModelMediaReference,
  expected: ModelDefinition['modality'],
  label: string
) {
  if (media.kind !== expected) {
    throw new Error(`${label} must reference ${expected} media`);
  }
}

export function validateModelPageContent(
  definition: ModelDefinition,
  content: ModelPageContent
): void {
  const label = `${definition.entityId}:${content.locale}`;
  if (content.entityId !== definition.entityId) {
    throw new Error(`Model content entity mismatch: ${label}`);
  }
  if (content.template !== `${definition.modality}-model`) {
    throw new Error(`Model template mismatch: ${label}`);
  }
  for (const item of content.examples.items) {
    assertMediaKind(item.media, definition.modality, `${label} example`);
  }
  for (const item of content.useCases.items) {
    assertMediaKind(item.media, definition.modality, `${label} use case`);
  }
  if (
    new Set(content.comparison.relatedModelIds).size !==
    content.comparison.relatedModelIds.length
  ) {
    throw new Error(`Duplicate comparison model: ${label}`);
  }
}
