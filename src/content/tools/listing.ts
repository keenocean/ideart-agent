import { catalog } from '@/config/catalog/registry';
import { resolveCatalogRoute } from '@/config/catalog/resolver';
import { selectRelatedEntries } from '@/config/catalog/selectors';
import type {
  Availability,
  CatalogDefinition,
  CatalogLocalePage,
  Indexing,
  ToolArchetype,
  ToolDefinition,
} from '@/config/catalog/types';
import type { AppLocale } from '@/config/locale';
import type { SeoRouteRef } from '@/lib/seo';
import {
  isCatalogPageContentAvailable,
  selectContentBackedCatalogLocaleRoutes,
} from '@/content/catalog-pages';
import { hasMarketingDirectory } from '@/content/marketing';
import {
  MarketingContentUnavailableError,
  MarketingContentValidationError,
} from '@/content/marketing/registry';
import { getDefaultMarketingContentRegistry } from '@/content/marketing/store';

import { loadToolContentOrNull } from './manifest';
import type { ToolPageContent } from './types';
import { validateToolPageContent } from './validate';

export type ToolDirectoryItem = {
  entityId: string;
  href: string;
  title: string;
  description: string;
  availability: Availability;
};

export type ToolDirectoryPageData = {
  locale: AppLocale;
  seo: { title: string; description: string };
  hero: { title: string; description: string };
  items: ToolDirectoryItem[];
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
  archetype: ToolArchetype;
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

async function loadValidatedToolContent(
  definition: ListedToolDefinition,
  locale: AppLocale
): Promise<ToolPageContent | null> {
  const content = await loadToolContentOrNull(definition.entityId, locale);
  if (!content) return null;
  try {
    validateToolPageContent(definition, content);
    return content;
  } catch (error) {
    throw new MarketingContentValidationError(
      `Tool content contract failed: ${definition.entityId}:${locale}`,
      { cause: error }
    );
  }
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
  if (definition.kind === 'tool') {
    const listedTool = asListedTool(definition);
    if (!listedTool || !(await loadValidatedToolContent(listedTool, locale))) {
      return null;
    }
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
  const content = await loadValidatedToolContent(definition, locale);
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
  return (await loadToolDirectoryPage(locale))?.items ?? [];
}

/** One projected release object keeps directory reads O(1) at 100+ pages. */
export async function loadToolDirectoryPage(
  locale: AppLocale
): Promise<ToolDirectoryPageData | null> {
  if (!hasMarketingDirectory('tools', locale)) return null;
  const registry = await getDefaultMarketingContentRegistry();
  const directory = await registry.getToolDirectory(locale);
  if (!directory) {
    throw new MarketingContentUnavailableError(
      `Published marketing directory is absent from the pinned release: tools:${locale}`
    );
  }
  return {
    locale,
    seo: directory.seo,
    hero: directory.hero,
    items: directory.items,
  };
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
  const content = await loadValidatedToolContent(definition, locale);
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
    archetype: definition.archetype,
    contentModifiedAt: page.contentModifiedAt,
    availableLocales: localeRoutes.map((route) => route.locale),
    localeRoutes,
    alternates: indexableAlternates(definition, page.indexing, localeRoutes),
    content,
    related,
    showcaseRoutes,
  };
}
