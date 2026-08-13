import { describe, expect, it } from 'vitest';

import { isValidPostSlug, normalizePostSlug } from './service';

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
