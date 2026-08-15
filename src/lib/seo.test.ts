import { describe, expect, it } from 'vitest';

import {
  buildAbsoluteSeoUrl,
  buildSeoHead,
  serializeJsonLd,
  validateSeoPath,
} from './seo';

describe('SEO head contract', () => {
  it('uses one locale-free path contract for base and prefixed locales', () => {
    expect(
      buildAbsoluteSeoUrl(
        { locale: 'en', path: '/pricing' },
        { appUrl: 'https://example.com' }
      )
    ).toBe('https://example.com/pricing');
    expect(
      buildAbsoluteSeoUrl(
        { locale: 'zh', path: '/pricing' },
        { appUrl: 'https://example.com' }
      )
    ).toBe('https://example.com/zh/pricing');
  });

  it('rejects prefixed, encoded, query and malformed paths', () => {
    for (const path of [
      '/zh/pricing',
      '/pricing?x=1',
      '/pricing#x',
      '//pricing',
      '/a%2Fb',
      '/pricing/',
    ]) {
      expect(() => validateSeoPath(path)).toThrow();
    }
  });

  it('emits reciprocal alternates and x-default only for indexable pages', () => {
    const head = buildSeoHead({
      kind: 'website',
      title: 'Pricing',
      description: 'Plans',
      canonical: { locale: 'zh', path: '/pricing' },
      alternates: [
        { locale: 'en', path: '/pricing' },
        { locale: 'zh', path: '/pricing' },
      ],
      indexing: 'index',
    });
    expect(head.links).toEqual(
      expect.arrayContaining([
        {
          rel: 'canonical',
          href: 'http://localhost:3000/zh/pricing',
        },
        {
          rel: 'alternate',
          hrefLang: 'x-default',
          href: 'http://localhost:3000/pricing',
        },
      ])
    );
    expect(
      head.meta.find(
        (entry) => 'property' in entry && entry.property === 'og:url'
      )
    ).toEqual({
      property: 'og:url',
      content: 'http://localhost:3000/zh/pricing',
    });
  });

  it('forces noindex pages to omit hreflang', () => {
    const head = buildSeoHead({
      kind: 'website',
      title: 'Draft',
      description: 'Draft page',
      canonical: { locale: 'en', path: '/pricing' },
      alternates: [
        { locale: 'en', path: '/pricing' },
        { locale: 'zh', path: '/pricing' },
      ],
      indexing: 'noindex',
    });
    expect(head.links).toEqual([
      { rel: 'canonical', href: 'http://localhost:3000/pricing' },
    ]);
    expect(head.meta).toContainEqual({
      name: 'robots',
      content: 'noindex,follow',
    });
  });

  it('preserves only explicitly allowed functional search parameters', () => {
    expect(
      buildAbsoluteSeoUrl(
        { locale: 'en', path: '/blog' },
        {
          appUrl: 'https://example.com',
          search: {
            allowedNames: ['category', 'page'],
            parameters: [
              { name: 'category', value: 'guides' },
              { name: 'page', value: '2' },
            ],
          },
        }
      )
    ).toBe('https://example.com/blog?category=guides&page=2');
    expect(() =>
      buildAbsoluteSeoUrl(
        { locale: 'en', path: '/blog' },
        {
          search: {
            allowedNames: ['page'],
            parameters: [{ name: 'utm_source', value: 'x' }],
          },
        }
      )
    ).toThrow(/utm_source/);
  });

  it('serializes JSON-LD safely for an HTML script context', () => {
    expect(serializeJsonLd({ value: '</script><script>' })).toContain(
      '\\u003c/script>'
    );
  });

  it('keeps the visible article headline separate from the browser title', () => {
    const head = buildSeoHead({
      kind: 'article',
      title: 'Visible headline | Example',
      headline: 'Visible headline',
      description: 'Article description',
      canonical: { locale: 'en', path: '/blog/visible-headline' },
      alternates: [{ locale: 'en', path: '/blog/visible-headline' }],
      indexing: 'index',
      publishedTime: '2026-08-01T00:00:00.000Z',
      modifiedTime: '2026-08-02T00:00:00.000Z',
    });
    const jsonLd = JSON.parse(head.scripts![0].children);
    expect(jsonLd['@graph'][0].headline).toBe('Visible headline');
  });
});
