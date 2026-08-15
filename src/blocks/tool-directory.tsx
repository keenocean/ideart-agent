import { m } from '@/paraglide/messages.js';
import {
  CatalogDirectory,
  type CatalogDirectoryCard,
} from '@/components/catalog/catalog-directory';
import type { ToolDirectoryItem } from '@/content/tools/listing';

function availabilityLabel(availability: ToolDirectoryItem['availability']) {
  switch (availability) {
    case 'live':
      return m['tools.availability.live']();
    case 'beta':
      return m['tools.availability.beta']();
    case 'coming-soon':
      return m['tools.availability.coming_soon']();
  }
}

export function ToolDirectory({ items }: { items: ToolDirectoryItem[] }) {
  const cards: CatalogDirectoryCard[] = items.map((item) => ({
    ...item,
    statusLabel: availabilityLabel(item.availability),
    actionLabel: m['tools.directory.view_tool'](),
  }));
  return (
    <CatalogDirectory
      eyebrow={m['tools.directory.eyebrow']()}
      title={m['tools.directory.title']()}
      description={m['tools.directory.description']()}
      items={cards}
      emptyText={m['tools.directory.empty']()}
    />
  );
}
