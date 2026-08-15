import type { ReactNode } from 'react';
import {
  ArrowRight,
  Lightbulb,
  PanelsTopLeft,
  Route,
  Sparkles,
} from 'lucide-react';

import { Link } from '@/core/i18n/navigation';
import type { MarketingAsset } from '@/config/catalog/types';
import {
  CatalogExploreSection,
  CatalogFaq,
  CatalogFeatureGrid,
  CatalogFinalCta,
  CatalogLimitations,
  CatalogMediaCarousel,
  ToolQuickStarts,
} from '@/components/catalog/catalog-marketing-sections';
import {
  CatalogMasonryGallery,
  type CatalogGalleryItem,
} from '@/components/catalog/catalog-masonry-gallery';
import { CatalogMediaFeatureList } from '@/components/catalog/catalog-media-feature-list';
import { CatalogSectionHeading } from '@/components/catalog/catalog-section-heading';
import {
  CatalogShowcaseCardGrid,
  type CatalogModelShowcaseItem,
  type CatalogWorkflowShowcaseItem,
} from '@/components/catalog/catalog-showcase-card-grid';
import type { ToolPageContent, ToolPromptExample } from '@/content/tools/types';

type ToolDetailPromptExample = Omit<ToolPromptExample, 'media'> & {
  media: MarketingAsset & { alt: string };
};

type ToolDetailPageContent = Omit<ToolPageContent, 'examples' | 'showcase'> & {
  examples: Omit<ToolPageContent['examples'], 'items'> & {
    items: readonly ToolDetailPromptExample[];
  };
  showcase: {
    workflows: Omit<ToolPageContent['showcase']['workflows'], 'items'> & {
      items: readonly CatalogWorkflowShowcaseItem[];
    };
    models: Omit<ToolPageContent['showcase']['models'], 'items'> & {
      items: readonly CatalogModelShowcaseItem[];
    };
  };
};

export type ToolDetailRelatedItem = {
  entityId: string;
  href: string;
  title: string;
  description: string;
  actionLabel: string;
};

