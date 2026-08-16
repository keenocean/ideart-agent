import { describe, expect, it } from 'vitest';

import {
  distributeMasonryIndexes,
  masonryColumnClass,
  type CatalogGalleryItem,
} from './catalog-masonry-gallery';

const item = (
  id: string,
  width: number,
  height: number
): CatalogGalleryItem => ({
  id,
  title: id,
  prompt: id,
  media: {
    id,
    kind: 'image',
    url: `https://cdn.example.test/${id}.jpg`,
    mimeType: 'image/jpeg',
    width,
    height,
    bytes: 1,
    alt: id,
  },
});

describe('catalog masonry column projection', () => {
  it('caps image lanes by example count', () => {
    expect(masonryColumnClass(1, 'image')).toBe('columns-1');
    expect(masonryColumnClass(2, 'image')).toBe('columns-1 sm:columns-2');
    expect(masonryColumnClass(3, 'image')).toBe(
      'columns-1 sm:columns-2 lg:columns-3'
    );
    expect(masonryColumnClass(12, 'image')).toBe(
      'columns-1 sm:columns-2 lg:columns-3'
    );
  });

  it('uses the video reference density without empty desktop lanes', () => {
    expect(masonryColumnClass(1, 'dense')).toBe('columns-1');
    expect(masonryColumnClass(2, 'dense')).toBe('columns-2');
    expect(masonryColumnClass(3, 'dense')).toBe('columns-2 sm:columns-3');
    expect(masonryColumnClass(4, 'dense')).toBe(
      'columns-2 sm:columns-3 lg:columns-4'
    );
  });

  it('balances mixed natural heights across every available image lane', () => {
    const lanes = distributeMasonryIndexes(
      [
        item('landscape-a', 3, 2),
        item('landscape-b', 3, 2),
        item('portrait', 9, 16),
      ],
      3
    );
    expect(lanes).toHaveLength(3);
    expect(lanes.every((lane) => lane.length === 1)).toBe(true);
    expect(lanes.flat().sort()).toEqual([0, 1, 2]);
  });
});
