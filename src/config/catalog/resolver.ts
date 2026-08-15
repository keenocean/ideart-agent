import type { AppLocale } from '@/config/locale';

import { findCatalogRoute } from './paths';
import { catalog } from './registry';
import type { CatalogKind, ResolvedCatalogRoute } from './types';

export class CatalogRouteNotFoundError extends Error {
  constructor(kind: CatalogKind, locale: AppLocale, slug: string) {
    super(`Catalog route not found: ${kind}:${locale}:${slug}`);
    this.name = 'CatalogRouteNotFoundError';
  }
}

export function resolveCatalogRoute(
  kind: CatalogKind,
  locale: AppLocale,
  slug: string
): ResolvedCatalogRoute {
  const route = findCatalogRoute(catalog, kind, locale, slug);
  if (!route) throw new CatalogRouteNotFoundError(kind, locale, slug);
  return route;
}
