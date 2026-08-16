import { describe, expect, it } from 'vitest';

import type { CatalogGalleryItem } from '@/components/catalog/catalog-masonry-gallery';
import { selectCatalogFirstFoldItems } from '@/content/catalog-performance';

function galleryItem(id: string, bytes: number): CatalogGalleryItem {
  return {
    id,
    title: id,
    prompt: id,
    media: {
      id,
      kind: 'image',
      url: `https://cdn.example.com/${id}.jpg`,
      mimeType: 'image/jpeg',
      width: 640,
      height: 480,
      bytes,
      alt: id,
    },
  };
}

describe('selectCatalogFirstFoldItems', () => {
  it('preserves editorial order while capping first-fold concurrency', () => {
    const selected = selectCatalogFirstFoldItems([
      galleryItem('first', 230_000),
      galleryItem('second', 220_000),
      galleryItem('too-heavy', 250_000),
      galleryItem('fourth', 100_000),
      galleryItem('fifth', 40_000),
    ]);

    expect(selected.map((item) => item.id)).toEqual([
      'first',
      'second',
      'fourth',
    ]);
    expect(selected.reduce((total, item) => total + item.media.bytes, 0)).toBe(
      550_000
    );
  });

  it('honors the requested item limit', () => {
    const selected = selectCatalogFirstFoldItems(
      [galleryItem('first', 100), galleryItem('second', 100)],
      1
    );

    expect(selected.map((item) => item.id)).toEqual(['first']);
  });
});
