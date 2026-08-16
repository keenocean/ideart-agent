import type { AppLocale } from '@/config/locale';
import { locales } from '@/paraglide/runtime.js';
import {
  hasMarketingPage,
  marketingContentPageKeys,
} from '@/content/marketing';
import { MarketingContentUnavailableError } from '@/content/marketing/registry';
import { getDefaultMarketingContentRegistry } from '@/content/marketing/store';

import type { ToolPageContent } from './types';

export const toolContentManifestKeys = Object.freeze(
  marketingContentPageKeys.flatMap((key) =>
    key.startsWith('tool:') ? [key.slice('tool:'.length)] : []
  )
);

export function hasToolContent(entityId: string, locale: AppLocale): boolean {
  return hasMarketingPage('tool', entityId, locale);
}

export function availableToolContentLocales(entityId: string): AppLocale[] {
  return locales.filter((locale) => hasToolContent(entityId, locale));
}

/** Exact-locale lookup. Unregistered content is 404; published failures throw. */
export async function loadToolContent(
  entityId: string,
  locale: AppLocale
): Promise<ToolPageContent | null> {
  if (!hasToolContent(entityId, locale)) return null;
  const registry = await getDefaultMarketingContentRegistry();
  const page = await registry.getToolPage(entityId, locale);
  if (!page) {
    throw new MarketingContentUnavailableError(
      `Published marketing page is absent from the pinned release: tool:${entityId}:${locale}`
    );
  }
  return page.content;
}

/** Compatibility alias: null means unpublished only; release errors propagate. */
export const loadToolContentOrNull = loadToolContent;
