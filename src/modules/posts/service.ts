import { and, count, desc, eq, like, or, type SQL } from 'drizzle-orm';

import { db } from '@/core/db';
import { post } from '@/config/db/schema';
import { isSupportedLocale } from '@/config/locale';
import { getUuid } from '@/lib/hash';

export enum PostType {
  ARTICLE = 'article',
  PAGE = 'page',
  LOG = 'log',
}

export enum PostStatus {
  PUBLISHED = 'published',
  PENDING = 'pending',
  DRAFT = 'draft',
  ARCHIVED = 'archived',
}

type Post = typeof post.$inferSelect;
type NewPost = typeof post.$inferInsert;

const POST_SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function normalizePostSlug(value: string): string {
  const slug = value.trim().toLowerCase();
  if (!POST_SLUG_PATTERN.test(slug)) {
    throw new Error(
      'Invalid slug: use lowercase letters, numbers, and single hyphens'
    );
  }
  return slug;
}

export function normalizePostLocale(value: string): string {
  const locale = value.trim();
  if (!locale) throw new Error('Locale is required');
  if (!isSupportedLocale(locale)) throw new Error('Unsupported locale');
  return locale;
}

export function isValidPostSlug(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    POST_SLUG_PATTERN.test(value.trim().toLowerCase())
  );
}

export type PublishedArticleItem = Pick<
  Post,
  | 'id'
  | 'slug'
  | 'locale'
  | 'title'
  | 'description'
  | 'image'
  | 'categories'
  | 'authorName'
  | 'authorImage'
  | 'createdAt'
  | 'updatedAt'
>;

export type PublishedArticleDetail = PublishedArticleItem &
  Pick<Post, 'content'>;

export async function list(params: {
  type?: string;
  status?: string;
  locale?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}) {
  const { type, status, locale, search, page = 1, pageSize = 10 } = params;
  const offset = (page - 1) * pageSize;

  const conditions: SQL[] = [];
  if (type) conditions.push(eq(post.type, type));
  if (status) conditions.push(eq(post.status, status));
  if (locale !== undefined) conditions.push(eq(post.locale, locale));
  if (search) {
    conditions.push(
      or(like(post.title, `%${search}%`), like(post.slug, `%${search}%`))!
    );
  }
  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [totalResult] = await db()
    .select({ count: count() })
    .from(post)
    .where(where);
  const total = totalResult.count;

  const items = await db()
    .select({
      id: post.id,
      slug: post.slug,
      locale: post.locale,
      type: post.type,
      title: post.title,
      description: post.description,
      image: post.image,
      categories: post.categories,
      authorName: post.authorName,
      status: post.status,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
    })
    .from(post)
    .where(where)
    .orderBy(desc(post.updatedAt), desc(post.createdAt))
    .limit(pageSize)
    .offset(offset);

  return { items, total };
}

export async function listPublishedArticles(
  params: { locale?: string; limit?: number } = {}
): Promise<PublishedArticleItem[]> {
  const { locale, limit } = params;
  const conditions: SQL[] = [
    eq(post.type, PostType.ARTICLE),
    eq(post.status, PostStatus.PUBLISHED),
  ];
  if (locale !== undefined) conditions.push(eq(post.locale, locale));
  const query = db()
    .select({
      id: post.id,
      slug: post.slug,
      locale: post.locale,
      title: post.title,
      description: post.description,
      image: post.image,
      categories: post.categories,
      authorName: post.authorName,
      authorImage: post.authorImage,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
    })
    .from(post)
    .where(and(...conditions))
    .orderBy(desc(post.createdAt));
  return limit ? query.limit(limit) : query;
}

export async function listPublishedArticleDetails(
  params: { locale?: string; limit?: number } = {}
): Promise<PublishedArticleDetail[]> {
  const { locale, limit } = params;
  const conditions: SQL[] = [
    eq(post.type, PostType.ARTICLE),
    eq(post.status, PostStatus.PUBLISHED),
  ];
  if (locale !== undefined) conditions.push(eq(post.locale, locale));
  const query = db()
    .select({
      id: post.id,
      slug: post.slug,
      locale: post.locale,
      title: post.title,
      description: post.description,
      image: post.image,
      categories: post.categories,
      authorName: post.authorName,
      authorImage: post.authorImage,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
      content: post.content,
    })
    .from(post)
    .where(and(...conditions))
    .orderBy(desc(post.createdAt));
  return limit ? query.limit(limit) : query;
}

export async function findPublishedBySlug(
  slug: string,
  locale: string
): Promise<Post | undefined> {
  const conditions: SQL[] = [
    eq(post.slug, slug.trim().toLowerCase()),
    eq(post.type, PostType.ARTICLE),
    eq(post.status, PostStatus.PUBLISHED),
    eq(post.locale, locale),
  ];
  const results = (await db()
    .select()
    .from(post)
    .where(and(...conditions))
    .limit(1)) as Post[];
  return results[0];
}

export async function listPublishedLocalesBySlug(
  slug: string
): Promise<string[]> {
  const rows = (await db()
    .select({ locale: post.locale })
    .from(post)
    .where(
      and(
        eq(post.slug, slug.trim().toLowerCase()),
        eq(post.type, PostType.ARTICLE),
        eq(post.status, PostStatus.PUBLISHED)
      )
    )) as Array<Pick<Post, 'locale'>>;
  return [...new Set(rows.map((item) => item.locale).filter(Boolean))];
}

export async function listPublishedArticleLocales(): Promise<string[]> {
  const rows = (await db()
    .select({ locale: post.locale })
    .from(post)
    .where(
      and(
        eq(post.type, PostType.ARTICLE),
        eq(post.status, PostStatus.PUBLISHED)
      )
    )) as Array<Pick<Post, 'locale'>>;
  return [...new Set(rows.map((item) => item.locale).filter(Boolean))];
}

export async function getById(id: string) {
  const [result] = await db()
    .select()
    .from(post)
    .where(eq(post.id, id))
    .limit(1);
  return result;
}

export async function create(data: {
  userId: string;
  slug: string;
  locale: string;
  title: string;
  description?: string;
  image?: string;
  content?: string;
  categories?: string;
  authorName?: string;
  status?: string;
}) {
  const newPost: NewPost = {
    id: getUuid(),
    userId: data.userId,
    slug: normalizePostSlug(data.slug),
    locale: normalizePostLocale(data.locale),
    type: PostType.ARTICLE,
    title: data.title,
    description: data.description || '',
    image: data.image || '',
    content: data.content || '',
    categories: data.categories || '',
    authorName: data.authorName || '',
    status: data.status || PostStatus.DRAFT,
  };
  await db().insert(post).values(newPost);
  return getById(newPost.id);
}

export async function update(
  id: string,
  data: {
    slug?: string;
    locale?: string;
    title?: string;
    description?: string;
    image?: string;
    content?: string;
    categories?: string;
    authorName?: string;
    status?: string;
  }
) {
  const updateData: any = { ...data };
  if (updateData.slug !== undefined) {
    updateData.slug = normalizePostSlug(updateData.slug);
  }
  if (updateData.locale !== undefined) {
    updateData.locale = normalizePostLocale(updateData.locale);
  }
  await db().update(post).set(updateData).where(eq(post.id, id));
  return getById(id);
}

export async function remove(id: string) {
  await db()
    .update(post)
    .set({ status: PostStatus.ARCHIVED })
    .where(eq(post.id, id));
}
