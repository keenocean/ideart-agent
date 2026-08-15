import { baseLocale, locales } from '@/paraglide/runtime.js';

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const localePrefix = locales.map(escapeRegExp).join('|');
const authLoop = new RegExp(
  `^/(?:(?:${localePrefix})/)?(?:sign-in|sign-up|verify-email)(?:/|$)`,
  'i'
);
const invalidBaseLocalePrefix = new RegExp(
  `^/${escapeRegExp(baseLocale)}(?:/|$)`,
  'i'
);

function decodeCallback(value: string): string | null {
  let current = value;
  for (let attempt = 0; attempt < 2; attempt++) {
    if (!current.includes('%')) break;
    try {
      const decoded = decodeURIComponent(current);
      if (decoded === current) break;
      current = decoded;
    } catch {
      return null;
    }
  }
  return current.includes('%') ? null : current;
}

function sanitizeCandidate(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const decoded = decodeCallback(raw.trim());
  if (
    !decoded ||
    !decoded.startsWith('/') ||
    decoded.startsWith('//') ||
    decoded.includes('\\') ||
    decoded.includes('\0') ||
    decoded.includes('#')
  ) {
    return null;
  }
  let url: URL;
  try {
    url = new URL(decoded, 'https://callback.invalid');
  } catch {
    return null;
  }
  if (url.origin !== 'https://callback.invalid') return null;
  if (
    authLoop.test(url.pathname) ||
    invalidBaseLocalePrefix.test(url.pathname)
  ) {
    return null;
  }
  return `${url.pathname}${url.search}`;
}

export function sanitizeAuthCallback(
  raw: string | null | undefined,
  fallback: string | null = null
): string | null {
  return sanitizeCandidate(raw) ?? sanitizeCandidate(fallback);
}

export const EMAIL_VERIFICATION_CHANNEL = 'ugcmind:email-verification';

export type EmailVerificationSignal = {
  type: 'verified';
  callbackUrl: string;
};

export function verificationCompletionPath(callbackUrl: string): string {
  const safeCallback = sanitizeAuthCallback(callbackUrl, '/') ?? '/';
  const query = new URLSearchParams({
    verified: '1',
    callbackUrl: safeCallback,
  });
  return `/verify-email?${query.toString()}`;
}

export function parseEmailVerificationSignal(
  value: unknown,
  expectedCallbackUrl: string
): EmailVerificationSignal | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const record = value as Record<string, unknown>;
  const expected = sanitizeAuthCallback(expectedCallbackUrl);
  const callback =
    typeof record.callbackUrl === 'string'
      ? sanitizeAuthCallback(record.callbackUrl)
      : null;
  if (record.type !== 'verified' || !expected || callback !== expected) {
    return null;
  }
  return { type: 'verified', callbackUrl: callback };
}
