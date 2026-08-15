import { describe, expect, it } from 'vitest';

import { catalogRouteSegment } from '@/config/catalog/paths';
import { hasLocalePage } from '@/config/catalog/selectors';
import { toolCatalog } from '@/config/catalog/tools';
import type { CatalogDefinition } from '@/config/catalog/types';
import type { AppLocale } from '@/config/locale';
import { imageModelOptionFor } from '@/lib/agent-settings';
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
import type { ToolPageContent } from './types';
import { validateToolPageContent } from './validate';

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

  it('loads every release-indexed page with matching identity', async () => {
    for (const key of toolContentManifestKeys) {
      const [entityId, locale] = key.split(':') as [string, AppLocale];
      expect(await loadToolContent(entityId, locale), key).toMatchObject({
        entityId,
        locale,
      });
    }
  });

  it('fails closed when content selects the wrong template or media kind', async () => {
    const definition = toolCatalog[0];
    const content = await loadToolContent('ai-image-generator', 'en');
    if (!content || content.template !== 'image-generator') {
      throw new Error('Expected the image-generator fixture');
    }

    expect(() => validateToolPageContent(definition, content)).not.toThrow();
    expect(() =>
      validateToolPageContent(definition, {
        ...content,
        template: 'text-to-video',
      } as unknown as ToolPageContent)
    ).toThrow(/template mismatch/);
    expect(() =>
      validateToolPageContent(definition, {
        ...content,
        examples: {
          ...content.examples,
          items: [
            {
              ...content.examples.items[0]!,
              media: {
                ...content.examples.items[0]!.media,
                kind: 'video',
                mimeType: 'video/mp4',
                poster: content.examples.items[0]!.media,
              },
            },
          ],
        },
      } as unknown as ToolPageContent)
    ).toThrow(/must reference a image asset/);
  });

  it('keeps every release-indexed page behind a Catalog locale page', () => {
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
        archetype: 'image-generator',
        contentModifiedAt: '2026-08-15',
        availableLocales: ['en', 'zh'],
        localeRoutes: [
          { locale: 'en', path: '/tools/ai-image-generator' },
          { locale: 'zh', path: '/tools/ai-image-generator' },
        ],
        alternates: [],
      });
      if (!detail || detail.content.template !== 'image-generator') {
        throw new Error(`Expected image-generator content for ${locale}`);
      }
      const examples = detail.content.examples.items;
      expect(detail?.content.template).toBe('image-generator');
      expect(examples).toHaveLength(15);
      const exampleAssetIds = new Set(
        examples.map((example) => example.media.id)
      );
      expect(exampleAssetIds.size).toBe(examples.length);
      for (const example of examples) {
        expect(example.media.alt.trim().length).toBeGreaterThan(0);
        expect(example.media.id.trim().length).toBeGreaterThan(0);
        expect(example.media.url).toMatch(/^https:\/\//);
      }
      expect(examples.every((example) => example.media.kind === 'image')).toBe(
        true
      );
      expect(detail?.content.showcase.workflows.items).toHaveLength(4);
      for (const workflow of detail?.content.showcase.workflows.items ?? []) {
        expect(workflow.entityId.trim().length).toBeGreaterThan(0);
        expect(workflow.prompt.trim().length).toBeGreaterThan(0);
        expect(workflow.media).toHaveLength(2);
        for (const media of workflow.media) {
          expect(media.alt.trim().length).toBeGreaterThan(0);
          expect(media.kind).toBe('image');
        }
      }
      expect(detail?.content.showcase.models.items).toHaveLength(1);
      for (const model of detail?.content.showcase.models.items ?? []) {
        expect(model.entityId.trim().length).toBeGreaterThan(0);
        expect(imageModelOptionFor(model.runtimeModelKey)).toBeDefined();
        expect(model.media.kind).toBe('image');
      }
      expect(detail?.showcaseRoutes).toEqual({
        workflows: [
          {
            entityId: 'ai-image-generator',
            href: '/tools/ai-image-generator',
          },
        ],
        models: [],
      });
      expect(detail?.content.useCases.items).toHaveLength(3);
      for (const useCase of detail?.content.useCases.items ?? []) {
        expect(useCase.id.trim().length).toBeGreaterThan(0);
        expect(useCase.media.kind).toBe('image');
      }
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
