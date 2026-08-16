import { describe, expect, it } from 'vitest';

import { catalogRouteSegment } from '@/config/catalog/paths';
import { toolCatalog } from '@/config/catalog/tools';
import type { CatalogDefinition } from '@/config/catalog/types';
import {
  selectContentBackedCatalogLocaleRoutes,
  selectLoadableIndexableCatalogUrls,
  selectLoadableLlmsEntries,
} from '@/content/catalog-pages';

import { loadToolDetailPage, loadToolDirectoryItems } from './listing';
import {
  availableToolContentLocales,
  hasToolContent,
  loadToolContent,
  toolContentManifestKeys,
} from './manifest';

describe('tool content manifest', () => {
  it('publishes no production tool content for Ideart yet', async () => {
    expect(toolContentManifestKeys).toEqual([]);
    expect(hasToolContent('ai-image-generator', 'en')).toBe(false);
    expect(availableToolContentLocales('ai-image-generator')).toEqual([]);
    expect(await loadToolContent('ai-image-generator', 'en')).toBeNull();
  });

  it('keeps contentless Catalog pages out of indexable discovery', async () => {
    const indexableTools = toolCatalog.map((definition) => ({
      ...definition,
      localePages: Object.fromEntries(
        Object.entries(definition.localePages ?? {}).map(([locale, page]) => [
          locale,
          { ...page, indexing: 'index' as const },
        ])
      ),
    })) as CatalogDefinition[];

    expect(await selectLoadableIndexableCatalogUrls(indexableTools)).toEqual(
      []
    );
    expect(await selectLoadableLlmsEntries(indexableTools, 'en')).toEqual([]);
    expect(await selectLoadableLlmsEntries(indexableTools, 'zh')).toEqual([]);
  });

  it('keeps exact Catalog paths when translated slugs differ', () => {
    const definition = {
      kind: 'tool',
      entityId: 'fixture-tool',
      availability: 'live',
      publication: 'listed',
      placement: { directoryOrder: 1 },
      archetype: 'image-generator',
      execution: {
        kind: 'agent-preset',
        mediaMode: 'image',
        inputPolicy: { minimum: 0, accepts: [] },
      },
      localePages: {
        en: {
          slug: catalogRouteSegment('english-image-tool'),
          indexing: 'index',
        },
        zh: {
          slug: catalogRouteSegment('zhongwen-image-tool'),
          indexing: 'index',
        },
      },
    } as CatalogDefinition;

    expect(
      selectContentBackedCatalogLocaleRoutes(definition, () => true)
    ).toEqual([
      { locale: 'en', path: '/tools/english-image-tool' },
      { locale: 'zh', path: '/tools/zhongwen-image-tool' },
    ]);
  });
});

describe('tool route content gate', () => {
  it.each(['en', 'zh'] as const)(
    'returns an empty directory for %s when no content is published',
    async (locale) => {
      expect(await loadToolDirectoryItems(locale)).toEqual([]);
    }
  );

  it.each(['en', 'zh'] as const)(
    'returns null for unopened and unknown %s slugs',
    async (locale) => {
      expect(await loadToolDetailPage(locale, 'missing')).toBeNull();
    }
  );
});
