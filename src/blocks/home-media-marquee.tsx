import { m } from '@/paraglide/messages.js';
import {
  CatalogMediaMarquee,
  type CatalogMediaMarqueeItem,
} from '@/components/catalog/catalog-media-marquee';
import { CatalogSection } from '@/components/catalog/catalog-section';

export function HomeMediaMarquee({
  media,
}: {
  media: readonly CatalogMediaMarqueeItem[];
}) {
  return (
    <CatalogSection className="pt-10 pb-16 sm:pt-12">
      <CatalogMediaMarquee
        items={media}
        label={m['landing.media_marquee.label']()}
        pauseLabel={m['landing.media_marquee.pause']()}
        playLabel={m['landing.media_marquee.play']()}
      />
    </CatalogSection>
  );
}
