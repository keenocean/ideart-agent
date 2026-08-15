import type { BlogImageRef } from '@/lib/blog-images';

export type BlogCategory = {
  slug: string;
  title: string;
};

export type BlogPost = {
  slug: string;
  title: string;
  description: string;
  image?: BlogImageRef;
  /** ISO date strings — serializable across loader/server-fn boundaries. */
  createdAt: string;
  updatedAt: string;
  /** Explicit supported locale stored with the article. */
  locale: string;
  categories: BlogCategory[];
  authorName?: string;
  authorImage?: string;
};

export type BlogPostDetail = BlogPost & {
  /** Raw markdown — set for database posts. */
  content?: string;
  /** Supported locales with a published translation for this slug. */
  availableLocales: string[];
};

export type BlogPage = {
  items: BlogPost[];
  categories: BlogCategory[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export function isIndexableBlogListing(options: {
  total: number;
  category?: string;
  page: number;
}): boolean {
  return options.total > 0 && !options.category && options.page === 1;
}

export function getPublishedBlogLocales(
  storedLocales: readonly string[],
  supportedLocales: readonly string[]
): string[] {
  const stored = new Set(storedLocales.filter(Boolean));
  return supportedLocales.filter((locale) => stored.has(locale));
}

export function getBlogCategories(posts: BlogPost[]): BlogCategory[] {
  const bySlug = new Map<string, BlogCategory>();
  for (const post of posts) {
    for (const category of post.categories) {
      if (!bySlug.has(category.slug)) bySlug.set(category.slug, category);
    }
  }
  return [...bySlug.values()];
}

export function paginatePosts(
  posts: BlogPost[],
  options: { category?: string; page?: number; pageSize?: number } = {}
): BlogPage {
  const category = options.category?.trim().toLowerCase();
  const filtered = category
    ? posts.filter((post) =>
        post.categories.some((item) => item.slug === category)
      )
    : posts;
  const pageSize = Math.min(24, Math.max(1, options.pageSize || 9));
  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const requestedPage = Number.isFinite(options.page) ? options.page! : 1;
  const page = Math.min(totalPages, Math.max(1, Math.floor(requestedPage)));
  const offset = (page - 1) * pageSize;

  return {
    items: filtered.slice(offset, offset + pageSize),
    categories: getBlogCategories(posts),
    page,
    pageSize,
    total,
    totalPages,
  };
}
