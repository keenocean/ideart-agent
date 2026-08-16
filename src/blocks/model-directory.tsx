import { m } from '@/paraglide/messages.js';
import {
  CatalogDirectory,
  type CatalogDirectoryCard,
} from '@/components/catalog/catalog-directory';
import type { ModelDirectoryItem } from '@/content/models/listing';

function availabilityLabel(availability: ModelDirectoryItem['availability']) {
  switch (availability) {
    case 'live':
      return m['models.availability.live']();
    case 'beta':
      return m['models.availability.beta']();
    case 'coming-soon':
      return m['models.availability.coming_soon']();
  }
}

export function ModelDirectory({
  items,
  title,
  description,
}: {
  items: ModelDirectoryItem[];
  title: string;
  description: string;
}) {
  const cards: CatalogDirectoryCard[] = items.map((item) => ({
    ...item,
    statusLabel: availabilityLabel(item.availability),
    actionLabel: m['models.directory.view_model'](),
  }));
  return (
    <CatalogDirectory
      eyebrow={m['models.directory.eyebrow']()}
      title={title}
      description={description}
      items={cards}
      emptyText={m['models.directory.empty']()}
    />
  );
}
