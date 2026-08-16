import { readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';

import { catalog } from '@/config/catalog/registry';
import type {
  MarketingAsset,
  MarketingImageAsset,
} from '@/config/catalog/types';
import { locales } from '@/paraglide/runtime.js';
import { isCatalogPageContentAvailable } from '@/content/catalog-pages';
import {
  assertCatalogFirstFoldMedia,
  CATALOG_DETAIL_PERFORMANCE_POLICY_KINDS,
  CATALOG_FIRST_FOLD_MAX_ASSET_BYTES,
  CATALOG_FIRST_FOLD_MAX_TOTAL_BYTES,
  selectCatalogFirstFoldItems,
} from '@/content/catalog-performance';
import { getDefaultMarketingContentRegistry } from '@/content/marketing/store';
import { loadToolContentOrNull } from '@/content/tools/manifest';
import { validateToolPageContent } from '@/content/tools/validate';

function image(id: string, bytes: number): MarketingImageAsset {
  return {
    id,
    kind: 'image',
    url: `https://cdn.example.com/${id}.jpg`,
    mimeType: 'image/jpeg',
    width: 640,
    height: 480,
    bytes,
  };
}

describe('catalog first-fold performance policy', () => {
  it('selects only images within the per-asset and aggregate budgets', () => {
    const selected = selectCatalogFirstFoldItems([
      { media: image('first', 230_000) },
      { media: image('too-large', CATALOG_FIRST_FOLD_MAX_ASSET_BYTES + 1) },
      { media: image('second', 220_000) },
      { media: image('over-total', 250_000) },
      { media: image('third', 100_000) },
    ]);

    expect(selected.map((item) => item.media.id)).toEqual([
      'first',
      'second',
      'third',
    ]);
  });

  it('rejects videos and over-budget first-fold declarations', () => {
    const poster = image('poster', 100_000);
    const video: MarketingAsset = {
      id: 'video',
      kind: 'video',
      url: 'https://cdn.example.com/video.mp4',
      mimeType: 'video/mp4',
      width: 640,
      height: 480,
      bytes: 1_000_000,
      poster,
    };

    expect(() => assertCatalogFirstFoldMedia('fixture', [video])).toThrow(
      'must use the poster image'
    );
    expect(() =>
      assertCatalogFirstFoldMedia('fixture', [
        image('a', 205_000),
        image('b', 205_000),
        image('c', 1),
      ])
    ).not.toThrow();
    expect(() =>
      assertCatalogFirstFoldMedia('fixture', [
        image('a', 205_000),
        image('b', 205_000),
        image('c', 205_000),
      ])
    ).toThrow('first-fold media exceeds');
  });

  it('covers every currently publishable catalog kind', () => {
    const unsupported = catalog.flatMap((definition) =>
      locales.some((locale) =>
        isCatalogPageContentAvailable(definition, locale)
      ) && !CATALOG_DETAIL_PERFORMANCE_POLICY_KINDS.has(definition.kind)
        ? [definition.kind]
        : []
    );

    expect(unsupported).toEqual([]);
  });

  it('validates every published tool page through the shared policy', async () => {
    for (const definition of catalog) {
      if (definition.kind !== 'tool') continue;
      for (const locale of locales) {
        if (!isCatalogPageContentAvailable(definition, locale)) continue;
        const content = await loadToolContentOrNull(
          definition.entityId,
          locale
        );
        expect(content).not.toBeNull();
        if (content)
          expect(() =>
            validateToolPageContent(definition, content)
          ).not.toThrow();
      }
    }
  });

  it('keeps JSON-driven homepage marquee media within its eager budget', async () => {
    const registry = await getDefaultMarketingContentRegistry();
    for (const locale of locales) {
      const home = await registry.getHomeProjection(locale);
      expect(home?.media.marquee).toHaveLength(8);
      expect(home?.media.marquee.every((asset) => asset.kind === 'image')).toBe(
        true
      );
      expect(
        home?.media.marquee
          .slice(0, 3)
          .reduce((total, asset) => total + asset.bytes, 0)
      ).toBeLessThanOrEqual(64 * 1024);
    }
  });

  it('keeps catalog LCP text independent from network fonts', async () => {
    const [rootSource, globalCss, shellSource] = await Promise.all([
      readFile('src/routes/__root.tsx', 'utf8'),
      readFile('src/styles/globals.css', 'utf8'),
      readFile('src/components/catalog/tool-detail-shell.tsx', 'utf8'),
    ]);
    const criticalSource = `${rootSource}\n${globalCss}\n${shellSource}`;

    expect(criticalSource).not.toMatch(/fonts\.(?:googleapis|gstatic)\.com/);
    expect(rootSource).not.toContain('@fontsource');
    expect(globalCss).not.toContain('@font-face');
    expect(globalCss).toMatch(/--font-sans-stack:\s+ui-sans-serif/);
    expect(shellSource).toContain('content-heading');
  });

  it('keeps signed-out catalog chrome free of eager floating-menu code', async () => {
    const [headerSource, localeSource, mediaSource, viteSource] =
      await Promise.all([
        readFile('src/components/site-header.tsx', 'utf8'),
        readFile('src/components/locale-selector.tsx', 'utf8'),
        readFile('src/components/catalog/catalog-media.tsx', 'utf8'),
        readFile('vite.config.ts', 'utf8'),
      ]);

    expect(headerSource).toMatch(
      /lazy\(\(\) =>\s*import\('@\/components\/site-user-menu'\)/
    );
    expect(headerSource).not.toContain(
      "import { SiteUserMenu } from '@/components/site-user-menu'"
    );
    expect(localeSource).not.toContain('@/components/ui/dropdown-menu');
    expect(localeSource).toContain('<select');
    expect(mediaSource).toContain("fetchPriority={priority ? 'high' : 'low'}");
    expect(viteSource).toMatch(
      /compressPublicAssets:\s*isCloudflareBuild\s*\?\s*false\s*:\s*\{ gzip: true, brotli: true \}/
    );
  });
});
