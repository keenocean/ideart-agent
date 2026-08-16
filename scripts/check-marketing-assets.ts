import { createHash } from 'node:crypto';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';

import {
  assertMarketingAssetUrl,
  verifyMarketingPublishedAsset,
} from '@/core/storage/marketing';
import type { MarketingAsset } from '@/config/catalog/types';
import {
  marketingAssetsSourceSchema,
  parseMarketingAsset,
  type MarketingAssetsSource,
} from '@/content/marketing/schema';

type QualityConfig = {
  publicAssets: {
    baselineFileCount: number;
    baselineBytes: number;
    shellAllowlist: string[];
    baselineManifest: string;
  };
  importGraph: {
    roots: string[];
    eagerGlobAllowlist: string[];
  };
};

const cwd = process.cwd();
const assetSource = marketingAssetsSourceSchema.parse(
  JSON.parse(
    readFileSync(path.join(cwd, 'product/marketing/assets.json'), 'utf8')
  )
) as MarketingAssetsSource;
const sourceAssets = new Map(
  assetSource.assets.map((asset) => [asset.id, asset] as const)
);
const marketingAssets: MarketingAsset[] = assetSource.assets.map((asset) => {
  if (asset.kind === 'image') return parseMarketingAsset(asset);
  const poster = sourceAssets.get(asset.posterAssetId);
  if (!poster || poster.kind !== 'image') {
    throw new Error(`Video poster image is missing: ${asset.id}`);
  }
  const { posterAssetId: _, ...video } = asset;
  return parseMarketingAsset({ ...video, poster });
});
const config = JSON.parse(
  readFileSync(path.join(cwd, 'config/marketing-quality.json'), 'utf8')
) as QualityConfig;
const baseline = JSON.parse(
  readFileSync(path.join(cwd, config.publicAssets.baselineManifest), 'utf8')
) as Record<string, string>;
const publicDir = path.join(cwd, 'public');
const shellAllowlist = new Set(config.publicAssets.shellAllowlist);
const failures: string[] = [];

function filesBelow(dir: string): string[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const absolute = path.join(dir, entry.name);
    return entry.isDirectory() ? filesBelow(absolute) : [absolute];
  });
}

const publicFiles = filesBelow(publicDir);
let publicBytes = 0;
for (const file of publicFiles) {
  const relative = path.relative(publicDir, file).split(path.sep).join('/');
  const body = readFileSync(file);
  publicBytes += body.byteLength;
  const digest = createHash('sha256').update(body).digest('hex');
  if (shellAllowlist.has(relative)) continue;
  if (!baseline[relative]) {
    failures.push(`new local public asset: public/${relative}`);
  } else if (baseline[relative] !== digest) {
    failures.push(`modified legacy public asset: public/${relative}`);
  }
}
if (publicFiles.length > config.publicAssets.baselineFileCount) {
  failures.push(
    `public file count grew: ${publicFiles.length} > ${config.publicAssets.baselineFileCount}`
  );
}
if (publicBytes > config.publicAssets.baselineBytes) {
  failures.push(
    `public bytes grew: ${publicBytes} > ${config.publicAssets.baselineBytes}`
  );
}

const sourceFiles = config.importGraph.roots.flatMap((root) => {
  const absolute = path.join(cwd, root);
  if (!existsSync(absolute)) return [];
  return statSync(absolute).isDirectory() ? filesBelow(absolute) : [absolute];
});
const forbiddenLocalMedia = /["'`]\/(?:images|videos|imgs)\//g;
const largeDataUrl =
  /data:(?:image|video)\/[^;]+;base64,[A-Za-z0-9+/=]{4096,}/g;
const dynamicMessageFunction = /\btDynamic\s*\(/g;
const runtimeMessageKey = /\bm\s*\[\s*(?!["'`])/g;
const eagerGlob = /import\.meta\.glob[\s\S]{0,500}?\beager\s*:\s*true/g;
const eagerGlobAllowlist = new Set(config.importGraph.eagerGlobAllowlist);
for (const file of sourceFiles) {
  if (!/\.(?:ts|tsx|js|jsx|json|md|mdx)$/.test(file)) continue;
  const source = readFileSync(file, 'utf8');
  if (forbiddenLocalMedia.test(source)) {
    failures.push(
      `local marketing media reference: ${path.relative(cwd, file)}`
    );
  }
  forbiddenLocalMedia.lastIndex = 0;
  if (largeDataUrl.test(source)) {
    failures.push(
      `large embedded marketing media: ${path.relative(cwd, file)}`
    );
  }
  largeDataUrl.lastIndex = 0;
  const relative = path.relative(cwd, file).split(path.sep).join('/');
  if (dynamicMessageFunction.test(source)) {
    failures.push(`dynamic marketing translation function: ${relative}`);
  }
  dynamicMessageFunction.lastIndex = 0;
  if (runtimeMessageKey.test(source)) {
    failures.push(`runtime-built marketing message key: ${relative}`);
  }
  runtimeMessageKey.lastIndex = 0;
  if (eagerGlob.test(source) && !eagerGlobAllowlist.has(relative)) {
    failures.push(`eager marketing content glob: ${relative}`);
  }
  eagerGlob.lastIndex = 0;
}

const requestedDomain = process.argv
  .find((arg) => arg.startsWith('--r2-domain='))
  ?.slice('--r2-domain='.length)
  .trim();
const publicDomain = requestedDomain || assetSource.publicDomain;

const assets = new Map<string, MarketingAsset>();
function registerAsset(asset: MarketingAsset): void {
  const existing = assets.get(asset.id);
  if (existing) {
    if (JSON.stringify(existing) !== JSON.stringify(asset)) {
      failures.push(`duplicate marketing asset id: ${asset.id}`);
    }
    return;
  }
  assets.set(asset.id, asset);
  if (asset.bytes <= 0 || asset.width <= 0 || asset.height <= 0) {
    failures.push(`invalid marketing asset metadata: ${asset.id}`);
  }
  if (publicDomain) {
    try {
      assertMarketingAssetUrl(asset.url, publicDomain);
    } catch (error) {
      failures.push(`${asset.id}: ${(error as Error).message}`);
    }
  }
  if (asset.kind === 'video') registerAsset(asset.poster);
}
for (const asset of marketingAssets) registerAsset(asset);

if (process.argv.includes('--online')) {
  for (const asset of assets.values()) {
    await verifyMarketingPublishedAsset(asset, publicDomain).catch((error) =>
      failures.push(`${asset.id}: ${(error as Error).message}`)
    );
  }
}

if (failures.length) {
  console.error(failures.map((failure) => `- ${failure}`).join('\n'));
  process.exitCode = 1;
} else {
  console.log(
    `Marketing asset check passed: public=${publicFiles.length} files/${publicBytes} bytes, R2=${assets.size}, online=${process.argv.includes('--online')}`
  );
}
