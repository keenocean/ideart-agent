import type { ComponentProps, ReactNode } from 'react';
import { Lightbulb, PanelsTopLeft, Route, Sparkles } from 'lucide-react';

import type { ToolArchetype } from '@/config/catalog/types';
import {
  CatalogExploreSection,
  CatalogFeatureGrid,
  CatalogLimitations,
  CatalogMediaCarousel,
  ToolQuickStarts,
} from '@/components/catalog/catalog-marketing-sections';
import {
  CatalogMasonryGallery,
  type CatalogGalleryItem,
} from '@/components/catalog/catalog-masonry-gallery';
import {
  CatalogMediaComparisonGrid,
  type CatalogMediaComparisonItem,
} from '@/components/catalog/catalog-media-comparison-grid';
import { CatalogMediaFeatureList } from '@/components/catalog/catalog-media-feature-list';
import { CatalogSection } from '@/components/catalog/catalog-section';
import { CatalogSectionHeading } from '@/components/catalog/catalog-section-heading';
import { CatalogShowcaseCardGrid } from '@/components/catalog/catalog-showcase-card-grid';
import {
  ToolDetailShell,
  type ToolDetailRelatedItem,
} from '@/components/catalog/tool-detail-shell';
import type {
  ToolPageContent,
  ToolPageContentFor,
} from '@/content/tools/types';

type ResolvedShowcase = Pick<
  ComponentProps<typeof CatalogShowcaseCardGrid>,
  'workflows' | 'models'
>;

export type ToolDetailTemplateProps = {
  content: ToolPageContent;
  availabilityLabel: string;
  breadcrumbHomeLabel: string;
  breadcrumbToolsLabel: string;
  relatedTitle: string;
  relatedItems: readonly ToolDetailRelatedItem[];
  showcase: ResolvedShowcase;
  workbench: ReactNode;
  onUsePrompt: (prompt: string) => void;
};

function contentFor<A extends ToolArchetype>(
  content: ToolPageContent,
  archetype: A
): ToolPageContentFor<A> {
  if (content.template !== archetype) {
    throw new Error(
      `Tool detail template mismatch: ${content.template} !== ${archetype}`
    );
  }
  return content as ToolPageContentFor<A>;
}

function ToolTemplateFrame({
  content,
  availabilityLabel,
  breadcrumbHomeLabel,
  breadcrumbToolsLabel,
  relatedTitle,
  relatedItems,
  workbench,
  heroSupplement,
  children,
}: Omit<ToolDetailTemplateProps, 'showcase' | 'onUsePrompt'> & {
  heroSupplement?: ReactNode;
  children: ReactNode;
}) {
  return (
    <ToolDetailShell
      directoryTitle={content.directory.title}
      hero={content.hero}
      availabilityLabel={availabilityLabel}
      breadcrumbHomeLabel={breadcrumbHomeLabel}
      breadcrumbToolsLabel={breadcrumbToolsLabel}
      relatedTitle={relatedTitle}
      relatedItems={relatedItems}
      workbench={workbench}
      heroSupplement={heroSupplement}
      faq={content.faq}
      cta={content.cta}
    >
      {children}
    </ToolDetailShell>
  );
}

function ToolTemplateIntro({ content }: { content: ToolPageContent }) {
  return (
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
            icon: <Route aria-hidden="true" className="text-primary size-5" />,
          })),
        },
      ]}
    />
  );
}

function ToolTemplateGuidance({ content }: { content: ToolPageContent }) {
  return (
    <CatalogFeatureGrid
      id="features"
      title={content.features.title}
      description={content.features.description}
      items={[
        ...content.features.items.map((item) => ({
          ...item,
          icon: <Sparkles aria-hidden="true" className="text-primary size-5" />,
        })),
        ...content.promptGuide.items.map((item) => ({
          ...item,
          icon: (
            <Lightbulb aria-hidden="true" className="text-primary size-5" />
          ),
        })),
      ]}
    />
  );
}

function ToolTemplateUseCases({
  content,
  variant = 'compact',
}: {
  content: ToolPageContent;
  variant?: 'compact' | 'banded';
}) {
  return (
    <CatalogMediaFeatureList
      id="use-cases"
      title={content.useCases.title}
      description={content.useCases.description}
      variant={variant}
      items={content.useCases.items.map((item, index) => ({
        ...item,
        mediaPosition:
          item.mediaPosition ?? (index % 2 === 0 ? 'left' : 'right'),
      }))}
    />
  );
}

function galleryItems(
  content: ToolPageContentFor<'image-generator' | 'text-to-video'>
): CatalogGalleryItem[] {
  return content.examples.items.map((item, index) => ({
    id: `${index}-${item.title}`,
    title: item.title,
    description: item.description,
    prompt: item.prompt,
    media: item.media,
  }));
}

