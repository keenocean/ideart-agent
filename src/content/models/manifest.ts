import type { AppLocale } from '@/config/locale';
import { locales } from '@/paraglide/runtime.js';
import {
  hasMarketingPage,
  marketingContentPageKeys,
} from '@/content/marketing';
import { MarketingContentUnavailableError } from '@/content/marketing/registry';
import { getDefaultMarketingContentRegistry } from '@/content/marketing/store';

import type { ModelPageContent } from './types';

export const modelContentManifestKeys = Object.freeze(
  marketingContentPageKeys.flatMap((key) =>
    key.startsWith('model:') ? [key.slice('model:'.length)] : []
  )
);

export function hasModelContent(entityId: string, locale: AppLocale): boolean {
  return hasMarketingPage('model', entityId, locale);
}

export function availableModelContentLocales(entityId: string): AppLocale[] {
  return locales.filter((locale) => hasModelContent(entityId, locale));
}

export async function loadModelContent(
  entityId: string,
  locale: AppLocale
): Promise<ModelPageContent | null> {
  if (!hasModelContent(entityId, locale)) return null;
  const registry = await getDefaultMarketingContentRegistry();
  const page = await registry.getModelPage(entityId, locale);
  if (!page) {
    throw new MarketingContentUnavailableError(
      `Published marketing page is absent from the pinned release: model:${entityId}:${locale}`
    );
  }
  return page.content;
}

export const loadModelContentOrNull = loadModelContent;
