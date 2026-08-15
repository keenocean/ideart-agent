import { createFileRoute } from '@tanstack/react-router';

import { getAuth } from '@/core/auth';
import {
  assertMarketingAssetUrl,
  MARKETING_ASSET_CACHE_CONTROL,
  marketingAssetKey,
  verifyMarketingImageAsset,
} from '@/core/storage/marketing';
import { normalizePostSlug } from '@/modules/posts/service';
import { hasPermission } from '@/modules/rbac/service';
import { getMarketingStorage } from '@/modules/storage/service';
import {
  BLOG_IMAGE_MAX_BYTES,
  BLOG_IMAGE_MAX_EDGE,
  BLOG_IMAGE_MAX_PIXELS,
  readImageDimensions,
  type SupportedBlogImageMime,
} from '@/lib/image-metadata';
import { respData, respErr } from '@/lib/resp';

const ALLOWED_TYPES = new Set<SupportedBlogImageMime>([
  'image/jpeg',
  'image/png',
  'image/webp',
]);
const EXTENSION_BY_MIME: Record<SupportedBlogImageMime, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

async function requireAdmin(request: Request): Promise<void> {
  const auth = getAuth();
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) throw new Error('Unauthorized');
  if (!(await hasPermission(session.user.id, 'admin.*'))) {
    throw new Error('Forbidden');
  }
}

async function sha256Hex(bytes: Uint8Array): Promise<string> {
  const digest = await crypto.subtle.digest(
    'SHA-256',
    Uint8Array.from(bytes).buffer
  );
  return [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

async function POST({ request }: { request: Request }) {
  try {
    await requireAdmin(request);
    const formData = await request.formData();
    const file = formData.get('file');
    const slugValue = formData.get('slug');
    if (!(file instanceof File)) return respErr('Image file is required');
    if (typeof slugValue !== 'string' || !slugValue.trim()) {
      return respErr('Save a valid post slug before uploading images');
    }
    const slug = normalizePostSlug(slugValue);
    if (!ALLOWED_TYPES.has(file.type as SupportedBlogImageMime)) {
      return respErr('Blog images must be JPEG, PNG, or WebP', { status: 415 });
    }
    if (file.size <= 0 || file.size > BLOG_IMAGE_MAX_BYTES) {
      return respErr('Blog images must be between 1 byte and 10 MB', {
        status: 413,
      });
    }

    const mimeType = file.type as SupportedBlogImageMime;
    const body = new Uint8Array(await file.arrayBuffer());
    const { width, height } = readImageDimensions(body, mimeType);
    if (
      width > BLOG_IMAGE_MAX_EDGE ||
      height > BLOG_IMAGE_MAX_EDGE ||
      width * height > BLOG_IMAGE_MAX_PIXELS
    ) {
      return respErr('Blog image dimensions are too large', { status: 413 });
    }

    const contentHash = await sha256Hex(body);
    const key = marketingAssetKey({
      surface: 'blog',
      slug,
      contentHash,
      extension: EXTENSION_BY_MIME[mimeType],
    });
    const { storage, publicDomain } = await getMarketingStorage();

    let url = storage.getPublicUrl({ key });
    let uploaded = false;
    if (!(await storage.exists({ key }))) {
      const result = await storage.uploadFile({
        body,
        key,
        contentType: mimeType,
        disposition: 'inline',
        cacheControl: MARKETING_ASSET_CACHE_CONTROL,
      });
      if (!result.success || !result.url) {
        throw new Error(result.error || 'Blog image upload failed');
      }
      url = result.url;
      uploaded = true;
    }
    if (!url) throw new Error('R2 did not return a public image URL');
    url = assertMarketingAssetUrl(url, publicDomain);
    await verifyMarketingImageAsset(
      { url, mimeType, bytes: body.byteLength },
      publicDomain
    );

    return respData({
      uploaded,
      asset: {
        url,
        mimeType,
        width,
        height,
        bytes: body.byteLength,
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Image upload failed';
    return respErr(message);
  }
}

export const Route = createFileRoute('/api/admin/posts/media')({
  server: { handlers: { POST } },
});
