import type { AppLocale } from '@/config/locale';

import { catalogPath } from './paths';
import type {
  CatalogDefinition,
  CatalogUrlRecord,
  ResolvedCatalogRoute,
} from './types';

export type CatalogPageAvailability = (
  definition: CatalogDefinition,
  locale: AppLocale
) => boolean;

function pageFor(definition: CatalogDefinition, locale: AppLocale) {
  return definition.publication === 'hidden'
    ? definition.localePages?.[locale]
    : definition.localePages[locale];
}

export function selectHomeEntries(
  definitions: readonly CatalogDefinition[],
  locale: AppLocale,
  isPageAvailable: CatalogPageAvailability
): CatalogDefinition[] {
  return definitions
    .filter(
      (entry) =>
        entry.publication === 'listed' &&
        !!entry.placement.home &&
        !!entry.localePages[locale] &&
        isPageAvailable(entry, locale)
    )
    .sort((left, right) =>
      left.publication === 'listed' && right.publication === 'listed'
        ? (left.placement.home?.order ?? 0) - (right.placement.home?.order ?? 0)
        : 0
    );
}

export function selectDirectoryEntries(
  definitions: readonly CatalogDefinition[],
  locale: AppLocale,
  isPageAvailable: CatalogPageAvailability
): CatalogDefinition[] {
  return definitions
    .filter(
      (entry) =>
        entry.publication === 'listed' &&
        !!entry.localePages[locale] &&
        isPageAvailable(entry, locale)
    )
    .sort((left, right) =>
      left.publication === 'listed' && right.publication === 'listed'
        ? left.placement.directoryOrder - right.placement.directoryOrder
        : 0
    );
}

export function selectRelatedEntries(
  definitions: readonly CatalogDefinition[],
  definition: CatalogDefinition,
  locale: AppLocale,
  isPageAvailable: CatalogPageAvailability
): CatalogDefinition[] {
  const byId = new Map(definitions.map((entry) => [entry.entityId, entry]));
  return (definition.related ?? [])
    .map((id) => byId.get(id))
    .filter(
      (entry): entry is CatalogDefinition =>
        !!entry &&
        entry.entityId !== definition.entityId &&
        entry.publication === 'listed' &&
        !!entry.localePages[locale] &&
        isPageAvailable(entry, locale)
    );
}

export function selectIndexableUrls(
  definitions: readonly CatalogDefinition[],
  isPageAvailable: CatalogPageAvailability
): CatalogUrlRecord[] {
  return definitions.flatMap((entry) => {
    if (entry.publication !== 'listed') return [];
    return Object.entries(entry.localePages).flatMap(([locale, page]) =>
      page?.indexing === 'index' && isPageAvailable(entry, locale as AppLocale)
        ? [
            {
              kind: entry.kind,
              entityId: entry.entityId,
              locale: locale as AppLocale,
              path: catalogPath(entry.kind, page.slug),
              modifiedAt: page.contentModifiedAt,
            },
          ]
        : []
    );
  });
}

export function selectLlmsEntries(
  definitions: readonly CatalogDefinition[],
  locale: AppLocale,
  isPageAvailable: CatalogPageAvailability
): ResolvedCatalogRoute[] {
  return definitions.flatMap((entry) => {
    if (entry.publication !== 'listed') return [];
    const page = entry.localePages[locale];
    if (!page || page.indexing !== 'index' || !isPageAvailable(entry, locale))
      return [];
    return [
      {
        definition: entry,
        kind: entry.kind,
        locale,
        page,
        path: catalogPath(entry.kind, page.slug),
      },
    ];
  });
}

export function hasLocalePage(
  definition: CatalogDefinition,
  locale: AppLocale
): boolean {
  return !!pageFor(definition, locale);
}
