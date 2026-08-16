import { describe, expect, it } from 'vitest';

import {
  isValidPostSlug,
  normalizePostLocale,
  normalizePostSlug,
} from './service';

describe('post slug validation', () => {
  it('normalizes URL-safe slugs', () => {
    expect(normalizePostSlug('  My-First-Post  ')).toBe('my-first-post');
    expect(isValidPostSlug('Release-2026')).toBe(true);
  });

  it.each(['', '   ', 'hello world', 'foo/bar', 'what?', '-leading'])(
    'rejects an unsafe slug: %j',
    (slug) => {
      expect(isValidPostSlug(slug)).toBe(false);
      expect(() => normalizePostSlug(slug)).toThrow('Invalid slug');
    }
  );
});

describe('post locale validation', () => {
  it('requires an explicit stored locale', () => {
    expect(normalizePostLocale(' en ')).toBe('en');
    expect(() => normalizePostLocale('')).toThrow('Locale is required');
    expect(() => normalizePostLocale('   ')).toThrow('Locale is required');
    expect(() => normalizePostLocale('not-registered')).toThrow(
      'Unsupported locale'
    );
  });
});
