import { describe, expect, it } from 'vitest';

import { DEFAULT_IMAGE_MODEL } from '@/lib/agent-settings';

import {
  imageProviderOptionsFor,
  imageProviderOptionsForProvider,
  pickImageProvider,
} from './image-provider';

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