function ImageGeneratorToolTemplate(props: ToolDetailTemplateProps) {
  const content = contentFor(props.content, 'image-generator');
  const items = galleryItems(content);
  const quickStarts = items.slice(0, 4);

  return (
    <ToolTemplateFrame
      {...props}
      content={content}
      heroSupplement={
        <ToolQuickStarts
          label={content.examples.labels.quickStart}
          items={quickStarts}
          onSelect={(item) => props.onUsePrompt(item.prompt)}
        />
      }
    >
      <ToolTemplateIntro content={content} />
      <CatalogShowcaseCardGrid {...props.showcase} />
      <CatalogSection id="showcase">
        <CatalogSectionHeading
          title={content.examples.title}
          description={content.examples.description}
        />
        <div className="mt-10">
          <CatalogMasonryGallery
            items={items}
            labels={content.examples.labels}
            collapsedHeight={items.length > 12 ? 1120 : undefined}
            onUsePrompt={(item) => props.onUsePrompt(item.prompt)}
          />
        </div>
      </CatalogSection>
      <ToolTemplateGuidance content={content} />
      <ToolTemplateUseCases content={content} />
      <CatalogLimitations {...content.limitations} />
    </ToolTemplateFrame>
  );
}

function TextToVideoToolTemplate(props: ToolDetailTemplateProps) {
  const content = contentFor(props.content, 'text-to-video');
  const items = galleryItems(content);

  return (
    <ToolTemplateFrame {...props} content={content}>
      <ToolTemplateIntro content={content} />
      <CatalogShowcaseCardGrid {...props.showcase} />
      <CatalogMediaCarousel
        title={content.examples.title}
        description={content.examples.description}
        items={items}
        labels={content.examples.labels}
        onUsePrompt={(item) => props.onUsePrompt(item.prompt)}
      />
      <ToolTemplateGuidance content={content} />
      <ToolTemplateUseCases content={content} variant="banded" />
      <CatalogLimitations {...content.limitations} />
    </ToolTemplateFrame>
  );
}

function ComparisonToolTemplate<
  A extends Exclude<ToolArchetype, 'image-generator' | 'text-to-video'>,
>({ archetype, ...props }: ToolDetailTemplateProps & { archetype: A }) {
  const content = contentFor(props.content, archetype);
  const items: CatalogMediaComparisonItem[] = content.comparisons.items.map(
    (item) => ({
      ...item,
      source: item.source,
      result: item.result,
    })
  );

  return (
    <ToolTemplateFrame {...props} content={content}>
      <ToolTemplateIntro content={content} />
      <CatalogShowcaseCardGrid {...props.showcase} />
      <CatalogSection id="showcase">
        <CatalogSectionHeading
          title={content.comparisons.title}
          description={content.comparisons.description}
        />
        <div className="mt-10">
          <CatalogMediaComparisonGrid
            items={items}
            sourceLabel={content.comparisons.sourceLabel}
            resultLabel={content.comparisons.resultLabel}
            usePromptLabel={content.comparisons.usePromptLabel}
            onUsePrompt={(item) => props.onUsePrompt(item.prompt)}
          />
        </div>
      </CatalogSection>
      <ToolTemplateGuidance content={content} />
      <ToolTemplateUseCases
        content={content}
        variant={
          archetype === 'image-to-video' || archetype === 'reference-to-video'
            ? 'banded'
            : 'compact'
        }
      />
      <CatalogLimitations {...content.limitations} />
    </ToolTemplateFrame>
  );
}

function ImageEditorToolTemplate(props: ToolDetailTemplateProps) {
  return <ComparisonToolTemplate {...props} archetype="image-editor" />;
}

function ImageToVideoToolTemplate(props: ToolDetailTemplateProps) {
  return <ComparisonToolTemplate {...props} archetype="image-to-video" />;
}

function ReferenceToVideoToolTemplate(props: ToolDetailTemplateProps) {
  return <ComparisonToolTemplate {...props} archetype="reference-to-video" />;
}

function BackgroundEditorToolTemplate(props: ToolDetailTemplateProps) {
  return <ComparisonToolTemplate {...props} archetype="background-editor" />;
}

type ToolTemplateRenderer = (props: ToolDetailTemplateProps) => ReactNode;

/** Code-owned registry: Catalog stores only the semantic archetype string. */
export const toolDetailTemplateRegistry = {
  'image-generator': ImageGeneratorToolTemplate,
  'image-editor': ImageEditorToolTemplate,
  'text-to-video': TextToVideoToolTemplate,
  'image-to-video': ImageToVideoToolTemplate,
  'reference-to-video': ReferenceToVideoToolTemplate,
  'background-editor': BackgroundEditorToolTemplate,
} satisfies Record<ToolArchetype, ToolTemplateRenderer>;

export function ToolDetailTemplate({
  archetype,
  ...props
}: ToolDetailTemplateProps & { archetype: ToolArchetype }) {
  if (props.content.template !== archetype) {
    throw new Error(
      `Tool template mismatch: ${props.content.template} !== ${archetype}`
    );
  }
  const Template = toolDetailTemplateRegistry[archetype];
  return <Template {...props} />;
}