export function ToolDetailPage({
  content,
  availabilityLabel,
  breadcrumbHomeLabel,
  breadcrumbToolsLabel,
  relatedTitle,
  relatedItems,
  workbench,
  onUsePrompt,
}: {
  content: ToolDetailPageContent;
  availabilityLabel: string;
  breadcrumbHomeLabel: string;
  breadcrumbToolsLabel: string;
  relatedTitle: string;
  relatedItems: readonly ToolDetailRelatedItem[];
  workbench: ReactNode;
  onUsePrompt: (prompt: string) => void;
}) {
  const galleryItems: CatalogGalleryItem[] = content.examples.items.map(
    (item, index) => ({
      id: `${index}-${item.title}`,
      title: item.title,
      description: item.description,
      prompt: item.prompt,
      media: item.media,
    })
  );
  const quickStartItems = galleryItems
    .filter((item) => item.media.kind === 'image')
    .slice(0, 4);
  const imageItems = galleryItems.filter((item) => item.media.kind === 'image');
  const videoItems = galleryItems.filter((item) => item.media.kind === 'video');
  const featureItems = [
    ...content.features.items.map((item) => ({
      ...item,
      icon: <Sparkles aria-hidden="true" className="text-primary size-5" />,
    })),
    ...content.promptGuide.items.map((item) => ({
      ...item,
      icon: <Lightbulb aria-hidden="true" className="text-primary size-5" />,
    })),
  ];
  const useCaseItems = content.useCases.items.flatMap((item, index) => {
    const example = galleryItems[index % galleryItems.length];
    return example
      ? [
          {
            id: `${index}-${item.title}`,
            title: item.title,
            description: item.description,
            media: example.media,
            mediaPosition:
              index % 2 === 0 ? ('left' as const) : ('right' as const),
          },
        ]
      : [];
  });
  const galleryLabels = {
    ...content.examples.labels,
    usePrompt: content.examples.labels.usePrompt,
  };

  function usePrompt(item: CatalogGalleryItem) {
    onUsePrompt(item.prompt);
  }

  return (
    <article>
      <section
        id="generator"
        className="scroll-mt-20 px-4 pt-12 pb-16 sm:px-6 sm:pt-16"
      >
        <div className="mx-auto w-full max-w-3xl">
          <nav aria-label="Breadcrumb" className="sr-only">
            <Link href="/">{breadcrumbHomeLabel}</Link>
            <Link href="/tools">{breadcrumbToolsLabel}</Link>
            <span aria-current="page">{content.directory.title}</span>
          </nav>
          <p className="sr-only">
            {content.hero.eyebrow} · {availabilityLabel}
          </p>
          <h1 className="text-foreground text-center font-serif text-3xl font-normal tracking-[-0.01em] sm:text-4xl">
            {content.hero.title}
          </h1>
          <p className="text-muted-foreground mx-auto mt-4 max-w-2xl text-center text-sm leading-relaxed sm:text-base">
            {content.hero.description}
          </p>
          <div className="mt-8">{workbench}</div>
          <ToolQuickStarts
            label={content.examples.labels.quickStart}
            items={quickStartItems}
            onSelect={usePrompt}
          />
        </div>
      </section>

      <CatalogExploreSection
        groups={[
          {
            ...content.inputOutput,
            items: content.inputOutput.items.map((item) => ({
              ...item,
              icon: (
                <PanelsTopLeft
                  aria-hidden="true"
                  className="text-primary size-5"
                />
              ),
            })),
          },
          {
            ...content.workflow,
            items: content.workflow.items.map((item) => ({
              ...item,
              icon: (
                <Route aria-hidden="true" className="text-primary size-5" />
              ),
            })),
          },
        ]}
      />

      <CatalogShowcaseCardGrid
        workflows={content.showcase.workflows}
        models={content.showcase.models}
      />

      <section id="showcase" className="scroll-mt-20 px-4 py-16 sm:px-6">
        <div className="mx-auto w-full max-w-6xl">
          <CatalogSectionHeading
            title={content.examples.title}
            description={content.examples.description}
          />
          <div className="mt-10">
            <CatalogMasonryGallery
              items={imageItems}
              labels={galleryLabels}
              collapsedHeight={imageItems.length > 12 ? 1120 : undefined}
              onUsePrompt={usePrompt}
            />
          </div>
        </div>
      </section>

      <CatalogMediaCarousel
        title={content.videoInspiration.title}
        description={content.videoInspiration.description}
        items={videoItems}
        labels={galleryLabels}
        onUsePrompt={usePrompt}
      />

      <CatalogFeatureGrid
        id="features"
        title={content.features.title}
        description={content.features.description}
        items={featureItems}
      />

      <CatalogMediaFeatureList
        id="use-cases"
        title={content.useCases.title}
        description={content.useCases.description}
        items={useCaseItems}
      />

      <CatalogLimitations {...content.limitations} />

      {relatedItems.length > 0 && (
        <section className="px-4 py-16 sm:px-6">
          <div className="mx-auto max-w-6xl">
            <CatalogSectionHeading title={relatedTitle} />
            <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {relatedItems.map((item) => (
                <Link
                  key={item.entityId}
                  href={item.href}
                  className="border-border bg-card rounded-2xl border p-5 transition-transform hover:-translate-y-0.5"
                >
                  <h3 className="font-semibold">{item.title}</h3>
                  <p className="text-muted-foreground mt-2 text-sm leading-6">
                    {item.description}
                  </p>
                  <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold">
                    {item.actionLabel}
                    <ArrowRight aria-hidden="true" className="size-4" />
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      <CatalogFaq title={content.faq.title} items={content.faq.items} />
      <CatalogFinalCta {...content.cta} />
    </article>
  );
}
