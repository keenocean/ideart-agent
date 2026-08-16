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

import { hasModelContent, loadModelContentOrNull } from './models/manifest';
import type { ModelPageContent } from './models/types';
import { validateModelPageContent } from './models/validate';
import { hasToolContent, loadToolContentOrNull } from './tools/manifest';
import type { ToolPageContent } from './tools/types';
import { validateToolPageContent } from './tools/validate';

export type LoadableCatalogLlmsEntry = ResolvedCatalogRoute & {
  title: string;
  summary: string;
};

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
      return hasModelContent(definition.entityId, locale);
  }
}

async function isCatalogPageContentLoadable(
  definition: CatalogDefinition,
  locale: AppLocale
): Promise<boolean> {
  if (!isCatalogPageContentAvailable(definition, locale)) return false;
  switch (definition.kind) {
    case 'tool': {
      const content = await loadToolContentOrNull(definition.entityId, locale);
      if (!content) return false;
      validateToolPageContent(definition, content);
      return true;
    }
    case 'model': {
      const content = await loadModelContentOrNull(definition.entityId, locale);
      if (!content) return false;
      validateModelPageContent(definition, content);
      return true;
    }
  }
}

async function loadCatalogLlmsCopy(
  definition: CatalogDefinition,
  locale: AppLocale
): Promise<{ title: string; summary: string } | null> {
  let content: ToolPageContent | ModelPageContent | null = null;
  switch (definition.kind) {
    case 'tool':
      content = await loadToolContentOrNull(definition.entityId, locale);
      if (content) validateToolPageContent(definition, content);
      break;
    case 'model':
      content = await loadModelContentOrNull(definition.entityId, locale);
      if (content) validateModelPageContent(definition, content);
      break;
  }
  if (!content) return null;
  return {
    title: content.directory.title || content.seo.title,
    summary: content.directory.description || content.seo.description,
  };
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
): Promise<LoadableCatalogLlmsEntry[]> {
  const candidates = selectLlmsEntries(
    definitions,
    locale,
    isCatalogPageContentAvailable
  );
  const entries = await Promise.all(
    candidates.map(async (candidate) => {
      const copy = await loadCatalogLlmsCopy(candidate.definition, locale);
      return copy ? { ...candidate, ...copy } : null;
    })
  );
  return entries.filter(
    (entry): entry is LoadableCatalogLlmsEntry => entry !== null
  );
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
