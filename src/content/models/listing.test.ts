import { describe, expect, it } from 'vitest';

import { modelCatalog } from '@/config/catalog/models';
import type { CatalogDefinition } from '@/config/catalog/types';
import {
  selectLoadableIndexableCatalogUrls,
  selectLoadableLlmsEntries,
} from '@/content/catalog-pages';

import { loadModelDetailPage, loadModelDirectoryPage } from './listing';
import {
  availableModelContentLocales,
  hasModelContent,
  loadModelContent,
  modelContentManifestKeys,
} from './manifest';

describe('model content publication gate', () => {
  it('publishes no production model content for Ideart yet', async () => {
    expect(modelContentManifestKeys).toEqual([]);
    expect(hasModelContent('seedance-2-5', 'en')).toBe(false);
    expect(availableModelContentLocales('seedance-2-5')).toEqual([]);
    expect(await loadModelContent('seedance-2-5', 'en')).toBeNull();
  });

  it.each(['en', 'zh'] as const)(
    'returns null directory and detail pages for %s when no content is published',
    async (locale) => {
      await expect(loadModelDirectoryPage(locale)).resolves.toBeNull();
      await expect(
        loadModelDetailPage(locale, 'seedance-2-5')
      ).resolves.toBeNull();
      await expect(loadModelDetailPage(locale, 'missing')).resolves.toBeNull();
    }
  );

  it('keeps discovery empty until content is explicitly published', async () => {
    const definitions = modelCatalog.map((definition) => ({
      ...definition,
      localePages: Object.fromEntries(
        Object.entries(definition.localePages ?? {}).map(([locale, page]) => [
          locale,
          { ...page, indexing: 'index' as const },
        ])
      ),
    })) as CatalogDefinition[];

    expect(await selectLoadableIndexableCatalogUrls(definitions)).toEqual([]);
    expect(await selectLoadableLlmsEntries(definitions, 'en')).toEqual([]);
    expect(await selectLoadableLlmsEntries(definitions, 'zh')).toEqual([]);
  });
});
