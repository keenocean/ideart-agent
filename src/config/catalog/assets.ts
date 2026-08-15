import type { MarketingAsset, MarketingImageAsset } from './types';

export const marketingAssetPublicDomain = 'https://cdn.ugcmind.com';

// Page media is added only after the immutable R2 object is uploaded and
// verified against the configured public domain.
export const marketingAssets = [
  {
    id: 'tools-ai-image-generator-0241fe76c3058fcd',
    kind: 'image',
    url: `${marketingAssetPublicDomain}/uploads/marketing/tools/ai-image-generator/0241fe76c3058fcd2d76f65471f5d6e81d400859f34764e2383eb637b54edeab.jpg`,
    mimeType: 'image/jpeg',
    width: 1536,
    height: 1024,
    bytes: 191357,
  },
  {
    id: 'tools-ai-image-generator-5d01838c8320ab5f',
    kind: 'image',
    url: `${marketingAssetPublicDomain}/uploads/marketing/tools/ai-image-generator/5d01838c8320ab5f3cdaa94b7d08deea55ebaaa5810e98f6afda3f46588f22e3.jpg`,
    mimeType: 'image/jpeg',
    width: 1536,
    height: 1024,
    bytes: 495018,
  },
  {
    id: 'tools-ai-image-generator-eee9f320ac365d1e',
    kind: 'image',
    url: `${marketingAssetPublicDomain}/uploads/marketing/tools/ai-image-generator/eee9f320ac365d1eb0e8cfec2b6ec3bd92e73c8616d2f6eadfea01f1ebfeb298.jpg`,
    mimeType: 'image/jpeg',
    width: 941,
    height: 1672,
    bytes: 383736,
  },
] as const satisfies readonly MarketingAsset[];

export type MarketingAssetId = (typeof marketingAssets)[number]['id'];

export function getMarketingImageAsset(
  id: MarketingAssetId
): MarketingImageAsset {
  const asset: MarketingAsset | undefined = marketingAssets.find(
    (entry) => entry.id === id
  );
  if (!asset || asset.kind !== 'image') {
    throw new Error(`Marketing image asset missing: ${id}`);
  }
  return asset;
}
