import { describe, expect, it } from 'vitest';

import {
  baseLocale,
  deLocalizeUrl,
  locales,
  localizeUrl,
} from '@/paraglide/runtime.js';

describe('locale URL routing', () => {
  it('round-trips nested routes for every registered locale', () => {
    const canonical = new URL('https://example.com/blog/example-post');

    for (const locale of locales) {
      const localized = localizeUrl(canonical, { locale });
      expect(deLocalizeUrl(localized).pathname).toBe(canonical.pathname);
      if (locale === baseLocale) {
        expect(localized.pathname).toBe(canonical.pathname);
      } else {
        expect(localized.pathname).toBe(`/${locale}${canonical.pathname}`);
      }
    }
  });
});
