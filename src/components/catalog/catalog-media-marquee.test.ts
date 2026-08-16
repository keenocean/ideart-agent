import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import {
  CatalogMediaMarquee,
  type CatalogMediaMarqueeItem,
} from '@/components/catalog/catalog-media-marquee';

const items: CatalogMediaMarqueeItem[] = Array.from(
  { length: 5 },
  (_, index) => ({
    id: `item-${index}`,
    kind: 'image',
    url: `/item-${index}.jpg`,
    mimeType: 'image/jpeg',
    width: 320,
    height: 568,
    bytes: 10_000,
    alt: `Item ${index}`,
  })
);

describe('CatalogMediaMarquee', () => {
  it('limits first-fold requests and keeps duplicate media deferred', () => {
    const markup = renderToStaticMarkup(
      createElement(CatalogMediaMarquee, {
        items,
        label: 'Examples',
        pauseLabel: 'Pause',
        playLabel: 'Play',
      })
    );

    expect(markup).toContain('data-media-marquee="true"');
    expect(markup).toContain('aria-hidden="true"');
    expect(markup).not.toContain('<video');
    expect(markup).toContain('/item-0.jpg');
    expect(markup).toContain('/item-1.jpg');
    expect(markup).toContain('/item-2.jpg');
    expect(markup).not.toContain('/item-3.jpg');
    expect(markup).not.toContain('/item-4.jpg');
    expect(markup.match(/fetchPriority="high"/g)).toHaveLength(6);
  });
});
