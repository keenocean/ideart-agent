import { catalogPath } from '@/config/catalog/paths';
import {
  selectIndexableUrls,
  selectLlmsEntries,
  type CatalogPageAvailability,
} from '@/config/catalog/selectors';
import type {
  CatalogDefinition,
  CatalogUrlRecord,
  ResolvedCatalogRoute,
} from '@/config/catalog/types';
import type { AppLocale } from '@/config/locale';
import type { SeoRouteRef } from '@/lib/seo';
import { locales } from '@/paraglide/runtime.js';

import { hasToolContent, loadToolContentOrNull } from './tools/manifest';

/**
 * Content-backed publication gate shared by every Catalog discovery surface.
 * Kinds without an implemented exact-locale content resolver fail closed.
 */
export function isCatalogPageContentAvailable(
  definition: CatalogDefinition,
  locale: AppLocale
): boolean {
  switch (definition.kind) {
    case 'tool':
      return hasToolContent(definition.entityId, locale);
    case 'model':
      return false;
  }
}

async function isCatalogPageContentLoadable(
  definition: CatalogDefinition,
  locale: AppLocale
): Promise<boolean> {
  if (!isCatalogPageContentAvailable(definition, locale)) return false;
  switch (definition.kind) {
    case 'tool':
      return (
        (await loadToolContentOrNull(definition.entityId, locale)) !== null
      );
    case 'model':
      return false;
  }
}

/**
 * Public discovery verifies the lazy module export, not just its file path.
 * A missing, malformed, or identity-mismatched module therefore fails closed.
 */
export async function selectLoadableIndexableCatalogUrls(
  definitions: readonly CatalogDefinition[]
): Promise<CatalogUrlRecord[]> {
  const candidates = selectIndexableUrls(
    definitions,
    isCatalogPageContentAvailable
  );
  const definitionsByKey = new Map(
    definitions.map((definition) => [
      `${definition.kind}:${definition.entityId}`,
      definition,
    ])
  );
  const loadable = await Promise.all(
    candidates.map((candidate) => {
      const definition = definitionsByKey.get(
        `${candidate.kind}:${candidate.entityId}`
      );
      return definition
        ? isCatalogPageContentLoadable(definition, candidate.locale)
        : false;
    })
  );
  return candidates.filter((_, index) => loadable[index]);
}

export async function selectLoadableLlmsEntries(
  definitions: readonly CatalogDefinition[],
  locale: AppLocale
): Promise<ResolvedCatalogRoute[]> {
  const candidates = selectLlmsEntries(
    definitions,
    locale,
    isCatalogPageContentAvailable
  );
  const loadable = await Promise.all(
    candidates.map((candidate) =>
      isCatalogPageContentLoadable(candidate.definition, locale)
    )
  );
  return candidates.filter((_, index) => loadable[index]);
}

/** Exact locale-free targets for content-backed Catalog routes. */
export function selectContentBackedCatalogLocaleRoutes(
  definition: CatalogDefinition,
  isPageAvailable: CatalogPageAvailability = isCatalogPageContentAvailable
): SeoRouteRef[] {
  if (definition.publication === 'hidden') return [];
  return locales.flatMap((locale) => {
    const page = definition.localePages[locale];
    if (!page || !isPageAvailable(definition, locale)) return [];
    return [{ locale, path: catalogPath(definition.kind, page.slug) }];
  });
}
