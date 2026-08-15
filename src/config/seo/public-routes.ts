import type { AppLocale } from '@/config/locale';

export type FixedRouteId =
  | 'home'
  | 'tools'
  | 'pricing'
  | 'privacy-policy'
  | 'terms-of-service';

export type FixedLocalePageState = {
  path: string;
  indexing: 'index' | 'noindex';
  contentModifiedAt?: string;
};

export type FixedPublicRoute = {
  id: FixedRouteId;
  localePages: Partial<Record<AppLocale, FixedLocalePageState>>;
};

// Locale pages are registered explicitly. Adding a Paraglide locale does not
// automatically publish or advertise a fixed page in that language.
export const fixedPublicRoutes = [
  {
    id: 'home',
    localePages: {
      en: { path: '/', indexing: 'index' },
      zh: { path: '/', indexing: 'index' },
    },
  },
  {
    id: 'tools',
    localePages: {
      en: {
        path: '/tools',
        indexing: 'noindex',
        contentModifiedAt: '2026-08-15',
      },
      zh: {
        path: '/tools',
        indexing: 'noindex',
        contentModifiedAt: '2026-08-15',
      },
    },
  },
  {
    id: 'pricing',
    localePages: {
      en: { path: '/pricing', indexing: 'index' },
      zh: { path: '/pricing', indexing: 'index' },
    },
  },
  {
    id: 'privacy-policy',
    localePages: {
      en: {
        path: '/privacy-policy',
        indexing: 'index',
        contentModifiedAt: '2026-05-21',
      },
      zh: {
        path: '/privacy-policy',
        indexing: 'index',
        contentModifiedAt: '2026-05-21',
      },
    },
  },
  {
    id: 'terms-of-service',
    localePages: {
      en: {
        path: '/terms-of-service',
        indexing: 'index',
        contentModifiedAt: '2026-05-21',
      },
      zh: {
        path: '/terms-of-service',
        indexing: 'index',
        contentModifiedAt: '2026-05-21',
      },
    },
  },
] as const satisfies readonly FixedPublicRoute[];

export type FixedPublicUrlRecord = {
  id: FixedRouteId;
  locale: AppLocale;
  path: string;
  modifiedAt?: string;
};

export function getFixedPublicRoute(id: FixedRouteId): FixedPublicRoute {
  const route = fixedPublicRoutes.find((entry) => entry.id === id);
  if (!route) throw new Error(`Unknown fixed public route: ${id}`);
  return route;
}

export function getFixedLocalePage(
  id: FixedRouteId,
  locale: AppLocale
): FixedLocalePageState | null {
  return getFixedPublicRoute(id).localePages[locale] ?? null;
}

export function getFixedRouteAlternates(
  id: FixedRouteId,
  locale: AppLocale
): Array<{ locale: AppLocale; path: string }> {
  const route = getFixedPublicRoute(id);
  const current = route.localePages[locale];
  if (!current || current.indexing !== 'index') return [];
  return Object.entries(route.localePages).flatMap(([targetLocale, page]) =>
    page?.indexing === 'index'
      ? [{ locale: targetLocale as AppLocale, path: page.path }]
      : []
  );
}

export function selectIndexableFixedUrls(): FixedPublicUrlRecord[] {
  return fixedPublicRoutes.flatMap((route) =>
    Object.entries(route.localePages).flatMap(([locale, page]) =>
      page?.indexing === 'index'
        ? [
            {
              id: route.id,
              locale: locale as AppLocale,
              path: page.path,
              modifiedAt: page.contentModifiedAt,
            },
          ]
        : []
    )
  );
}
