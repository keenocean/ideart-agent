import { legacyCatalogRoutes } from './legacy-routes';
import { modelCatalog } from './models';
import { toolCatalog } from './tools';
import type { CatalogDefinition } from './types';
import { validateCatalog } from './validate';

export const catalog: readonly CatalogDefinition[] = [
  ...toolCatalog,
  ...modelCatalog,
];

validateCatalog(catalog, legacyCatalogRoutes);
