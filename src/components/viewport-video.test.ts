import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { CatalogMedia } from '@/components/catalog/catalog-media';
import { ViewportVideo } from '@/components/viewport-video';

describe('ViewportVideo', () => {
  it('keeps video and poster requests out of the server-rendered page', () => {
    const markup = renderToStaticMarkup(
      createElement(ViewportVideo, {
        src: 'https://cdn.example.com/preview.mp4',
        poster: 'https://cdn.example.com/preview.jpg',
        ariaLabel: 'Preview',
      })
    );

    expect(markup).toContain('preload="none"');
    expect(markup).not.toContain('preview.mp4');
    expect(markup).not.toContain('preview.jpg');
  });
});

describe('CatalogMedia', () => {
  it('preloads and prioritizes the first-paint image', () => {
    const markup = renderToStaticMarkup(
      createElement(CatalogMedia, {
        asset: {
          id: 'hero-poster',
          kind: 'image',
          url: 'https://cdn.example.com/hero.jpg',
          mimeType: 'image/jpeg',
          width: 1280,
          height: 732,
          bytes: 1,
          alt: 'Hero poster',
        },
        priority: true,
      })
    );

    expect(markup).toContain(
      '<link rel="preload" as="image" href="https://cdn.example.com/hero.jpg" fetchPriority="high"/>'
    );
    expect(markup).toContain('loading="eager"');
    expect(markup).toContain('fetchPriority="high"');
    expect(markup).toContain('decoding="sync"');
  });

  it('withholds below-fold image URLs from server markup', () => {
    const markup = renderToStaticMarkup(
      createElement(CatalogMedia, {
        asset: {
          id: 'gallery-image',
          kind: 'image',
          url: 'https://cdn.example.com/gallery.jpg',
          mimeType: 'image/jpeg',
          width: 1280,
          height: 732,
          bytes: 1,
          alt: 'Gallery image',
        },
        deferUntilVisible: true,
      })
    );

    expect(markup).toContain('alt="Gallery image"');
    expect(markup).not.toContain('https://cdn.example.com/gallery.jpg');
  });
});
