export const MARKETING_ASSET_CACHE_CONTROL =
  'public, max-age=31536000, immutable';

const SAFE_PART = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const SAFE_HASH = /^[a-f0-9]{16,128}$/;
const SAFE_EXTENSION = /^[a-z0-9]{2,8}$/;
const IMMUTABLE_MARKETING_PATH =
  /\/marketing\/[a-z0-9]+(?:-[a-z0-9]+)*\/[a-z0-9]+(?:-[a-z0-9]+)*\/[a-f0-9]{16,128}\.[a-z0-9]{2,8}$/;

export function normalizeMarketingPublicDomain(value: string): string {
  const url = new URL(value);
  if (
    url.protocol !== 'https:' ||
    url.username ||
    url.password ||
    url.search ||
    url.hash ||
    (url.pathname !== '/' && url.pathname !== '') ||
    url.hostname === 'localhost' ||
    url.hostname === '127.0.0.1' ||
    url.hostname.endsWith('.r2.cloudflarestorage.com')
  ) {
    throw new Error(
      'Marketing R2 domain must be a public HTTPS custom domain origin'
    );
  }
  return url.origin;
}

export function marketingAssetKey(options: {
  surface: string;
  slug: string;
  contentHash: string;
  extension: string;
}): string {
  const { surface, slug } = options;
  const contentHash = options.contentHash.toLowerCase();
  const extension = options.extension.toLowerCase().replace(/^\./, '');
  if (!SAFE_PART.test(surface) || !SAFE_PART.test(slug)) {
    throw new Error('Marketing asset surface and slug must be safe segments');
  }
  if (!SAFE_HASH.test(contentHash)) {
    throw new Error('Marketing asset content hash is invalid');
  }
  if (!SAFE_EXTENSION.test(extension)) {
    throw new Error('Marketing asset extension is invalid');
  }
  return `marketing/${surface}/${slug}/${contentHash}.${extension}`;
}

export function assertMarketingAssetUrl(
  value: string,
  publicDomain: string
): string {
  const domain = normalizeMarketingPublicDomain(publicDomain);
  const url = new URL(value);
  if (
    url.origin !== domain ||
    url.protocol !== 'https:' ||
    url.username ||
    url.password ||
    url.search ||
    url.hash ||
    !IMMUTABLE_MARKETING_PATH.test(url.pathname)
  ) {
    throw new Error('Marketing asset URL is outside the configured R2 domain');
  }
  return url.href;
}

export async function verifyMarketingImageAsset(
  asset: { url: string; mimeType: string; bytes: number },
  publicDomain: string
): Promise<string> {
  return verifyMarketingPublishedAsset(
    { ...asset, kind: 'image' },
    publicDomain
  );
}

export async function verifyMarketingPublishedAsset(
  asset: {
    url: string;
    mimeType: string;
    bytes: number;
    kind: 'image' | 'video';
  },
  publicDomain: string
): Promise<string> {
  const url = assertMarketingAssetUrl(asset.url, publicDomain);
  const response = await fetch(url, {
    method: asset.kind === 'video' ? 'GET' : 'HEAD',
    headers: asset.kind === 'video' ? { Range: 'bytes=0-0' } : undefined,
  });
  const expectedStatus = asset.kind === 'video' ? 206 : 200;
  if (response.status !== expectedStatus) {
    throw new Error(
      `Published ${asset.kind} returned HTTP ${response.status}, expected ${expectedStatus}`
    );
  }
  const contentType = (response.headers.get('content-type') || '')
    .split(';', 1)[0]
    .trim()
    .toLowerCase();
  if (contentType !== asset.mimeType) {
    throw new Error(`Published ${asset.kind} MIME does not match its metadata`);
  }
  if (response.headers.get('cache-control') !== MARKETING_ASSET_CACHE_CONTROL) {
    throw new Error(
      `Published ${asset.kind} is missing immutable cache metadata`
    );
  }
  const disposition = response.headers.get('content-disposition') ?? '';
  if (!/^inline(?:\s*;|$)/i.test(disposition.trim())) {
    throw new Error(`Published ${asset.kind} must use inline disposition`);
  }
  const bytes =
    asset.kind === 'video'
      ? bytesFromContentRange(response.headers.get('content-range'))
      : bytesFromContentLength(response.headers.get('content-length'));
  if (bytes !== asset.bytes) {
    throw new Error(`Published ${asset.kind} size does not match its metadata`);
  }
  return url;
}

function bytesFromContentLength(value: string | null): number | undefined {
  return value !== null && /^\d+$/.test(value) ? Number(value) : undefined;
}

function bytesFromContentRange(value: string | null): number | undefined {
  const total = value?.match(/^bytes \d+-\d+\/(\d+)$/i)?.[1];
  return total ? Number(total) : undefined;
}
