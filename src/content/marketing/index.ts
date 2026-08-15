import type { CatalogKind } from '@/config/catalog/types';
import type { AppLocale } from '@/config/locale';

import {
  marketingDirectoryKeys,
  marketingPageKeys,
} from './release-index.generated';

const pageKeySet = new Set<string>(marketingPageKeys);
const directoryKeySet = new Set<string>(marketingDirectoryKeys);

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

export const marketingContentPageKeys: readonly string[] = marketingPageKeys;
export const marketingContentDirectoryKeys: readonly string[] =
  marketingDirectoryKeys;
