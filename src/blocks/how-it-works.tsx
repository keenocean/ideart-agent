import { m } from '@/paraglide/messages.js';
import { CatalogSteps } from '@/components/catalog/catalog-marketing-sections';

export function HowItWorks() {
  return (
    <CatalogSteps
      id="how-it-works"
      title={m['landing.how_it_works.title']()}
      description={m['landing.how_it_works.description']()}
      items={[
        {
          title: m['landing.how_it_works.item_1.title'](),
          description: m['landing.how_it_works.item_1.description'](),
        },
        {
          title: m['landing.how_it_works.item_2.title'](),
          description: m['landing.how_it_works.item_2.description'](),
        },
        {
          title: m['landing.how_it_works.item_3.title'](),
          description: m['landing.how_it_works.item_3.description'](),
        },
        {
          title: m['landing.how_it_works.item_4.title'](),
          description: m['landing.how_it_works.item_4.description'](),
        },
      ]}
    />
  );
}
