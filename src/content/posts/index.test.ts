import { describe, expect, it } from 'vitest';

import {
  dedupePosts,
  getBlogCategories,
  paginatePosts,
  type BlogPost,
} from './listing';

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

describe('dedupePosts', () => {
  it('deduplicates repeated database slugs while preserving the preferred row', () => {
    const preferred = post('shared', { title: 'Localized' });
    const fallback = post('shared', {
      title: 'Language neutral',
      locale: '',
    });

    expect(dedupePosts([preferred, fallback])).toEqual([preferred]);
  });
});

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
});
