import { catalogRouteSegment } from '@/config/catalog/paths';
import { isSupportedLocale, type AppLocale } from '@/config/locale';
import { locales } from '@/paraglide/runtime.js';

import type { ToolPageContent } from './types';

type ToolContentModule = { content: ToolPageContent };
type ToolContentLoader = () => Promise<ToolContentModule>;

function contentKey(entityId: string, locale: AppLocale): string {
  return `${entityId}:${locale}`;
}

const contentPathPattern = /^\.\/pages\/([^/]+)\/([^/]+)\.ts$/;

function indexToolContentModules(
  modules: Record<string, ToolContentLoader>
): Readonly<Record<string, ToolContentLoader>> {
  const loaders: Record<string, ToolContentLoader> = {};
  for (const [path, loader] of Object.entries(modules)) {
    const match = contentPathPattern.exec(path);
    if (!match) throw new Error(`Invalid tool content path: ${path}`);
    const [, entityId, locale] = match;
    try {
      if (catalogRouteSegment(entityId) !== entityId) throw new Error();
    } catch {
      throw new Error(`Invalid tool content entity id: ${path}`);
    }
    if (!isSupportedLocale(locale)) {
      throw new Error(`Unsupported tool content locale: ${path}`);
    }
    const key = contentKey(entityId, locale);
    if (loaders[key]) throw new Error(`Duplicate tool content: ${key}`);
    loaders[key] = loader;
  }
  return Object.freeze(loaders);
}

const toolContentLoaders = indexToolContentModules(
  import.meta.glob<ToolContentModule>('./pages/*/*.ts', { eager: false })
);

export const toolContentManifestKeys = Object.freeze(
  Object.keys(toolContentLoaders).sort()
);

export function hasToolContent(entityId: string, locale: AppLocale): boolean {
  return contentKey(entityId, locale) in toolContentLoaders;
}

export function availableToolContentLocales(entityId: string): AppLocale[] {
  return locales.filter((locale) => hasToolContent(entityId, locale));
}

/** Exact-locale lookup. Missing content never falls back to another language. */
export async function loadToolContent(
  entityId: string,
  locale: AppLocale
): Promise<ToolPageContent | null> {
  const key = contentKey(entityId, locale);
  const loader = (
    toolContentLoaders as Record<string, ToolContentLoader | undefined>
  )[key];
  if (!loader) return null;
  const { content } = await loader();
  if (!content || typeof content !== 'object') {
    throw new Error(`Invalid tool content module: ${key}`);
  }
  if (content.entityId !== entityId || content.locale !== locale) {
    throw new Error(`Tool content identity mismatch: ${key}`);
  }
  return content;
}

/** Runtime-facing fail-closed lookup; strict callers/tests can use loadToolContent. */
export async function loadToolContentOrNull(
  entityId: string,
  locale: AppLocale
): Promise<ToolPageContent | null> {
  try {
    return await loadToolContent(entityId, locale);
  } catch (error) {
    console.error(
      `[catalog] Invalid tool content: ${entityId}:${locale}`,
      error
    );
    return null;
  }
}
