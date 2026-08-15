import type { AppLocale } from '@/config/locale';

import type { CatalogKind, CatalogRouteSegment } from './types';

export type LegacyCatalogRoute = {
  kind: CatalogKind;
  locale: AppLocale;
  fromSlug: CatalogRouteSegment;
} & (
  | { action: 'redirect'; toEntityId: string }
  | { action: 'gone'; toEntityId?: never }
);

// This is a new project with no confirmed historical tool/model URLs.
// Add an entry only after proving the old URL was actually published.
export const legacyCatalogRoutes =
  [] as const satisfies readonly LegacyCatalogRoute[];
