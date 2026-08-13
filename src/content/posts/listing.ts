export type BlogCategory = {
  slug: string;
  title: string;
};

export type BlogPost = {
  slug: string;
  title: string;
  description: string;
  image?: string;
  /** ISO date strings — serializable across loader/server-fn boundaries. */
  createdAt: string;
  updatedAt: string;
  /** Empty means a legacy, language-neutral database post. */
  locale: string;
  categories: BlogCategory[];
  authorName?: string;
  authorImage?: string;
};

export type BlogPostDetail = BlogPost & {
  /** Raw markdown — set for database posts. */
  content?: string;
  /** Locales with a real translation, not merely a fallback. */
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

/**
 * Dedupe localized and language-neutral database rows by slug. Callers put
 * the preferred locale first, so the first row wins.
 */
export function dedupePosts(
  posts: BlogPost[],
  options: { limit?: number } = {}
): BlogPost[] {
  const bySlug = new Map<string, BlogPost>();
  for (const item of posts) {
    if (!bySlug.has(item.slug)) bySlug.set(item.slug, item);
  }

  const merged = [...bySlug.values()].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  return options.limit && options.limit > 0
    ? merged.slice(0, options.limit)
    : merged;
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
