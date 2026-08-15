import { envConfigs } from '@/config';
import type { AppLocale } from '@/config/locale';
import { locales, localizeUrl } from '@/paraglide/runtime.js';

import type {
  CatalogDefinition,
  CatalogKind,
  CatalogRouteSegment,
  ResolvedCatalogRoute,
} from './types';

const SEGMENT_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function catalogRouteSegment(value: string): CatalogRouteSegment {
  const segment = value.trim();
  if (
    !SEGMENT_PATTERN.test(segment) ||
    segment === '.' ||
    segment === '..' ||
    segment.includes('%')
  ) {
    throw new Error(`Invalid Catalog route segment: ${value}`);
  }
  return segment as CatalogRouteSegment;
}

export function catalogPath(kind: CatalogKind, slug: string): string {
  const segment = catalogRouteSegment(slug);
  return `/${kind === 'tool' ? 'tools' : 'models'}/${segment}`;
}

function normalizedAppOrigin(value: string): string {
  const url = new URL(value);
  if (url.username || url.password || url.search || url.hash) {
    throw new Error('VITE_APP_URL must be a plain origin');
  }
  if (url.pathname !== '/' && url.pathname !== '') {
    throw new Error('VITE_APP_URL must not contain a path');
  }
  if (
    url.protocol !== 'https:' &&
    !(
      url.protocol === 'http:' &&
      (url.hostname === 'localhost' || url.hostname === '127.0.0.1')
    )
  ) {
    throw new Error('VITE_APP_URL must use HTTPS outside local development');
  }
  return url.origin;
}

export function catalogUrl(
  kind: CatalogKind,
  locale: AppLocale,
  slug: string
): string {
  if (!locales.includes(locale)) {
    throw new Error(`Unsupported Catalog locale: ${locale}`);
  }
  const absolute = new URL(
    catalogPath(kind, slug),
    `${normalizedAppOrigin(envConfigs.app_url)}/`
  );
  return localizeUrl(absolute, { locale }).href;
}

export function findCatalogRoute(
  definitions: readonly CatalogDefinition[],
  kind: CatalogKind,
  locale: AppLocale,
  slug: string
): ResolvedCatalogRoute | null {
  let segment: CatalogRouteSegment;
  try {
    segment = catalogRouteSegment(slug);
  } catch {
    return null;
  }
  const definition = definitions.find((entry) => {
    if (entry.kind !== kind || entry.publication === 'hidden') return false;
    return entry.localePages[locale]?.slug === segment;
  });
  if (!definition || definition.publication === 'hidden') return null;
  const page = definition.localePages[locale];
  if (!page) return null;
  return {
    definition,
    kind,
    locale,
    page,
    path: catalogPath(kind, page.slug),
  };
}
