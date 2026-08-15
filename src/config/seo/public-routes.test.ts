import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

import {
  fixedPublicRoutes,
  getFixedRouteAlternates,
  selectIndexableFixedUrls,
  type FixedRouteId,
} from './public-routes';

const routeFiles: Record<FixedRouteId, string> = {
  home: '../../routes/index.tsx',
  pricing: '../../routes/pricing.tsx',
  'privacy-policy': '../../routes/(pages)/privacy-policy.tsx',
  'terms-of-service': '../../routes/(pages)/terms-of-service.tsx',
};

describe('fixed public route registry', () => {
  it('only registers paths backed by real file routes', () => {
    for (const route of fixedPublicRoutes) {
      expect(
        existsSync(
          fileURLToPath(new URL(routeFiles[route.id], import.meta.url))
        )
      ).toBe(true);
    }
  });

  it('does not synthesize unregistered locales', () => {
    expect(getFixedRouteAlternates('home', 'en')).toEqual([
      { locale: 'en', path: '/' },
      { locale: 'zh', path: '/' },
    ]);
    expect(
      selectIndexableFixedUrls().every((entry) =>
        ['en', 'zh'].includes(entry.locale)
      )
    ).toBe(true);
  });
});
