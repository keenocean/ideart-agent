import { catalogRouteSegment } from './paths';
import type { ToolDefinition } from './types';

const localePages = (slug: string) => ({
  en: { slug: catalogRouteSegment(slug), indexing: 'noindex' as const },
  zh: { slug: catalogRouteSegment(slug), indexing: 'noindex' as const },
});

export const toolCatalog = [
  {
    kind: 'tool',
    entityId: 'ai-image-generator',
    publication: 'listed',
    availability: 'live',
    localePages: localePages('ai-image-generator'),
    placement: {
      directoryOrder: 10,
      home: { featured: true, order: 10 },
    },
    related: ['ai-image-editor', 'gpt-image-2'],
    variant: {
      hero: 'centered',
      workbench: 'composer',
      examples: 'gallery',
      sections: ['workflow', 'prompt-guide', 'use-cases', 'limitations'],
    },
    execution: {
      kind: 'agent-preset',
      mediaMode: 'image',
      inputPolicy: { minimum: 0, maximum: 16, accepts: ['image'] },
    },
  },
  {
    kind: 'tool',
    entityId: 'ai-image-editor',
    publication: 'listed',
    availability: 'live',
    localePages: localePages('ai-image-editor'),
    placement: { directoryOrder: 20 },
    related: ['ai-image-generator', 'background-remover', 'gpt-image-2'],
    variant: {
      hero: 'split',
      workbench: 'upload-first',
      examples: 'comparison',
      sections: ['workflow', 'use-cases', 'limitations'],
    },
    execution: {
      kind: 'agent-preset',
      mediaMode: 'image',
      inputPolicy: { minimum: 1, maximum: 16, accepts: ['image'] },
    },
  },
  {
    kind: 'tool',
    entityId: 'text-to-video',
    publication: 'listed',
    availability: 'live',
    localePages: localePages('text-to-video'),
    placement: {
      directoryOrder: 30,
      home: { featured: true, order: 20 },
    },
    related: ['image-to-video', 'reference-to-video', 'minimax-h3'],
    variant: {
      hero: 'visual-first',
      workbench: 'composer',
      examples: 'gallery',
      sections: ['workflow', 'prompt-guide', 'use-cases', 'limitations'],
    },
    execution: {
      kind: 'agent-preset',
      mediaMode: 'video',
      inputPolicy: { minimum: 0, maximum: 2, accepts: ['image'] },
    },
  },
  {
    kind: 'tool',
    entityId: 'image-to-video',
    publication: 'listed',
    availability: 'live',
    localePages: localePages('image-to-video'),
    placement: {
      directoryOrder: 40,
      home: { featured: true, order: 30 },
    },
    related: ['text-to-video', 'reference-to-video', 'seedance-2-0'],
    variant: {
      hero: 'split',
      workbench: 'upload-first',
      examples: 'timeline',
      sections: ['workflow', 'prompt-guide', 'use-cases', 'limitations'],
    },
    execution: {
      kind: 'agent-preset',
      mediaMode: 'video',
      inputPolicy: { minimum: 1, maximum: 2, accepts: ['image'] },
    },
  },
  {
    kind: 'tool',
    entityId: 'reference-to-video',
    publication: 'listed',
    availability: 'live',
    localePages: localePages('reference-to-video'),
    placement: { directoryOrder: 50 },
    related: ['image-to-video', 'text-to-video', 'seedance-2-0'],
    variant: {
      hero: 'split',
      workbench: 'upload-first',
      examples: 'timeline',
      sections: ['capabilities', 'workflow', 'use-cases', 'limitations'],
    },
    execution: {
      kind: 'agent-preset',
      mediaMode: 'video',
      inputPolicy: {
        minimum: 1,
        maximum: 8,
        accepts: ['image', 'video', 'audio'],
      },
    },
  },
  {
    kind: 'tool',
    entityId: 'background-remover',
    publication: 'listed',
    availability: 'beta',
    localePages: localePages('background-remover'),
    placement: { directoryOrder: 60 },
    related: ['ai-image-editor', 'gpt-image-2'],
    variant: {
      hero: 'split',
      workbench: 'before-after',
      examples: 'comparison',
      sections: ['workflow', 'before-after', 'use-cases', 'limitations'],
    },
    execution: {
      kind: 'agent-preset',
      mediaMode: 'image',
      inputPolicy: { minimum: 1, maximum: 16, accepts: ['image'] },
    },
  },
] as const satisfies readonly ToolDefinition[];
