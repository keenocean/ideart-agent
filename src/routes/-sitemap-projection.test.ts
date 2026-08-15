import { describe, expect, it } from 'vitest';

import {
  deduplicateSitemapEntries,
  renderSitemapXml,
  type SitemapEntry,
} from './sitemap[.]xml';

describe('sitemap projection', () => {
  it('deduplicates merged concrete URLs without throwing', () => {
    const entries: SitemapEntry[] = [
      {
        groupId: 'fixed:pricing',
        routes: [{ locale: 'en', path: '/pricing' }],
      },
      {
        groupId: 'catalog:duplicate',
        routes: [{ locale: 'en', path: '/pricing' }],
      },
      {
        groupId: 'blog:kept',
        routes: [{ locale: 'zh', path: '/blog/kept' }],
      },
    ];

    expect(deduplicateSitemapEntries(entries)).toEqual([
      entries[0],
      entries[2],
    ]);
  });

  it('serializes lastmod from each locale URL, not the translation group max', () => {
    const xml = renderSitemapXml([
      {
        groupId: 'blog:shared-slug',
        routes: [
          {
            locale: 'en',
            path: '/blog/shared-slug',
            lastModified: '2026-01-01T00:00:00.000Z',
          },
          {
            locale: 'zh',
            path: '/blog/shared-slug',
            lastModified: '2026-02-01T00:00:00.000Z',
          },
        ],
      },
    ]);

    expect(xml).toMatch(
      /<loc>http:\/\/localhost:3000\/blog\/shared-slug<\/loc>[\s\S]*?<lastmod>2026-01-01T00:00:00\.000Z<\/lastmod>/
    );
    expect(xml).toMatch(
      /<loc>http:\/\/localhost:3000\/zh\/blog\/shared-slug<\/loc>[\s\S]*?<lastmod>2026-02-01T00:00:00\.000Z<\/lastmod>/
    );
  });
});
