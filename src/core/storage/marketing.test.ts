import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  assertMarketingAssetUrl,
  marketingAssetKey,
  normalizeMarketingPublicDomain,
  verifyMarketingImageAsset,
  verifyMarketingPublishedAsset,
} from './marketing';

describe('marketing R2 asset contract', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('creates immutable content-addressed object keys', () => {
    expect(
      marketingAssetKey({
        surface: 'tools',
        slug: 'ai-image-generator',
        contentHash: 'abcdef0123456789',
        extension: '.webp',
      })
    ).toBe('marketing/tools/ai-image-generator/abcdef0123456789.webp');
  });

  it('rejects API endpoints, localhost and signed URLs', () => {
    for (const domain of [
      'http://cdn.example.com',
      'https://localhost',
      'https://abc.r2.cloudflarestorage.com',
      'https://cdn.example.com/path',
    ]) {
      expect(() => normalizeMarketingPublicDomain(domain)).toThrow();
    }
    expect(() =>
      assertMarketingAssetUrl(
        'https://cdn.example.com/marketing/tools/x/file.webp?token=secret',
        'https://cdn.example.com'
      )
    ).toThrow();
    expect(() =>
      assertMarketingAssetUrl(
        'https://cdn.example.com/uploads/marketing/tools/x/latest.webp',
        'https://cdn.example.com'
      )
    ).toThrow();
  });

  it('accepts only immutable marketing paths on the configured domain', () => {
    expect(
      assertMarketingAssetUrl(
        'https://cdn.example.com/uploads/marketing/tools/x/abcdef0123456789.webp',
        'https://cdn.example.com'
      )
    ).toBe(
      'https://cdn.example.com/uploads/marketing/tools/x/abcdef0123456789.webp'
    );
  });

  it('verifies the public image response before accepting a reference', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(null, {
        status: 200,
        headers: {
          'content-type': 'image/webp',
          'content-length': '42000',
          'content-disposition': 'inline',
          'cache-control': 'public, max-age=31536000, immutable',
        },
      })
    );
    vi.stubGlobal('fetch', fetchMock);
    const url =
      'https://cdn.example.com/uploads/marketing/blog/post/abcdef0123456789.webp';

    await expect(
      verifyMarketingImageAsset(
        { url, mimeType: 'image/webp', bytes: 42_000 },
        'https://cdn.example.com'
      )
    ).resolves.toBe(url);
    expect(fetchMock).toHaveBeenCalledWith(url, { method: 'HEAD' });
  });

  it('verifies video byte ranges against the full asset size', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(null, {
        status: 206,
        headers: {
          'content-type': 'video/mp4',
          'content-range': 'bytes 0-0/900000',
          'content-disposition': 'inline; filename="clip.mp4"',
          'cache-control': 'public, max-age=31536000, immutable',
        },
      })
    );
    vi.stubGlobal('fetch', fetchMock);
    const url =
      'https://cdn.example.com/uploads/marketing/tools/clip/abcdef0123456789.mp4';

    await expect(
      verifyMarketingPublishedAsset(
        { url, kind: 'video', mimeType: 'video/mp4', bytes: 900_000 },
        'https://cdn.example.com'
      )
    ).resolves.toBe(url);
    expect(fetchMock).toHaveBeenCalledWith(url, {
      method: 'GET',
      headers: { Range: 'bytes=0-0' },
    });
  });

  it('requires inline delivery for published marketing assets', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(null, {
          status: 200,
          headers: {
            'content-type': 'image/webp',
            'content-length': '42000',
            'cache-control': 'public, max-age=31536000, immutable',
          },
        })
      )
    );
    await expect(
      verifyMarketingImageAsset(
        {
          url: 'https://cdn.example.com/uploads/marketing/blog/post/abcdef0123456789.webp',
          mimeType: 'image/webp',
          bytes: 42_000,
        },
        'https://cdn.example.com'
      )
    ).rejects.toThrow('inline disposition');
  });

  it('rejects missing or mismatched public image responses', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response(null, { status: 404 }))
    );
    await expect(
      verifyMarketingImageAsset(
        {
          url: 'https://cdn.example.com/uploads/marketing/blog/post/abcdef0123456789.webp',
          mimeType: 'image/webp',
          bytes: 42_000,
        },
        'https://cdn.example.com'
      )
    ).rejects.toThrow('HTTP 404');
  });
});
