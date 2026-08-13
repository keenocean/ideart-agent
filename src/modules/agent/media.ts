/**
 * Provider-readable reference media must already be public, or be an inline
 * data URI. A Worker cannot hand an upstream provider a site-relative path,
 * and loopback URLs would turn generation into a server-side fetch primitive.
 */
export function resolveReferenceImage(src: string): string {
  const value = src.trim();
  if (value.startsWith('data:')) return value;
  if (/^https?:\/\//i.test(value)) {
    let hostname: string;
    try {
      hostname = new URL(value).hostname.toLowerCase();
    } catch {
      throw new Error(`unsupported image reference: ${src}`);
    }
    if (
      hostname === 'localhost' ||
      hostname.endsWith('.localhost') ||
      hostname.endsWith('.local') ||
      hostname === '0.0.0.0' ||
      hostname === '::1' ||
      hostname === '[::1]' ||
      isPrivateIpv4(hostname) ||
      isPrivateIpv6(hostname)
    ) {
      throw new Error(`unsupported image reference: ${src}`);
    }
    return value;
  }
  throw new Error(`unsupported image reference: ${src}`);
}

function isPrivateIpv4(hostname: string): boolean {
  const parts = hostname.split('.').map(Number);
  if (
    parts.length !== 4 ||
    parts.some((part) => !Number.isInteger(part) || part < 0 || part > 255)
  ) {
    return false;
  }
  const [a, b] = parts;
  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 198 && (b === 18 || b === 19)) ||
    a >= 224
  );
}

function isPrivateIpv6(hostname: string): boolean {
  const value = hostname.replace(/^\[|\]$/g, '').toLowerCase();
  return (
    value === '::' ||
    value === '::1' ||
    value.startsWith('fc') ||
    value.startsWith('fd') ||
    /^fe[89ab]/.test(value) ||
    value.startsWith('::ffff:127.') ||
    value.startsWith('::ffff:10.') ||
    value.startsWith('::ffff:192.168.')
  );
}
