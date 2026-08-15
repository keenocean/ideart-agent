import { describe, expect, it } from 'vitest';

import { catalogRouteSegment } from '@/config/catalog/paths';
import { hasLocalePage } from '@/config/catalog/selectors';
import { toolCatalog } from '@/config/catalog/tools';
import type { CatalogDefinition } from '@/config/catalog/types';
import type { AppLocale } from '@/config/locale';
import { buildSeoHead } from '@/lib/seo';
import {
  isCatalogPageContentAvailable,
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
  it('opens only the first en/zh vertical slice without language fallback', async () => {
    expect(toolContentManifestKeys).toContain('ai-image-generator:en');
    expect(toolContentManifestKeys).toContain('ai-image-generator:zh');
    expect(hasToolContent('ai-image-generator', 'en')).toBe(true);
    expect(hasToolContent('ai-image-editor', 'en')).toBe(false);
    expect(availableToolContentLocales('ai-image-generator')).toEqual([
      'en',
      'zh',
    ]);
    expect(await loadToolContent('ai-image-editor', 'zh')).toBeNull();
  });

  it('loads every convention-discovered module with matching identity', async () => {
    for (const key of toolContentManifestKeys) {
      const [entityId, locale] = key.split(':') as [string, AppLocale];
      expect(await loadToolContent(entityId, locale), key).toMatchObject({
        entityId,
        locale,
      });
    }
  });

  it('keeps every discovered content module behind a Catalog locale page', () => {
    for (const key of toolContentManifestKeys) {
      const [entityId, locale] = key.split(':') as [string, AppLocale];
      const definition = toolCatalog.find(
        (entry) => entry.entityId === entityId
      );
      expect(definition, `Missing Catalog entry for ${key}`).toBeDefined();
      expect(definition?.publication, key).toBe('listed');
      expect(hasLocalePage(definition!, locale), key).toBe(true);
    }
  });

  it('keeps contentless Catalog pages out of indexable discovery', async () => {
    const indexableTools = toolCatalog.map((definition) => ({
      ...definition,
      localePages: Object.fromEntries(
        Object.entries(definition.localePages).map(([locale, page]) => [
          locale,
          { ...page, indexing: 'index' as const },
        ])
      ),
    })) as CatalogDefinition[];

    expect(
      (await selectLoadableIndexableCatalogUrls(indexableTools)).map(
        ({ entityId, locale }) => `${entityId}:${locale}`
      )
    ).toEqual(['ai-image-generator:en', 'ai-image-generator:zh']);
    expect(
      (await selectLoadableLlmsEntries(indexableTools, 'en')).map(
        ({ definition }) => definition.entityId
      )
    ).toEqual(['ai-image-generator']);
    expect(await selectLoadableLlmsEntries(indexableTools, 'zh')).toEqual([
      expect.objectContaining({
        path: '/tools/ai-image-generator',
        title: 'AI 图片生成器',
        summary:
          '把文字提示变成静态图片，并在同一个 Agent 对话中继续调整方向。',
      }),
    ]);
  });

  it('keeps exact Catalog paths when translated slugs differ', () => {
    const definition = {
      ...toolCatalog[0],
      localePages: {
        en: {
          ...toolCatalog[0].localePages.en,
          slug: catalogRouteSegment('english-image-tool'),
        },
        zh: {
          ...toolCatalog[0].localePages.zh,
          slug: catalogRouteSegment('zhongwen-image-tool'),
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
    'lists only ai-image-generator for %s',
    async (locale) => {
      const items = await loadToolDirectoryItems(locale);
      const expectedIds = toolCatalog
        .filter(
          (definition) =>
            definition.publication === 'listed' &&
            !!definition.localePages[locale] &&
            hasToolContent(definition.entityId, locale)
        )
        .map((definition) => definition.entityId);
      expect(items.map((item) => item.entityId)).toEqual(expectedIds);
      expect(items).toContainEqual(
        expect.objectContaining({
          entityId: 'ai-image-generator',
          href: '/tools/ai-image-generator',
          availability: 'live',
        })
      );
    }
  );

  it.each(['en', 'zh'] as const)(
    'resolves a substantive noindex detail page for %s',
    async (locale) => {
      const detail = await loadToolDetailPage(locale, 'ai-image-generator');
      expect(detail).toMatchObject({
        entityId: 'ai-image-generator',
        locale,
        path: '/tools/ai-image-generator',
        indexing: 'noindex',
        contentModifiedAt: '2026-08-15',
        availableLocales: ['en', 'zh'],
        localeRoutes: [
          { locale: 'en', path: '/tools/ai-image-generator' },
          { locale: 'zh', path: '/tools/ai-image-generator' },
        ],
        alternates: [],
      });
      expect(detail?.content.examples.items).toHaveLength(3);
      expect(detail?.content.faq.items.length).toBeGreaterThanOrEqual(3);
      expect(detail?.related).toEqual([]);
    }
  );

  it('builds a self-canonical noindex head from the visible FAQ content', async () => {
    const detail = (await loadToolDetailPage('en', 'ai-image-generator'))!;
    const head = buildSeoHead({
      kind: 'website',
      title: detail.content.seo.title,
      description: detail.content.seo.description,
      canonical: { locale: detail.locale, path: detail.path },
      alternates: detail.alternates,
      indexing: detail.indexing,
      breadcrumbs: [
        { name: 'Home', route: { locale: 'en', path: '/' } },
        { name: 'Tools', route: { locale: 'en', path: '/tools' } },
      ],
      faq: detail.content.faq.items,
    });
    expect(head.links).toEqual([
      {
        rel: 'canonical',
        href: 'http://localhost:3000/tools/ai-image-generator',
      },
    ]);
    expect(head.meta).toContainEqual({
      name: 'robots',
      content: 'noindex,follow',
    });
    const graph = JSON.parse(head.scripts![0].children)['@graph'];
    expect(graph.map((node: { '@type': string }) => node['@type'])).toEqual([
      'BreadcrumbList',
      'FAQPage',
    ]);
  });

  it.each(['en', 'zh'] as const)(
    'returns null for every unopened or unknown %s slug',
    async (locale) => {
      const contentlessSlugs = toolCatalog.flatMap((definition) => {
        const page = definition.localePages[locale];
        return page && !hasToolContent(definition.entityId, locale)
          ? [page.slug]
          : [];
      });
      for (const slug of [...contentlessSlugs, 'missing']) {
        expect(await loadToolDetailPage(locale, slug), slug).toBeNull();
      }
    }
  );
});
