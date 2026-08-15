import { describe, expect, it } from 'vitest';

import { readImageDimensions } from './image-metadata';

describe('image metadata', () => {
  it('reads PNG dimensions from IHDR', () => {
    const bytes = new Uint8Array(24);
    bytes.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a], 0);
    bytes.set([0x49, 0x48, 0x44, 0x52], 12);
    new DataView(bytes.buffer).setUint32(16, 1200);
    new DataView(bytes.buffer).setUint32(20, 630);
    expect(readImageDimensions(bytes, 'image/png')).toEqual({
      width: 1200,
      height: 630,
    });
  });

  it('reads JPEG dimensions from a start-of-frame segment', () => {
    const bytes = new Uint8Array([
      0xff, 0xd8, 0xff, 0xc0, 0x00, 0x11, 0x08, 0x02, 0x76, 0x04, 0xb0, 0x03,
      0x01, 0x11, 0x00, 0x02, 0x11, 0x00, 0x03, 0x11, 0x00,
    ]);
    expect(readImageDimensions(bytes, 'image/jpeg')).toEqual({
      width: 1200,
      height: 630,
    });
  });

  it('reads extended WebP dimensions', () => {
    const bytes = new Uint8Array(30);
    bytes.set([...Buffer.from('RIFF')], 0);
    bytes.set([...Buffer.from('WEBP')], 8);
    bytes.set([...Buffer.from('VP8X')], 12);
    const width = 1199;
    const height = 629;
    bytes.set([width & 0xff, (width >> 8) & 0xff, (width >> 16) & 0xff], 24);
    bytes.set([height & 0xff, (height >> 8) & 0xff, (height >> 16) & 0xff], 27);
    expect(readImageDimensions(bytes, 'image/webp')).toEqual({
      width: 1200,
      height: 630,
    });
  });

  it('rejects mismatched or truncated files', () => {
    expect(() =>
      readImageDimensions(new Uint8Array([1, 2, 3]), 'image/png')
    ).toThrow('image/png');
  });
});
