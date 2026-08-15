import type { MarketingAssetId } from '@/config/catalog/assets';
import type { AppLocale } from '@/config/locale';

export type ToolCopyItem = {
  title: string;
  description: string;
};

export type ToolPromptExample = ToolCopyItem & {
  prompt: string;
  media: {
    assetId: MarketingAssetId;
    alt: string;
  };
};

export type ToolMediaReference = {
  assetId: MarketingAssetId;
  alt: string;
};

export type ToolWorkflowShowcaseItem = ToolCopyItem & {
  id: string;
  prompt: string;
  media: readonly [ToolMediaReference, ToolMediaReference];
};

export type ToolModelShowcaseItem = ToolCopyItem & {
  id: string;
  runtimeModelKey: string;
  media: ToolMediaReference;
};

export type ToolFaqItem = {
  question: string;
  answer: string;
};

/**
 * Locale-owned, serializable marketing copy for one concrete tool page.
 * Execution limits and provider behavior remain in Runtime/Catalog sources.
 */
export type ToolPageContent = {
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
  inputOutput: {
    title: string;
    description: string;
    items: readonly ToolCopyItem[];
  };
  examples: {
    title: string;
    description: string;
    labels: {
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
    items: readonly ToolPromptExample[];
  };
  showcase: {
    workflows: {
      title: string;
      description: string;
      items: readonly ToolWorkflowShowcaseItem[];
    };
    models: {
      title: string;
      description: string;
      items: readonly ToolModelShowcaseItem[];
    };
  };
  videoInspiration: {
    title: string;
    description: string;
  };
  workflow: {
    title: string;
    description: string;
    items: readonly ToolCopyItem[];
  };
  features: {
    title: string;
    description: string;
    items: readonly ToolCopyItem[];
  };
  promptGuide: {
    title: string;
    description: string;
    items: readonly ToolCopyItem[];
  };
  useCases: {
    title: string;
    description: string;
    items: readonly ToolCopyItem[];
  };
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
