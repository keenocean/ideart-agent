import { createFileRoute } from '@tanstack/react-router';

import { getAuth } from '@/core/auth';
import * as postsService from '@/modules/posts/service';
import { hasPermission } from '@/modules/rbac/service';
import { respData, respErr, respOk, respPage } from '@/lib/resp';
import { baseLocale, locales } from '@/paraglide/runtime.js';

const POST_STATUSES = new Set(Object.values(postsService.PostStatus));

function isValidLocale(locale: unknown): locale is (typeof locales)[number] {
  return (
    typeof locale === 'string' &&
    locales.includes(locale as (typeof locales)[number])
  );
}

function isValidStoredLocale(locale: unknown): locale is string {
  return locale === '' || isValidLocale(locale);
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
      return respData(post);
    }

    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const pageSize = Math.min(
      100,
      Math.max(1, parseInt(searchParams.get('pageSize') || '20'))
    );
    const search = searchParams.get('search') || undefined;
    const status = searchParams.get('status') || undefined;
    const localeParam = searchParams.get('locale');
    const locale = isValidLocale(localeParam) ? localeParam : undefined;

    const { items, total } = await postsService.list({
      search,
      status,
      locale,
      page,
      pageSize,
    });
    return respPage(items, total);
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
      image,
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
    if (!isValidStoredLocale(locale)) return respErr('Invalid locale');
    if (status && !POST_STATUSES.has(status)) return respErr('Invalid status');
    const result = await postsService.create({
      userId: session.user.id,
      slug,
      locale,
      title,
      description,
      image,
      content,
      categories,
      authorName,
      status,
    });
    return respData(result);
  } catch (error: any) {
    return respErr(error.message || 'Internal error');
  }
}

async function PUT({ request }: { request: Request }) {
  try {
    await checkAdmin(request);
    const {
      id,
      slug,
      locale,
      title,
      description,
      image,
      content,
      categories,
      authorName,
      status,
    } = await request.json();
    if (!id) return respErr('ID is required');
    if (slug !== undefined && !postsService.isValidPostSlug(slug)) {
      return respErr(
        'Invalid slug: use lowercase letters, numbers, and single hyphens'
      );
    }
    if (locale !== undefined && !isValidStoredLocale(locale)) {
      return respErr('Invalid locale');
    }
    if (status && !POST_STATUSES.has(status)) return respErr('Invalid status');
    const result = await postsService.update(id, {
      slug,
      locale,
      title,
      description,
      image,
      content,
      categories,
      authorName,
      status,
    });
    return respData(result);
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
