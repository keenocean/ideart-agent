import { describe, expect, it } from 'vitest';

import {
  formatOpenGraphLocale,
  getBlogCategories,
  getPublishedBlogLocales,
  isIndexableBlogListing,
  paginatePosts,
  type BlogPost,
} from './index';

function post(slug: string, overrides: Partial<BlogPost> = {}): BlogPost {
  return {
    slug,
    title: slug,
    description: '',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    locale: 'en',
    categories: [],
    ...overrides,
  };
}

describe('blog listing helpers', () => {
  const posts = [
    post('newest', {
      createdAt: '2026-03-03T00:00:00.000Z',
      categories: [{ slug: 'guides', title: 'Guides' }],
    }),
    post('middle', {
      createdAt: '2026-02-02T00:00:00.000Z',
      categories: [{ slug: 'updates', title: 'Updates' }],
    }),
    post('oldest', {
      categories: [{ slug: 'guides', title: 'Guides' }],
    }),
  ];

  it('filters by category and clamps an out-of-range page', () => {
    expect(
      paginatePosts(posts, { category: 'guides', page: 99, pageSize: 1 })
    ).toMatchObject({
      items: [posts[2]],
      page: 2,
      pageSize: 1,
      total: 2,
      totalPages: 2,
    });
  });

  it('builds a stable deduplicated category list', () => {
    expect(getBlogCategories(posts)).toEqual([
      { slug: 'guides', title: 'Guides' },
      { slug: 'updates', title: 'Updates' },
    ]);
  });

  it('publishes only explicitly stored locales', () => {
    const supported = ['en', 'zh', 'fr'];
    expect(getPublishedBlogLocales(['', 'en'], supported)).toEqual(['en']);
    expect(getPublishedBlogLocales(['fr', 'en'], supported)).toEqual([
      'en',
      'fr',
    ]);
    expect(getPublishedBlogLocales(['', 'de'], supported)).toEqual([]);
  });

  it('indexes only a populated, unfiltered first Blog page', () => {
    expect(
      isIndexableBlogListing({ total: 1, category: undefined, page: 1 })
    ).toBe(true);
    expect(
      isIndexableBlogListing({ total: 0, category: undefined, page: 1 })
    ).toBe(false);
    expect(
      isIndexableBlogListing({ total: 1, category: 'guides', page: 1 })
    ).toBe(false);
    expect(
      isIndexableBlogListing({ total: 10, category: undefined, page: 2 })
    ).toBe(false);
  });

  it('formats Open Graph locales for current and future languages', () => {
    expect(formatOpenGraphLocale('en')).toBe('en_US');
    expect(formatOpenGraphLocale('zh')).toBe('zh_CN');
    expect(formatOpenGraphLocale('pt-BR')).toBe('pt_BR');
  });
});
