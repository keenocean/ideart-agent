import type { AppLocale } from '@/config/locale';

export type ToolCopyItem = {
  title: string;
  description: string;
};

export type ToolPromptExample = ToolCopyItem & {
  prompt: string;
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
    items: readonly ToolPromptExample[];
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
