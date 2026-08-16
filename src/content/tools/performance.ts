import type { ToolArchetype } from '@/config/catalog/types';
import {
  assertCatalogFirstFoldMedia,
  selectCatalogFirstFoldItems,
} from '@/content/catalog-performance';

import type {
  ToolMediaReference,
  ToolPageContent,
  ToolPromptExample,
} from './types';

type FirstFoldSelector = (
  content: ToolPageContent
) => readonly ToolPromptExample<ToolMediaReference>[];

const noFirstFoldMedia: FirstFoldSelector = () => [];

const firstFoldSelectors = {
  'image-generator': (content) =>
    'examples' in content
      ? selectCatalogFirstFoldItems(content.examples.items)
      : [],
  'image-editor': noFirstFoldMedia,
  'text-to-video': noFirstFoldMedia,
  'image-to-video': noFirstFoldMedia,
  'reference-to-video': noFirstFoldMedia,
  'background-editor': noFirstFoldMedia,
} satisfies Record<ToolArchetype, FirstFoldSelector>;

/** Every tool archetype must declare its first-fold media policy here. */
export function selectToolFirstFoldItems(
  content: ToolPageContent
): readonly ToolPromptExample<ToolMediaReference>[] {
  return firstFoldSelectors[content.template](content);
}

export function validateToolFirstFoldMedia(content: ToolPageContent): void {
  const scope = `tool:${content.entityId}:${content.locale}`;
  const items = selectToolFirstFoldItems(content);

  if (content.template === 'image-generator' && items.length === 0) {
    throw new Error(`${scope} has no image eligible for the first fold`);
  }

  assertCatalogFirstFoldMedia(
    scope,
    items.map((item) => item.media)
  );
}
