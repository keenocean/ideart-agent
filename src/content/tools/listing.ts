import { catalog } from '@/config/catalog/registry';
import { resolveCatalogRoute } from '@/config/catalog/resolver';
import {
  selectDirectoryEntries,
  selectRelatedEntries,
} from '@/config/catalog/selectors';
import { toolCatalog } from '@/config/catalog/tools';
import type {
  Availability,
  CatalogDefinition,
  CatalogLocalePage,
  Indexing,
  ToolDefinition,
} from '@/config/catalog/types';
import type { AppLocale } from '@/config/locale';
import type { SeoRouteRef } from '@/lib/seo';
import {
  isCatalogPageContentAvailable,
  selectContentBackedCatalogLocaleRoutes,
} from '@/content/catalog-pages';

import { loadToolContentOrNull } from './manifest';
import type { ToolPageContent } from './types';

export type ToolDirectoryItem = {
  entityId: string;
  href: string;
  title: string;
  description: string;
  availability: Availability;
};

export type ToolShowcaseRoute = {
  entityId: string;
  href: string;
};

export type ToolDetailPageData = {
  entityId: string;
  locale: AppLocale;
  path: string;
  indexing: Indexing;
  availability: Availability;
  contentModifiedAt?: string;
  availableLocales: AppLocale[];
  localeRoutes: SeoRouteRef[];
  alternates: SeoRouteRef[];
  content: ToolPageContent;
  related: ToolDirectoryItem[];
  showcaseRoutes: {
    workflows: ToolShowcaseRoute[];
    models: ToolShowcaseRoute[];
  };
};

type ListedToolDefinition = ToolDefinition & {
  publication: 'listed';
  localePages: Partial<Record<AppLocale, CatalogLocalePage>>;
};

function asListedTool(entry: CatalogDefinition): ListedToolDefinition | null {
  return entry.kind === 'tool' && entry.publication === 'listed'
    ? (entry as ListedToolDefinition)
    : null;
}

async function showcaseRouteFor(
  kind: CatalogDefinition['kind'],
  entityId: string,
  locale: AppLocale
): Promise<ToolShowcaseRoute | null> {
  const definition = catalog.find(
    (entry) => entry.kind === kind && entry.entityId === entityId
  );
  if (
    !definition ||
    definition.publication !== 'listed' ||
    !definition.localePages[locale] ||
    !isCatalogPageContentAvailable(definition, locale)
  ) {
    return null;
  }
  if (
    definition.kind === 'tool' &&
    (await loadToolContentOrNull(entityId, locale)) === null
  ) {
    return null;
  }
  return {
    entityId,
    href: resolveCatalogRoute(kind, locale, definition.localePages[locale].slug)
      .path,
  };
}

async function cardFor(
  definition: ListedToolDefinition,
  locale: AppLocale
): Promise<ToolDirectoryItem | null> {
  const page = definition.localePages[locale];
  if (!page) return null;
  const content = await loadToolContentOrNull(definition.entityId, locale);
  if (!content) return null;
  const resolved = resolveCatalogRoute('tool', locale, page.slug);
  return {
    entityId: definition.entityId,
    href: resolved.path,
    title: content.directory.title,
    description: content.directory.description,
    availability: definition.availability,
  };
}

export async function loadToolDirectoryItems(
  locale: AppLocale
): Promise<ToolDirectoryItem[]> {
  const definitions = selectDirectoryEntries(
    toolCatalog,
    locale,
    isCatalogPageContentAvailable
  )
    .map(asListedTool)
    .filter((entry): entry is ListedToolDefinition => Boolean(entry));
  const items = await Promise.all(
    definitions.map((definition) => cardFor(definition, locale))
  );
  return items.filter((item): item is ToolDirectoryItem => Boolean(item));
}

function indexableAlternates(
  definition: ListedToolDefinition,
  indexing: Indexing,
  localeRoutes: readonly SeoRouteRef[]
): SeoRouteRef[] {
  if (indexing !== 'index') return [];
  return localeRoutes.filter(
    (route) => definition.localePages[route.locale]?.indexing === 'index'
  );
}

export async function loadToolDetailPage(
  locale: AppLocale,
  slug: string
): Promise<ToolDetailPageData | null> {
  let resolved;
  try {
    resolved = resolveCatalogRoute('tool', locale, slug);
  } catch {
    return null;
  }
  const definition = asListedTool(resolved.definition);
  if (!definition) return null;
  const content = await loadToolContentOrNull(definition.entityId, locale);
  if (!content) return null;
  const page = definition.localePages[locale];
  if (!page) return null;

  const relatedDefinitions = selectRelatedEntries(
    catalog,
    definition,
    locale,
    isCatalogPageContentAvailable
  )
    .map(asListedTool)
    .filter((entry): entry is ListedToolDefinition => Boolean(entry));
  const related = (
    await Promise.all(relatedDefinitions.map((entry) => cardFor(entry, locale)))
  ).filter((item): item is ToolDirectoryItem => Boolean(item));

  const localeRoutes = selectContentBackedCatalogLocaleRoutes(definition);
  const [workflowRouteCandidates, modelRouteCandidates] = await Promise.all([
    Promise.all(
      content.showcase.workflows.items.map((item) =>
        showcaseRouteFor('tool', item.entityId, locale)
      )
    ),
    Promise.all(
      content.showcase.models.items.map((item) =>
        showcaseRouteFor('model', item.entityId, locale)
      )
    ),
  ]);
  const showcaseRoutes = {
    workflows: workflowRouteCandidates.filter(
      (item): item is ToolShowcaseRoute => Boolean(item)
    ),
    models: modelRouteCandidates.filter((item): item is ToolShowcaseRoute =>
      Boolean(item)
    ),
  };
  return {
    entityId: definition.entityId,
    locale,
    path: resolved.path,
    indexing: page.indexing,
    availability: definition.availability,
    contentModifiedAt: page.contentModifiedAt,
    availableLocales: localeRoutes.map((route) => route.locale),
    localeRoutes,
    alternates: indexableAlternates(definition, page.indexing, localeRoutes),
    content,
    related,
    showcaseRoutes,
  };
}
