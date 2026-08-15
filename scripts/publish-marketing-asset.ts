import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

import {
  assertMarketingAssetUrl,
  MARKETING_ASSET_CACHE_CONTROL,
  marketingAssetKey,
  verifyMarketingPublishedAsset,
} from '@/core/storage/marketing';
import { loadEnvFiles } from '@/lib/env';

loadEnvFiles();

const options = new Map(
  process.argv.slice(2).flatMap((argument) => {
    const match = argument.match(/^--([^=]+)=(.+)$/);
    return match ? [[match[1], match[2]] as const] : [];
  })
);
const input = options.get('file');
const surface = options.get('surface');
const slug = options.get('slug');
const mimeType = options.get('mime');
const width = Number(options.get('width'));
const height = Number(options.get('height'));
if (
  !input ||
  !surface ||
  !slug ||
  !mimeType ||
  !Number.isInteger(width) ||
  width <= 0 ||
  !Number.isInteger(height) ||
  height <= 0 ||
  (!mimeType.startsWith('image/') && !mimeType.startsWith('video/'))
) {
  throw new Error(
    'Usage: pnpm marketing:upload-asset -- --file=... --surface=... --slug=... --mime=image/webp --width=1200 --height=630'
  );
}
const kind = mimeType.startsWith('video/') ? 'video' : 'image';
const posterInput = (() => {
  if (kind !== 'video') return undefined;
  const url = options.get('poster-url');
  const id = options.get('poster-id');
  const posterMime = options.get('poster-mime');
  const posterWidth = Number(options.get('poster-width'));
  const posterHeight = Number(options.get('poster-height'));
  const posterBytes = Number(options.get('poster-bytes'));
  if (
    !url ||
    !id ||
    !posterMime?.startsWith('image/') ||
    !Number.isInteger(posterWidth) ||
    posterWidth <= 0 ||
    !Number.isInteger(posterHeight) ||
    posterHeight <= 0 ||
    !Number.isInteger(posterBytes) ||
    posterBytes <= 0
  ) {
    throw new Error(
      'Video uploads require --poster-url, --poster-id, --poster-mime, --poster-width, --poster-height and --poster-bytes from a previously verified R2 image upload'
    );
  }
  return {
    id,
    url,
    mimeType: posterMime as `image/${string}`,
    width: posterWidth,
    height: posterHeight,
    bytes: posterBytes,
  };
})();
const absoluteFile = path.resolve(input);
if (!existsSync(absoluteFile))
  throw new Error(`Asset does not exist: ${input}`);
const body = readFileSync(absoluteFile);
const contentHash = createHash('sha256').update(body).digest('hex');
const extension = path.extname(absoluteFile).slice(1);
const key = marketingAssetKey({ surface, slug, contentHash, extension });
const { getMarketingStorage } = await import('@/modules/storage/service');
const { storage, publicDomain } = await getMarketingStorage();

let url: string | undefined;
let uploaded = false;
if (await storage.exists({ key })) {
  url = storage.getPublicUrl({ key });
} else {
  const result = await storage.uploadFile({
    body,
    key,
    contentType: mimeType,
    disposition: 'inline',
    cacheControl: MARKETING_ASSET_CACHE_CONTROL,
  });
  if (!result.success || !result.url) {
    throw new Error(result.error || 'Marketing asset upload failed');
  }
  url = result.url;
  uploaded = true;
}
if (!url) throw new Error('R2 provider did not return a public URL');
assertMarketingAssetUrl(url, publicDomain);

await verifyMarketingPublishedAsset(
  { url, mimeType, kind, bytes: body.byteLength },
  publicDomain
);

let poster:
  | {
      id: string;
      kind: 'image';
      url: string;
      mimeType: `image/${string}`;
      width: number;
      height: number;
      bytes: number;
    }
  | undefined;
if (kind === 'video') {
  if (!posterInput) throw new Error('Video poster validation did not run');
  assertMarketingAssetUrl(posterInput.url, publicDomain);
  await verifyMarketingPublishedAsset(
    { ...posterInput, kind: 'image' },
    publicDomain
  );
  poster = {
    id: posterInput.id,
    kind: 'image',
    url: posterInput.url,
    mimeType: posterInput.mimeType,
    width: posterInput.width,
    height: posterInput.height,
    bytes: posterInput.bytes,
  };
}

console.log(
  JSON.stringify(
    {
      uploaded,
      asset: {
        id: `${surface}-${slug}-${contentHash.slice(0, 16)}`,
        kind,
        url,
        mimeType,
        width,
        height,
        bytes: body.byteLength,
        ...(poster ? { poster } : {}),
      },
    },
    null,
    2
  )
);
