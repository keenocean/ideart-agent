import type { MarketingAsset } from '@/config/catalog/types';
import type { AppLocale } from '@/config/locale';

export type ModelMediaSourceReference = { assetId: string; alt: string };
export type ModelMediaReference = MarketingAsset & { alt: string };

export type ModelCopyItem = { title: string; description: string };
export type ModelCopySection = {
  title: string;
  description: string;
  items: readonly ModelCopyItem[];
};

export type ModelPageContentForMedia<
  Media extends ModelMediaSourceReference | ModelMediaReference,
> = {
  entityId: string;
  locale: AppLocale;
  template: 'image-model' | 'video-model';
  seo: { title: string; description: string };
  directory: { title: string; description: string };
  hero: { eyebrow: string; title: string; description: string };
  workbench: { title: string; description: string; placeholder: string };
  specs: {
    title: string;
    description: string;
    labels: {
      modality: string;
      duration: string;
      resolutions: string;
      aspectRatios: string;
      audio: string;
      referenceImages: string;
      enabled: string;
      disabled: string;
      image: string;
      video: string;
      notApplicable: string;
    };
  };
  examples: {
    title: string;
    description: string;
    disclosure: string;
    labels: {
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
    items: readonly (ModelCopyItem & {
      id: string;
      prompt: string;
      media: Media;
    })[];
  };
  capabilities: ModelCopySection;
  workflows: ModelCopySection;
  promptGuide: ModelCopySection;
  useCases: {
    title: string;
    description: string;
    items: readonly (ModelCopyItem & {
      id: string;
      eyebrow?: string;
      bullets?: readonly string[];
      media: Media;
      mediaPosition?: 'left' | 'right';
    })[];
  };
  comparison: {
    title: string;
    description: string;
    modelLabel: string;
    relatedModelIds: readonly string[];
  };
  limitations: {
    title: string;
    description: string;
    items: readonly string[];
  };
  faq: {
    title: string;
    items: readonly { question: string; answer: string }[];
  };
  cta: {
    title: string;
    description: string;
    primaryLabel: string;
    secondaryLabel: string;
  };
};

export type ModelPageSourceContent =
  ModelPageContentForMedia<ModelMediaSourceReference>;
export type ModelPageContent = ModelPageContentForMedia<ModelMediaReference>;
