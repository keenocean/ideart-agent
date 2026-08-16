import type { CatalogKind } from '@/config/catalog/types';
import type { AppLocale } from '@/config/locale';

import {
  marketingDirectoryKeys,
  marketingHomeProjectionLocales,
  marketingPageKeys,
} from './release-index.generated';

const pageKeySet = new Set<string>(marketingPageKeys);
const directoryKeySet = new Set<string>(marketingDirectoryKeys);
const homeProjectionLocaleSet = new Set<string>(marketingHomeProjectionLocales);

export function marketingPageKey(
  kind: CatalogKind,
  entityId: string,
  locale: AppLocale
): string {
  return `${kind}:${entityId}:${locale}`;
}

export function hasMarketingPage(
  kind: CatalogKind,
  entityId: string,
  locale: AppLocale
): boolean {
  return pageKeySet.has(marketingPageKey(kind, entityId, locale));
}

export function hasMarketingDirectory(
  kind: 'tools' | 'models',
  locale: AppLocale
): boolean {
  return directoryKeySet.has(`${kind}:${locale}`);
}

export function hasMarketingHomeProjection(locale: AppLocale): boolean {
  return homeProjectionLocaleSet.has(locale);
}

export const marketingContentPageKeys: readonly string[] = marketingPageKeys;
export const marketingContentDirectoryKeys: readonly string[] =
  marketingDirectoryKeys;
export const marketingContentHomeProjectionLocales: readonly string[] =
  marketingHomeProjectionLocales;
