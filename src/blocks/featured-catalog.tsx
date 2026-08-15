import { m } from '@/paraglide/messages.js';
import {
  CatalogShowcaseCardGrid,
  type CatalogModelShowcaseItem,
  type CatalogWorkflowShowcaseItem,
} from '@/components/catalog/catalog-showcase-card-grid';

export function FeaturedCatalog({
  tools,
  models,
}: {
  tools: readonly CatalogWorkflowShowcaseItem[];
  models: readonly CatalogModelShowcaseItem[];
}) {
  return (
    <CatalogShowcaseCardGrid
      workflows={{
        title: m['landing.showcase.tools.title'](),
        description: m['landing.showcase.tools.description'](),
        items: tools,
      }}
      models={{
        title: m['landing.showcase.models.title'](),
        description: m['landing.showcase.models.description'](),
        items: models,
      }}
    />
  );
}
