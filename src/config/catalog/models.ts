import { catalogRouteSegment } from './paths';
import type { ModelDefinition } from './types';

const localePages = (slug: string) => ({
  en: { slug: catalogRouteSegment(slug), indexing: 'noindex' as const },
  zh: { slug: catalogRouteSegment(slug), indexing: 'noindex' as const },
});

export const modelCatalog = [
  {
    kind: 'model',
    entityId: 'gpt-image-2',
    publication: 'listed',
    availability: 'live',
    modality: 'image',
    runtimeModelKey: 'gpt-image-2',
    localePages: localePages('gpt-image-2'),
    placement: {
      directoryOrder: 10,
      home: { featured: true, order: 10 },
    },
    related: ['ai-image-generator', 'ai-image-editor'],
    variant: {
      hero: 'visual-first',
      workbench: 'composer',
      examples: 'gallery',
      sections: ['model-specs', 'prompt-guide', 'use-cases', 'limitations'],
    },
  },
  {
    kind: 'model',
    entityId: 'minimax-h3',
    publication: 'listed',
    availability: 'live',
    modality: 'video',
    runtimeModelKey: 'minimax-h3',
    localePages: localePages('minimax-h3'),
    placement: {
      directoryOrder: 20,
      home: { featured: true, order: 20 },
    },
    related: ['text-to-video', 'image-to-video', 'seedance-2-5'],
    variant: {
      hero: 'visual-first',
      workbench: 'composer',
      examples: 'gallery',
      sections: ['model-specs', 'prompt-guide', 'use-cases', 'limitations'],
    },
  },
  {
    kind: 'model',
    entityId: 'seedance-2-5',
    publication: 'listed',
    availability: 'live',
    modality: 'video',
    runtimeModelKey: 'seedance-2-5',
    localePages: localePages('seedance-2-5'),
    placement: { directoryOrder: 30 },
    related: ['text-to-video', 'image-to-video', 'minimax-h3'],
    variant: {
      hero: 'split',
      workbench: 'composer',
      examples: 'gallery',
      sections: ['model-specs', 'comparison', 'use-cases', 'limitations'],
    },
  },
  {
    kind: 'model',
    entityId: 'seedance-2-0',
    publication: 'listed',
    availability: 'live',
    modality: 'video',
    runtimeModelKey: 'seedance-2-0',
    localePages: localePages('seedance-2-0'),
    placement: { directoryOrder: 40 },
    related: ['image-to-video', 'reference-to-video', 'seedance-2-5'],
    variant: {
      hero: 'split',
      workbench: 'upload-first',
      examples: 'timeline',
      sections: ['model-specs', 'prompt-guide', 'use-cases', 'limitations'],
    },
  },
] as const satisfies readonly ModelDefinition[];
