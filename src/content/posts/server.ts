import { createServerFn } from '@tanstack/react-start';

import type { Taxonomy } from '@/config/db/schema';
import { locales } from '@/paraglide/runtime.js';

import {
  dedupePosts,
  paginatePosts,
  type BlogCategory,
  type BlogPost,
  type BlogPostDetail,
} from './listing';

type DbPostRow = {
  slug: string;
  locale: string;
  title: string | null;
  description: string | null;
  image: string | null;
  categories: string | null;
  authorName: string | null;
  authorImage: string | null;
  createdAt: Date;
  updatedAt: Date;
};

function storedCategoryIds(value: string | null): string[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) {
      return parsed.filter((item): item is string => typeof item === 'string');
    }
  } catch {
    // Legacy admin posts store a single category id, not JSON.
  }
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function resolveCategories(
  value: string | null,
  categoryMap: Map<string, BlogCategory>
): BlogCategory[] {
  return storedCategoryIds(value)
    .map((id) => categoryMap.get(id))
    .filter((category): category is BlogCategory => category !== undefined);
}

function dbRowToPost(
  row: DbPostRow,
  categoryMap: Map<string, BlogCategory>
): BlogPost {
  return {
    slug: row.slug,
    title: row.title || row.slug,
    description: row.description || '',
    image: row.image || undefined,
    createdAt: new Date(row.createdAt).toISOString(),
    updatedAt: new Date(row.updatedAt).toISOString(),
    locale: row.locale,
    categories: resolveCategories(row.categories, categoryMap),
    authorName: row.authorName || undefined,
    authorImage: row.authorImage || undefined,
  };
}

async function getCategoryMap(): Promise<Map<string, BlogCategory>> {
  try {
    const { getAll } = await import('@/modules/taxonomy/service');
    const categories = (await getAll('category')) as Array<
      Pick<Taxonomy, 'id' | 'slug' | 'title'>
    >;
    return new Map(
      categories.map((category) => [
        category.id,
        { slug: category.slug, title: category.title },
      ])
    );
  } catch {
    return new Map();
  }
}

async function getDbPosts(locale: string): Promise<BlogPost[]> {
  try {
    const [{ listPublishedArticles }, categoryMap] = await Promise.all([
      import('@/modules/posts/service'),
      getCategoryMap(),
    ]);
    const rows = await listPublishedArticles({ locale });
    // Requested-locale rows must precede legacy language-neutral rows so
    // dedupePosts picks the real translation when both share a slug.
    rows.sort((a, b) => {
      const localeRank =
        Number(b.locale === locale) - Number(a.locale === locale);
      return localeRank || b.createdAt.getTime() - a.createdAt.getTime();
    });
    return rows.map((row) => dbRowToPost(row, categoryMap));
  } catch {
    // An unavailable database produces an empty public listing.
    return [];
  }
}

async function availableLocalesForSlug(slug: string): Promise<string[]> {
  const available = new Set<string>();
  try {
    const { listPublishedLocalesBySlug } =
      await import('@/modules/posts/service');
    const dbLocales = await listPublishedLocalesBySlug(slug);
    if (dbLocales.includes('')) {
      for (const locale of locales) available.add(locale);
    } else {
      for (const locale of dbLocales) available.add(locale);
    }
  } catch {
    // The current locale remains the safe metadata fallback when unavailable.
  }
  return locales.filter((locale) => available.has(locale));
}

/** All posts for small, featured surfaces such as the homepage. */
export const getBlogPostsFn = createServerFn()
  .inputValidator(
    (data: { locale: string; category?: string; limit?: number }) => data
  )
  .handler(async ({ data }) => {
    const posts = dedupePosts(await getDbPosts(data.locale));
    const filtered = data.category
      ? posts.filter((post) =>
          post.categories.some((item) => item.slug === data.category)
        )
      : posts;
    return data.limit ? filtered.slice(0, data.limit) : filtered;
  });

/** Paginated public Blog listing with categories derived from visible posts. */
export const getBlogPageFn = createServerFn()
  .inputValidator(
    (data: {
      locale: string;
      category?: string;
      page?: number;
      pageSize?: number;
    }) => data
  )
  .handler(async ({ data }) => {
    const posts = dedupePosts(await getDbPosts(data.locale));
    return paginatePosts(posts, data);
  });

/** Published database article for the requested locale. */
export const getBlogPostFn = createServerFn()
  .inputValidator((data: { slug: string; locale: string }) => data)
  .handler(async ({ data }): Promise<BlogPostDetail | null> => {
    try {
      const [{ findPublishedBySlug }, categoryMap] = await Promise.all([
        import('@/modules/posts/service'),
        getCategoryMap(),
      ]);
      const row = await findPublishedBySlug(data.slug, data.locale);
      if (row) {
        const item = dbRowToPost(row, categoryMap);
        return {
          ...item,
          content: row.content || '',
          availableLocales: await availableLocalesForSlug(data.slug),
        };
      }
    } catch {
      // A missing/unavailable database cannot serve an externalized article.
      return null;
    }
    return null;
  });
