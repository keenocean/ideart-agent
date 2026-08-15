import { createFileRoute } from '@tanstack/react-router';

import { getAuth } from '@/core/auth';
import { verifyMarketingImageAsset } from '@/core/storage/marketing';
import { isSupportedLocale } from '@/config/locale';
import * as postsService from '@/modules/posts/service';
import { hasPermission } from '@/modules/rbac/service';
import { getMarketingStorage } from '@/modules/storage/service';
import {
  inspectBlogMarkdownImages,
  parseBlogImageRef,
  parseStoredBlogImage,
  serializeStoredBlogImage,
  type BlogImageRef,
} from '@/lib/blog-images';
import { respData, respErr, respOk, respPage } from '@/lib/resp';
import { baseLocale } from '@/paraglide/runtime.js';

const POST_STATUSES = new Set(Object.values(postsService.PostStatus));

function postForAdmin<T extends { image: string | null }>(post: T) {
  return { ...post, image: parseStoredBlogImage(post.image) };
}

function incomingImage(value: unknown): BlogImageRef | null {
  if (value === null || value === undefined || value === '') return null;
  const image = parseBlogImageRef(value);
  if (!image) throw new Error('Cover image metadata is invalid');
  return image;
}

async function validateBlogImages(options: {
  cover: BlogImageRef | null;
  content: string;
  status: string;
}): Promise<void> {
  const inventory = inspectBlogMarkdownImages(options.content);
  if (inventory.invalidImages > 0) {
    throw new Error(
      'Every body image must be uploaded with alt text and image metadata'
    );
  }
  if (options.status === postsService.PostStatus.PUBLISHED && !options.cover) {
    throw new Error('A published post requires an R2 cover image');
  }
  const images = [
    ...(options.cover ? [options.cover] : []),
    ...inventory.images,
  ];
  if (images.length === 0) return;
  const { publicDomain } = await getMarketingStorage();
  const uniqueAssets = [
    ...new Map(
      images.map((image) => [
        `${image.url}:${image.mimeType}:${image.bytes}`,
        image,
      ])
    ).values(),
  ];
  await Promise.all(
    uniqueAssets.map((image) => verifyMarketingImageAsset(image, publicDomain))
  );
}

async function checkAdmin(request: Request) {
  const auth = getAuth();
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) throw new Error('Unauthorized');
  const isAdmin = await hasPermission(session.user.id, 'admin.*');
  if (!isAdmin) throw new Error('Forbidden');
  return session;
}

async function GET({ request }: { request: Request }) {
  try {
    await checkAdmin(request);
    const { searchParams } = new URL(request.url);

    // Single post (with content) — used by the editor
    const id = searchParams.get('id');
    if (id) {
      const post = await postsService.getById(id);
      if (!post) return respErr('Post not found');
      return respData(postForAdmin(post));
    }

    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const pageSize = Math.min(
      100,
      Math.max(1, parseInt(searchParams.get('pageSize') || '20'))
    );
    const search = searchParams.get('search') || undefined;
    const status = searchParams.get('status') || undefined;
    const localeParam = searchParams.get('locale');
    const locale = isSupportedLocale(localeParam) ? localeParam : undefined;

    const { items, total } = await postsService.list({
      search,
      status,
      locale,
      page,
      pageSize,
    });
    return respPage(items.map(postForAdmin), total);
  } catch (error: any) {
    return respErr(error.message || 'Internal error');
  }
}

async function POST({ request }: { request: Request }) {
  try {
    const session = await checkAdmin(request);
    const {
      slug,
      locale = baseLocale,
      title,
      description,
      image: imageValue,
      content,
      categories,
      authorName,
      status,
    } = await request.json();
    if (!slug || !title) return respErr('slug and title are required');
    if (!postsService.isValidPostSlug(slug)) {
      return respErr(
        'Invalid slug: use lowercase letters, numbers, and single hyphens'
      );
    }
    if (!isSupportedLocale(locale)) return respErr('Invalid locale');
    if (status && !POST_STATUSES.has(status)) return respErr('Invalid status');
    const image = incomingImage(imageValue);
    const nextStatus = status || postsService.PostStatus.DRAFT;
    const nextContent = typeof content === 'string' ? content : '';
    await validateBlogImages({
      cover: image,
      content: nextContent,
      status: nextStatus,
    });
    const result = await postsService.create({
      userId: session.user.id,
      slug,
      locale,
      title,
      description,
      image: image ? serializeStoredBlogImage(image) : '',
      content: nextContent,
      categories,
      authorName,
      status,
    });
    return respData(result ? postForAdmin(result) : result);
  } catch (error: any) {
    return respErr(error.message || 'Internal error');
  }
}

async function PUT({ request }: { request: Request }) {
  try {
    await checkAdmin(request);
    const payload = await request.json();
    const {
      id,
      slug,
      locale,
      title,
      description,
      content,
      categories,
      authorName,
      status,
    } = payload;
    if (!id) return respErr('ID is required');
    if (slug !== undefined && !postsService.isValidPostSlug(slug)) {
      return respErr(
        'Invalid slug: use lowercase letters, numbers, and single hyphens'
      );
    }
    if (locale !== undefined && !isSupportedLocale(locale)) {
      return respErr('Invalid locale');
    }
    if (status && !POST_STATUSES.has(status)) return respErr('Invalid status');
    const existing = await postsService.getById(id);
    if (!existing) return respErr('Post not found');
    const hasImage = Object.prototype.hasOwnProperty.call(payload, 'image');
    const image = hasImage
      ? incomingImage(payload.image)
      : parseStoredBlogImage(existing.image);
    const nextContent =
      typeof content === 'string' ? content : existing.content || '';
    await validateBlogImages({
      cover: image,
      content: nextContent,
      status: status || existing.status,
    });
    const result = await postsService.update(id, {
      slug,
      locale,
      title,
      description,
      image: hasImage
        ? image
          ? serializeStoredBlogImage(image)
          : ''
        : undefined,
      content,
      categories,
      authorName,
      status,
    });
    return respData(result ? postForAdmin(result) : result);
  } catch (error: any) {
    return respErr(error.message || 'Internal error');
  }
}

async function DELETE({ request }: { request: Request }) {
  try {
    await checkAdmin(request);
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return respErr('ID is required');
    await postsService.remove(id);
    return respOk();
  } catch (error: any) {
    return respErr(error.message || 'Internal error');
  }
}

export const Route = createFileRoute('/api/admin/posts')({
  server: {
    handlers: { GET, POST, PUT, DELETE },
  },
});
