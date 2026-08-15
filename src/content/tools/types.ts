import type { MarketingAsset, ToolArchetype } from '@/config/catalog/types';
import type { AppLocale } from '@/config/locale';

export type ToolCopyItem = {
  title: string;
  description: string;
};

export type ToolCopySection = {
  title: string;
  description: string;
  items: readonly ToolCopyItem[];
};

/** Authoring reference stored in messages/marketing. Resolved during release build. */
export type ToolMediaSourceReference = {
  assetId: string;
  alt: string;
};

/** Route-local media payload. Pages never import the global asset inventory. */
export type ToolMediaReference = MarketingAsset & {
  alt: string;
};

export type ToolPromptExample<
  Media extends ToolMediaSourceReference | ToolMediaReference =
    ToolMediaReference,
> = ToolCopyItem & {
  prompt: string;
  media: Media;
};

export type ToolExampleLabels = {
  quickStart: string;
  image: string;
  video: string;
  prompt: string;
  download: string;
  previous: string;
  next: string;
  close: string;
  usePrompt: string;
  expand: string;
};

export type ToolPromptExamplesSection<
  Media extends ToolMediaSourceReference | ToolMediaReference =
    ToolMediaReference,
> = {
  title: string;
  description: string;
  labels: ToolExampleLabels;
  items: readonly ToolPromptExample<Media>[];
};

export type ToolComparisonExample<
  Media extends ToolMediaSourceReference | ToolMediaReference =
    ToolMediaReference,
> = ToolCopyItem & {
  id: string;
  prompt: string;
  source: Media;
  result: Media;
};

export type ToolComparisonSection<
  Media extends ToolMediaSourceReference | ToolMediaReference =
    ToolMediaReference,
> = {
  title: string;
  description: string;
  sourceLabel: string;
  resultLabel: string;
  usePromptLabel: string;
  items: readonly ToolComparisonExample<Media>[];
};

export type ToolUseCaseItem<
  Media extends ToolMediaSourceReference | ToolMediaReference =
    ToolMediaReference,
> = ToolCopyItem & {
  id: string;
  eyebrow?: string;
  bullets?: readonly string[];
  media: Media;
  mediaPosition?: 'left' | 'right';
};

export type ToolUseCasesSection<
  Media extends ToolMediaSourceReference | ToolMediaReference =
    ToolMediaReference,
> = {
  title: string;
  description: string;
  items: readonly ToolUseCaseItem<Media>[];
};

export type ToolWorkflowShowcaseItem<
  Media extends ToolMediaSourceReference | ToolMediaReference =
    ToolMediaReference,
> = ToolCopyItem & {
  id: string;
  entityId: string;
  prompt: string;
  media: readonly [Media, Media];
};

export type ToolModelShowcaseItem<
  Media extends ToolMediaSourceReference | ToolMediaReference =
    ToolMediaReference,
> = ToolCopyItem & {
  id: string;
  entityId: string;
  runtimeModelKey: string;
  media: Media;
};

export type ToolFaqItem = {
  question: string;
  answer: string;
};

type ToolPageCommonContent<
  Media extends ToolMediaSourceReference | ToolMediaReference,
> = {
  entityId: string;
  locale: AppLocale;
  seo: {
    title: string;
    description: string;
  };
  directory: {
    title: string;
    description: string;
  };
  hero: {
    eyebrow: string;
    title: string;
    description: string;
  };
  workbench: {
    title: string;
    description: string;
    placeholder: string;
  };
  inputOutput: ToolCopySection;
  showcase: {
    workflows: {
      title: string;
      description: string;
      items: readonly ToolWorkflowShowcaseItem<Media>[];
    };
    models: {
      title: string;
      description: string;
      items: readonly ToolModelShowcaseItem<Media>[];
    };
  };
  workflow: ToolCopySection;
  features: ToolCopySection;
  promptGuide: ToolCopySection;
  useCases: ToolUseCasesSection<Media>;
  limitations: {
    title: string;
    description: string;
    items: readonly string[];
  };
  faq: {
    title: string;
    items: readonly ToolFaqItem[];
  };
  cta: {
    title: string;
    description: string;
    primaryLabel: string;
    secondaryLabel: string;
  };
};

type GalleryToolArchetype = 'image-generator' | 'text-to-video';
type ComparisonToolArchetype = Exclude<ToolArchetype, GalleryToolArchetype>;

type ToolGalleryPageContent<
  A extends GalleryToolArchetype,
  Media extends ToolMediaSourceReference | ToolMediaReference,
> = ToolPageCommonContent<Media> & {
  /** Must match the semantic archetype registered in the Tool Catalog. */
  template: A;
  examples: ToolPromptExamplesSection<Media>;
};

type ToolComparisonPageContent<
  A extends ComparisonToolArchetype,
  Media extends ToolMediaSourceReference | ToolMediaReference,
> = ToolPageCommonContent<Media> & {
  /** Must match the semantic archetype registered in the Tool Catalog. */
  template: A;
  comparisons: ToolComparisonSection<Media>;
};

/**
 * Locale-owned, serializable marketing content for one concrete tool page.
 *
 * The discriminator selects one code-owned Block template. Content modules do
 * not choose React components or arbitrary section order. Execution limits and
 * provider behavior remain in Runtime/Catalog sources.
 */
export type ToolPageContentFor<
  A extends ToolArchetype,
  Media extends ToolMediaSourceReference | ToolMediaReference =
    ToolMediaReference,
> = A extends GalleryToolArchetype
  ? ToolGalleryPageContent<A, Media>
  : A extends ComparisonToolArchetype
    ? ToolComparisonPageContent<A, Media>
    : never;

export type ToolPageContentForMedia<
  Media extends ToolMediaSourceReference | ToolMediaReference,
> = {
  [A in ToolArchetype]: ToolPageContentFor<A, Media>;
}[ToolArchetype];

/** JSON authoring contract before media is embedded into an immutable release. */
export type ToolPageSourceContent =
  ToolPageContentForMedia<ToolMediaSourceReference>;

/** Runtime page contract after every media reference is page-local. */
export type ToolPageContent = ToolPageContentForMedia<ToolMediaReference>;
