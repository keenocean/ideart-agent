import { Images, Layers3, MessageSquareText, WandSparkles } from 'lucide-react';

import { m } from '@/paraglide/messages.js';
import { CatalogFeatureGrid } from '@/components/catalog/catalog-marketing-sections';

export function HomeFeatures() {
  return (
    <CatalogFeatureGrid
      id="features"
      className="bg-muted/35 border-border border-y py-20 sm:py-28"
      title={m['landing.features.title']()}
      description={m['landing.features.description']()}
      items={[
        {
          title: m['landing.features.item_1.title'](),
          description: m['landing.features.item_1.description'](),
          icon: <MessageSquareText className="text-primary size-5" />,
        },
        {
          title: m['landing.features.item_2.title'](),
          description: m['landing.features.item_2.description'](),
          icon: <Images className="text-primary size-5" />,
        },
        {
          title: m['landing.features.item_3.title'](),
          description: m['landing.features.item_3.description'](),
          icon: <Layers3 className="text-primary size-5" />,
        },
        {
          title: m['landing.features.item_4.title'](),
          description: m['landing.features.item_4.description'](),
          icon: <WandSparkles className="text-primary size-5" />,
        },
      ]}
    />
  );
}
