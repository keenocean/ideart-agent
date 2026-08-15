import type { ToolDefinition } from '@/config/catalog/types';

import type { ToolMediaReference, ToolPageContent } from './types';

function assertAssetKind(
  media: ToolMediaReference,
  expectedKind: 'image' | 'video',
  label: string
): void {
  if (media.kind !== expectedKind) {
    throw new Error(`${label} must reference a ${expectedKind} asset`);
  }
}

function assertImage(media: ToolMediaReference, label: string): void {
  assertAssetKind(media, 'image', label);
}

/**
 * Validates the boundary between Catalog-selected template semantics and the
 * exact-locale content module. Invalid combinations fail closed before render.
 */
export function validateToolPageContent(
  definition: ToolDefinition,
  content: ToolPageContent
): void {
  const label = `${definition.entityId}:${content.locale}`;
  if (content.entityId !== definition.entityId) {
    throw new Error(`Tool content entity mismatch: ${label}`);
  }
  if (content.template !== definition.archetype) {
    throw new Error(
      `Tool template mismatch: ${label} (${content.template} !== ${definition.archetype})`
    );
  }

  for (const workflow of content.showcase.workflows.items) {
    for (const media of workflow.media) {
      assertImage(media, `${label} workflow ${workflow.title}`);
    }
  }
  for (const model of content.showcase.models.items) {
    assertImage(model.media, `${label} model ${model.title}`);
  }

  if ('examples' in content) {
    const expectedKind =
      content.template === 'image-generator' ? 'image' : 'video';
    for (const example of content.examples.items) {
      assertAssetKind(
        example.media,
        expectedKind,
        `${label} example ${example.title}`
      );
    }
    if (content.template === 'image-generator') {
      for (const useCase of content.useCases.items) {
        assertAssetKind(
          useCase.media,
          'image',
          `${label} use case ${useCase.title}`
        );
      }
    }
    return;
  }

  for (const comparison of content.comparisons.items) {
    const comparisonLabel = `${label} comparison ${comparison.title}`;
    switch (content.template) {
      case 'image-editor':
      case 'background-editor':
        assertAssetKind(
          comparison.source,
          'image',
          `${comparisonLabel} source`
        );
        assertAssetKind(
          comparison.result,
          'image',
          `${comparisonLabel} result`
        );
        break;
      case 'image-to-video':
        assertAssetKind(
          comparison.source,
          'image',
          `${comparisonLabel} source`
        );
        assertAssetKind(
          comparison.result,
          'video',
          `${comparisonLabel} result`
        );
        break;
      case 'reference-to-video':
        assertAssetKind(
          comparison.result,
          'video',
          `${comparisonLabel} result`
        );
        break;
    }
  }
}
