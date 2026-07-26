import { describe, expect, it } from 'vitest';

import { resolveReferenceImage } from './tools';

// Whatever this returns is handed to an image provider, which fetches it from
// the outside. A path that only resolves inside the browser gets an image
// nobody can read.
const APP = 'https://example.com';

describe('resolveReferenceImage', () => {
  it('passes absolute URLs through untouched', () => {
    for (const url of [
      'https://cdn.example.com/a.png',
      'http://cdn.example.com/a.png',
      'HTTPS://CDN.EXAMPLE.COM/A.PNG',
    ]) {
      expect(resolveReferenceImage(url, APP)).toBe(url);
    }
  });

  it('passes data URIs through untouched', () => {
    const uri = 'data:image/png;base64,iVBORw0KGgo=';
    expect(resolveReferenceImage(uri, APP)).toBe(uri);
  });

  it('makes a site-relative path absolute', () => {
    // The example browser attaches its samples this way.
    expect(resolveReferenceImage('/imgs/examples/a.webp', APP)).toBe(
      'https://example.com/imgs/examples/a.webp'
    );
  });

  it('does not double the slash when the app URL has a trailing one', () => {
    expect(resolveReferenceImage('/a.png', 'https://example.com/')).toBe(
      'https://example.com/a.png'
    );
  });

  it('rejects a protocol-relative URL', () => {
    // `//elsewhere/x` looks relative but resolves off-site.
    expect(() => resolveReferenceImage('//elsewhere.com/a.png', APP)).toThrow(
      /unsupported image reference/
    );
  });

  it('rejects anything else', () => {
    for (const bad of ['a.png', 'file:///etc/passwd', '../secret.png', '']) {
      expect(() => resolveReferenceImage(bad, APP)).toThrow(
        /unsupported image reference/
      );
    }
  });

  it('trims surrounding whitespace before deciding', () => {
    expect(resolveReferenceImage('  /a.png  ', APP)).toBe(
      'https://example.com/a.png'
    );
  });
});
