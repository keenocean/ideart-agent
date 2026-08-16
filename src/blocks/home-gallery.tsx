import { m } from '@/paraglide/messages.js';
import {
  CatalogMasonryGallery,
  type CatalogGalleryItem,
} from '@/components/catalog/catalog-masonry-gallery';
import type { CatalogMediaAsset } from '@/components/catalog/catalog-media';
import { CatalogSection } from '@/components/catalog/catalog-section';
import { CatalogSectionHeading } from '@/components/catalog/catalog-section-heading';

export function HomeGallery({
  media,
}: {
  media: readonly CatalogMediaAsset[];
}) {
  const titles = [
    m['landing.gallery.item_1_title'](),
    m['landing.gallery.item_2_title'](),
    m['landing.gallery.item_3_title'](),
    m['landing.gallery.item_4_title'](),
    m['landing.gallery.item_5_title'](),
    m['landing.gallery.item_6_title'](),
    m['landing.gallery.item_7_title'](),
    m['landing.gallery.item_8_title'](),
  ];
  const prompts = [
    m['landing.gallery.item_1'](),
    m['landing.gallery.item_2'](),
    m['landing.gallery.item_3'](),
    m['landing.gallery.item_4'](),
    m['landing.gallery.item_5'](),
    m['landing.gallery.item_6'](),
    m['landing.gallery.item_7'](),
    m['landing.gallery.item_8'](),
  ];
  const items = media.map(
    (asset, index): CatalogGalleryItem => ({
      id: `home-example-${index + 1}`,
      title: titles[index]!,
      prompt: prompts[index]!,
      media: asset,
    })
  );

  return (
    <CatalogSection id="gallery">
      <CatalogSectionHeading
        title={m['landing.gallery.title']()}
        description={m['landing.gallery.description']()}
      />
      <div className="mt-10">
        <CatalogMasonryGallery
          items={items}
          collapsedHeight={1120}
          labels={{
            image: m['showcase.dialog.image'](),
            video: m['showcase.dialog.video'](),
            prompt: m['showcase.dialog.prompt'](),
            download: m['showcase.dialog.download'](),
            previous: m['showcase.dialog.previous'](),
            next: m['showcase.dialog.next'](),
            close: m['showcase.dialog.close'](),
            usePrompt: m['showcase.dialog.use_prompt'](),
            expand: m['landing.gallery.expand'](),
          }}
        />
      </div>
    </CatalogSection>
  );
}
