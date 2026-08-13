import { afterEach, describe, expect, it, vi } from 'vitest';

import { DEFAULT_IMAGE_MODEL } from '@/lib/agent-settings';

import {
  imageProviderOptionsFor,
  imageProviderOptionsForProvider,
  pickImageProvider,
} from './image-provider';
import { readGeneratedImage } from './image-tools';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('readGeneratedImage', () => {
  it('follows a validated redirect with Workers-compatible manual mode', async () => {
    const request = vi.fn(
      async (input: string | URL | Request, _init?: RequestInit) => {
        const url = String(input);
        if (url === 'https://files.example.com/generated') {
          return new Response(null, {
            status: 302,
            headers: { location: 'https://cdn.example.com/generated.png' },
          });
        }
        return new Response(new Uint8Array([1, 2, 3]), {
          headers: { 'content-type': 'image/png' },
        });
      }
    );
    vi.stubGlobal('fetch', request);

    const image = await readGeneratedImage(
      'https://files.example.com/generated'
    );

    expect(image.body).toEqual(Buffer.from([1, 2, 3]));
    expect(image.contentType).toBe('image/png');
    expect(request).toHaveBeenCalledTimes(2);
    for (const [, init] of request.mock.calls) {
      expect(init?.redirect).toBe('manual');
    }
  });

  it('rejects redirects to private addresses', async () => {
    const request = vi.fn(
      async () =>
        new Response(null, {
          status: 302,
          headers: { location: 'http://127.0.0.1/private.png' },
        })
    );
    vi.stubGlobal('fetch', request);

    await expect(
      readGeneratedImage('https://files.example.com/generated')
    ).rejects.toThrow('unsupported image reference');
    expect(request).toHaveBeenCalledOnce();
  });
});

describe('pickImageProvider', () => {
  it('returns null when no image provider is configured', () => {
    expect(pickImageProvider({})).toBeNull();
  });

  it('prefers EvoLink in auto mode', () => {
    expect(
      pickImageProvider({
        evolink_api_key: 'e',
        grouter_api_key: 'g',
        grouter_base_url: 'https://gateway.example.com',
        replicate_api_token: 'r',
        fal_api_key: 'f',
      })
    ).toBe('evolink');
  });

  it('honours an explicit configured provider', () => {
    expect(
      pickImageProvider({
        default_image_provider: 'fal',
        evolink_api_key: 'e',
        fal_api_key: 'f',
      })
    ).toBe('fal');
  });

  it('falls back when the preferred provider is not configured', () => {
    expect(
      pickImageProvider({
        default_image_provider: 'grouter',
        evolink_api_key: 'e',
      })
    ).toBe('evolink');
  });

  it('skips Replicate when the requested resolution is not supported', () => {
    const configs = {
      default_image_provider: 'replicate',
      replicate_api_token: 'r',
      fal_api_key: 'f',
    };
    expect(
      pickImageProvider(configs, DEFAULT_IMAGE_MODEL, 'generate', '2K', '1:1')
    ).toBe('fal');
    expect(
      pickImageProvider(
        { replicate_api_token: 'r' },
        DEFAULT_IMAGE_MODEL,
        'generate',
        '2K',
        '1:1'
      )
    ).toBeNull();
  });
});

describe('imageProviderOptionsFor', () => {
  it('normalizes GPT Image 2 options and limits reference images', () => {
    const references = Array.from(
      { length: 20 },
      (_, index) => `https://cdn.example.com/${index}.png`
    );
    expect(
      imageProviderOptionsFor({
        modelKey: DEFAULT_IMAGE_MODEL,
        aspectRatio: '16:9',
        resolution: '2k',
        quality: 'HIGH',
        imageInput: references,
      })
    ).toEqual({
      aspect_ratio: '16:9',
      resolution: '2K',
      quality: 'high',
      n: 1,
      image_input: references.slice(0, 16),
    });
  });

  it('uses safe defaults for invalid options', () => {
    expect(
      imageProviderOptionsFor({
        modelKey: DEFAULT_IMAGE_MODEL,
        aspectRatio: 'wide',
        resolution: '8K',
        quality: 'ultra',
      })
    ).toEqual({
      aspect_ratio: '1:1',
      resolution: '1K',
      quality: 'medium',
      n: 1,
    });
  });
});

describe('imageProviderOptionsForProvider', () => {
  const canonical = {
    aspect_ratio: '16:9',
    resolution: '2K',
    quality: 'high',
    n: 1,
    image_input: ['https://cdn.example.com/reference.png'],
  };

  it('keeps EvoLink canonical resolution and ratio fields', () => {
    expect(imageProviderOptionsForProvider('evolink', canonical)).toBe(
      canonical
    );
  });

  it('maps Fal options to image_size and num_images', () => {
    expect(imageProviderOptionsForProvider('fal', canonical)).toEqual({
      image_size: { width: 2736, height: 1536 },
      quality: 'high',
      num_images: 1,
      image_input: canonical.image_input,
    });
  });

  it('maps gRouter options to an explicit size', () => {
    expect(imageProviderOptionsForProvider('grouter', canonical)).toEqual({
      size: '2736x1536',
      quality: 'high',
      n: 1,
      image_input: canonical.image_input,
    });
  });

  it('uses only fields accepted by Replicate GPT Image 2', () => {
    expect(
      imageProviderOptionsForProvider('replicate', {
        ...canonical,
        aspect_ratio: '3:2',
        resolution: '1K',
      })
    ).toEqual({
      aspect_ratio: '3:2',
      quality: 'high',
      number_of_images: 1,
      image_input: canonical.image_input,
    });
  });

  it('swaps dimensions for portrait output', () => {
    expect(
      imageProviderOptionsForProvider('fal', {
        ...canonical,
        aspect_ratio: '9:16',
        resolution: '4K',
      })
    ).toMatchObject({
      image_size: { width: 2160, height: 3840 },
    });
  });
});
