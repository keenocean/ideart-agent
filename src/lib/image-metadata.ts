export type SupportedBlogImageMime = 'image/jpeg' | 'image/png' | 'image/webp';

export const BLOG_IMAGE_MAX_BYTES = 10 * 1024 * 1024;
export const BLOG_IMAGE_MAX_EDGE = 12_000;
export const BLOG_IMAGE_MAX_PIXELS = 80_000_000;

export type ImageDimensions = {
  width: number;
  height: number;
};

const JPEG_START_OF_FRAME_MARKERS = new Set([
  0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf,
]);

function uint16be(bytes: Uint8Array, offset: number): number {
  return (bytes[offset] << 8) | bytes[offset + 1];
}

function uint16le(bytes: Uint8Array, offset: number): number {
  return bytes[offset] | (bytes[offset + 1] << 8);
}

function uint24le(bytes: Uint8Array, offset: number): number {
  return bytes[offset] | (bytes[offset + 1] << 8) | (bytes[offset + 2] << 16);
}

function positiveDimensions(width: number, height: number): ImageDimensions {
  if (
    !Number.isInteger(width) ||
    !Number.isInteger(height) ||
    width <= 0 ||
    height <= 0
  ) {
    throw new Error('Image dimensions are invalid');
  }
  return { width, height };
}

function pngDimensions(bytes: Uint8Array): ImageDimensions {
  const signature = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  if (
    bytes.length < 24 ||
    !signature.every((byte, index) => bytes[index] === byte) ||
    String.fromCharCode(...bytes.slice(12, 16)) !== 'IHDR'
  ) {
    throw new Error('Image does not match image/png');
  }
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  return positiveDimensions(view.getUint32(16), view.getUint32(20));
}

function jpegDimensions(bytes: Uint8Array): ImageDimensions {
  if (bytes.length < 4 || bytes[0] !== 0xff || bytes[1] !== 0xd8) {
    throw new Error('Image does not match image/jpeg');
  }

  let offset = 2;
  while (offset + 3 < bytes.length) {
    while (offset < bytes.length && bytes[offset] !== 0xff) offset += 1;
    while (offset < bytes.length && bytes[offset] === 0xff) offset += 1;
    if (offset >= bytes.length) break;

    const marker = bytes[offset];
    offset += 1;
    if (marker === 0xd8 || marker === 0xd9 || marker === 0x01) continue;
    if (offset + 1 >= bytes.length) break;

    const segmentLength = uint16be(bytes, offset);
    if (segmentLength < 2 || offset + segmentLength > bytes.length) break;
    if (JPEG_START_OF_FRAME_MARKERS.has(marker)) {
      if (segmentLength < 7) break;
      return positiveDimensions(
        uint16be(bytes, offset + 5),
        uint16be(bytes, offset + 3)
      );
    }
    offset += segmentLength;
  }

  throw new Error('JPEG dimensions could not be determined');
}

function webpDimensions(bytes: Uint8Array): ImageDimensions {
  if (
    bytes.length < 30 ||
    String.fromCharCode(...bytes.slice(0, 4)) !== 'RIFF' ||
    String.fromCharCode(...bytes.slice(8, 12)) !== 'WEBP'
  ) {
    throw new Error('Image does not match image/webp');
  }

  const chunk = String.fromCharCode(...bytes.slice(12, 16));
  if (chunk === 'VP8X') {
    return positiveDimensions(uint24le(bytes, 24) + 1, uint24le(bytes, 27) + 1);
  }
  if (chunk === 'VP8L' && bytes[20] === 0x2f) {
    return positiveDimensions(
      1 + (((bytes[22] & 0x3f) << 8) | bytes[21]),
      1 + (((bytes[24] & 0x0f) << 10) | (bytes[23] << 2) | (bytes[22] >> 6))
    );
  }
  if (
    chunk === 'VP8 ' &&
    bytes[23] === 0x9d &&
    bytes[24] === 0x01 &&
    bytes[25] === 0x2a
  ) {
    return positiveDimensions(
      uint16le(bytes, 26) & 0x3fff,
      uint16le(bytes, 28) & 0x3fff
    );
  }

  throw new Error('WebP dimensions could not be determined');
}

export function readImageDimensions(
  bytes: Uint8Array,
  mimeType: SupportedBlogImageMime
): ImageDimensions {
  if (mimeType === 'image/png') return pngDimensions(bytes);
  if (mimeType === 'image/jpeg') return jpegDimensions(bytes);
  return webpDimensions(bytes);
}
