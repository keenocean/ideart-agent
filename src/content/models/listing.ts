import { modelCatalog } from '@/config/catalog/models';
import { catalog } from '@/config/catalog/registry';
import { resolveCatalogRoute } from '@/config/catalog/resolver';
import { selectRelatedEntries } from '@/config/catalog/selectors';
import type {
  Availability,
  CatalogLocalePage,
  Indexing,
  ModelDefinition,
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

import { loadModelContentOrNull } from './manifest';
import type { ModelPageContent } from './types';
import { validateModelPageContent } from './validate';

export type ModelDirectoryItem = {
  entityId: string;
  href: string;
  title: string;
  description: string;
  availability: Availability;
};

export type ModelDirectoryPageData = {
  locale: AppLocale;
  seo: { title: string; description: string };
  hero: { title: string; description: string };
  items: ModelDirectoryItem[];
};

export type ModelDetailPageData = {
  entityId: string;
  locale: AppLocale;
  path: string;
  indexing: Indexing;
  availability: Availability;
  contentModifiedAt?: string;
  localeRoutes: SeoRouteRef[];
  alternates: SeoRouteRef[];
  content: ModelPageContent;
  related: ModelDirectoryItem[];
};

type ListedModelDefinition = ModelDefinition & {
  publication: 'listed';
  localePages: Partial<Record<AppLocale, CatalogLocalePage>>;
};

function asListedModel(entry: ModelDefinition): ListedModelDefinition | null {
  return entry.publication === 'listed'
    ? (entry as ListedModelDefinition)
    : null;
}

async function loadValidatedModelContent(
  definition: ListedModelDefinition,
  locale: AppLocale
) {
  const content = await loadModelContentOrNull(definition.entityId, locale);
  if (!content) return null;
  try {
    validateModelPageContent(definition, content);
    return content;
  } catch (error) {
    throw new MarketingContentValidationError(
      `Model content contract failed: ${definition.entityId}:${locale}`,
      { cause: error }
    );
  }
}

async function cardFor(
  definition: ListedModelDefinition,
  locale: AppLocale
): Promise<ModelDirectoryItem | null> {
  const page = definition.localePages[locale];
  if (!page) return null;
  const content = await loadValidatedModelContent(definition, locale);
  if (!content) return null;
  return {
    entityId: definition.entityId,
    href: resolveCatalogRoute('model', locale, page.slug).path,
    title: content.directory.title,
    description: content.directory.description,
    availability: definition.availability,
  };
}

export async function loadModelDirectoryPage(
  locale: AppLocale
): Promise<ModelDirectoryPageData | null> {
  if (!hasMarketingDirectory('models', locale)) return null;
  const registry = await getDefaultMarketingContentRegistry();
  const directory = await registry.getModelDirectory(locale);
  if (!directory) {
    throw new MarketingContentUnavailableError(
      `Published marketing directory is absent from the pinned release: models:${locale}`
    );
  }
  return {
    locale,
    seo: directory.seo,
    hero: directory.hero,
    items: directory.items,
  };
}

export async function loadModelDetailPage(
  locale: AppLocale,
  slug: string
): Promise<ModelDetailPageData | null> {
  let resolved;
  try {
    resolved = resolveCatalogRoute('model', locale, slug);
  } catch {
    return null;
  }
  if (resolved.definition.kind !== 'model') return null;
  const definition = asListedModel(resolved.definition);
  if (!definition) return null;
  const content = await loadValidatedModelContent(definition, locale);
  const page = definition.localePages[locale];
  if (!content || !page) return null;
  const relatedDefinitions = selectRelatedEntries(
    catalog,
    definition,
    locale,
    isCatalogPageContentAvailable
  ).flatMap((entry) =>
    entry.kind === 'model' ? [asListedModel(entry)].filter(Boolean) : []
  ) as ListedModelDefinition[];
  const related = (
    await Promise.all(relatedDefinitions.map((entry) => cardFor(entry, locale)))
  ).filter((item): item is ModelDirectoryItem => Boolean(item));
  const localeRoutes = selectContentBackedCatalogLocaleRoutes(definition);
  const alternates =
    page.indexing === 'index'
      ? localeRoutes.filter(
          (route) => definition.localePages[route.locale]?.indexing === 'index'
        )
      : [];
  return {
    entityId: definition.entityId,
    locale,
    path: resolved.path,
    indexing: page.indexing,
    availability: definition.availability,
    contentModifiedAt: page.contentModifiedAt,
    localeRoutes,
    alternates,
    content,
    related,
  };
}

export { modelCatalog };
