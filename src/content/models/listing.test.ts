import { describe, expect, it } from 'vitest';

import { modelCatalog } from '@/config/catalog/models';
import type { AppLocale } from '@/config/locale';
import { modelOptionFor } from '@/lib/agent-settings';
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
import { validateModelPageContent } from './validate';

describe('model content publication gate', () => {
  it('publishes only the bilingual Seedance 2.5 slice', async () => {
    expect(modelContentManifestKeys).toEqual([
      'seedance-2-5:en',
      'seedance-2-5:zh',
    ]);
    expect(hasModelContent('seedance-2-5', 'en')).toBe(true);
    expect(hasModelContent('minimax-h3', 'en')).toBe(false);
    expect(availableModelContentLocales('seedance-2-5')).toEqual(['en', 'zh']);
    expect(await loadModelContent('minimax-h3', 'en')).toBeNull();
  });

  it('loads every indexed object with matching identity and video media', async () => {
    for (const key of modelContentManifestKeys) {
      const [entityId, locale] = key.split(':') as [string, AppLocale];
      const content = await loadModelContent(entityId, locale);
      expect(content).toMatchObject({
        entityId,
        locale,
        template: 'video-model',
      });
      expect(content?.examples.items).toHaveLength(6);
      expect(
        content?.examples.items.every((item) => item.media.kind === 'video')
      ).toBe(true);
      const definition = modelCatalog.find(
        (item) => item.entityId === entityId
      )!;
      expect(() =>
        validateModelPageContent(definition, content!)
      ).not.toThrow();
    }
  });

  it.each(['en', 'zh'] as const)(
    'resolves a noindex route and directory for %s',
    async (locale) => {
      const [directory, detail] = await Promise.all([
        loadModelDirectoryPage(locale),
        loadModelDetailPage(locale, 'seedance-2-5'),
      ]);
      expect(directory?.items).toEqual([
        expect.objectContaining({
          entityId: 'seedance-2-5',
          href: '/models/seedance-2-5',
        }),
      ]);
      expect(detail).toMatchObject({
        entityId: 'seedance-2-5',
        locale,
        path: '/models/seedance-2-5',
        indexing: 'noindex',
        contentModifiedAt: '2026-08-16',
        alternates: [],
        localeRoutes: [
          { locale: 'en', path: '/models/seedance-2-5' },
          { locale: 'zh', path: '/models/seedance-2-5' },
        ],
      });
      expect(detail?.related).toEqual([]);
      for (const id of detail?.content.comparison.relatedModelIds ?? []) {
        const model = modelCatalog.find((entry) => entry.entityId === id);
        expect(model?.kind).toBe('model');
        if (model?.kind === 'model' && model.modality === 'video') {
          expect(modelOptionFor(model.runtimeModelKey)).toBeDefined();
        }
      }
    }
  );

  it('joins discovery only when the Catalog page is indexable', async () => {
    const definitions = modelCatalog.map((definition) =>
      definition.entityId === 'seedance-2-5'
        ? {
            ...definition,
            localePages: Object.fromEntries(
              Object.entries(definition.localePages ?? {}).map(
                ([locale, page]) => [
                  locale,
                  { ...page, indexing: 'index' as const },
                ]
              )
            ),
          }
        : definition
    );
    expect(
      (await selectLoadableIndexableCatalogUrls(definitions)).map(
        ({ entityId, locale }) => `${entityId}:${locale}`
      )
    ).toEqual(['seedance-2-5:en', 'seedance-2-5:zh']);
    expect(
      (await selectLoadableLlmsEntries(definitions, 'en')).map(
        ({ definition }) => definition.entityId
      )
    ).toEqual(['seedance-2-5']);
  });
});
