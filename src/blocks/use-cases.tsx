import { m } from '@/paraglide/messages.js';
import type { CatalogMediaAsset } from '@/components/catalog/catalog-media';
import { CatalogMediaFeatureList } from '@/components/catalog/catalog-media-feature-list';

export function UseCases({ media }: { media: readonly CatalogMediaAsset[] }) {
  return (
    <CatalogMediaFeatureList
      id="use-cases"
      variant="banded"
      title={m['landing.use_cases.title']()}
      description={m['landing.use_cases.description']()}
      items={[
        {
          id: 'campaigns',
          eyebrow: m['landing.use_cases.item_1.eyebrow'](),
          title: m['landing.use_cases.item_1.title'](),
          description: m['landing.use_cases.item_1.description'](),
          bullets: [
            m['landing.use_cases.item_1.bullet_1'](),
            m['landing.use_cases.item_1.bullet_2'](),
            m['landing.use_cases.item_1.bullet_3'](),
          ],
          media: media[0]!,
          mediaPosition: 'right',
        },
        {
          id: 'social',
          eyebrow: m['landing.use_cases.item_2.eyebrow'](),
          title: m['landing.use_cases.item_2.title'](),
          description: m['landing.use_cases.item_2.description'](),
          bullets: [
            m['landing.use_cases.item_2.bullet_1'](),
            m['landing.use_cases.item_2.bullet_2'](),
            m['landing.use_cases.item_2.bullet_3'](),
          ],
          media: media[1]!,
          mediaPosition: 'left',
        },
        {
          id: 'product',
          eyebrow: m['landing.use_cases.item_3.eyebrow'](),
          title: m['landing.use_cases.item_3.title'](),
          description: m['landing.use_cases.item_3.description'](),
          bullets: [
            m['landing.use_cases.item_3.bullet_1'](),
            m['landing.use_cases.item_3.bullet_2'](),
            m['landing.use_cases.item_3.bullet_3'](),
          ],
          media: media[2]!,
          mediaPosition: 'right',
        },
      ]}
    />
  );
}
