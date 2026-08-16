import type { CatalogKind, MarketingAsset } from '@/config/catalog/types';

// First-fold catalog images are compact selectors, not full-resolution art.
// Keeping each one below 256 KiB and the group below 600 KiB prevents them
// from competing with the document and hydration bundle on constrained links.
export const CATALOG_FIRST_FOLD_MAX_ASSET_BYTES = 256 * 1024;
export const CATALOG_FIRST_FOLD_MAX_TOTAL_BYTES = 600 * 1024;
export const CATALOG_FIRST_FOLD_MAX_ITEMS = 3;

/** Publishing a new catalog kind is blocked until it joins this policy set. */
export const CATALOG_DETAIL_PERFORMANCE_POLICY_KINDS = new Set<CatalogKind>([
  'tool',
]);

type MediaItem = {
  media: MarketingAsset;
};

/**
 * Selects first-fold media in editorial order while enforcing the shared
 * catalog budget. Videos are never eligible: a first-fold video must be
 * explicitly converted to its poster image by the rendering boundary.
 */
export function selectCatalogFirstFoldItems<T extends MediaItem>(
  items: readonly T[],
  maxItems = CATALOG_FIRST_FOLD_MAX_ITEMS
): T[] {
  const selected: T[] = [];
  let selectedBytes = 0;

  for (const item of items) {
    if (selected.length >= maxItems) break;
    const { media } = item;
    if (
      media.kind !== 'image' ||
      media.bytes > CATALOG_FIRST_FOLD_MAX_ASSET_BYTES ||
      selectedBytes + media.bytes > CATALOG_FIRST_FOLD_MAX_TOTAL_BYTES
    ) {
      continue;
    }
    selected.push(item);
    selectedBytes += media.bytes;
  }

  return selected;
}

export function assertCatalogFirstFoldMedia(
  scope: string,
  media: readonly MarketingAsset[]
): void {
  let totalBytes = 0;

  for (const asset of media) {
    if (asset.kind === 'video') {
      throw new Error(
        `${scope} first-fold media must use the poster image, not video ${asset.id}`
      );
    }
    if (asset.bytes > CATALOG_FIRST_FOLD_MAX_ASSET_BYTES) {
      throw new Error(
        `${scope} first-fold asset ${asset.id} exceeds ${CATALOG_FIRST_FOLD_MAX_ASSET_BYTES} bytes (${asset.bytes})`
      );
    }
    totalBytes += asset.bytes;
  }

  if (totalBytes > CATALOG_FIRST_FOLD_MAX_TOTAL_BYTES) {
    throw new Error(
      `${scope} first-fold media exceeds ${CATALOG_FIRST_FOLD_MAX_TOTAL_BYTES} bytes (${totalBytes})`
    );
  }
}
