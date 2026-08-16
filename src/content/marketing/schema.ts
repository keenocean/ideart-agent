import { z } from 'zod';

import type { MarketingAsset } from '@/config/catalog/types';
import type { AppLocale } from '@/config/locale';

import type { ModelDirectoryItem } from '../models/listing';
import type { ModelPageContent, ModelPageSourceContent } from '../models/types';
import type { ToolDirectoryItem } from '../tools/listing';
import type { ToolPageContent, ToolPageSourceContent } from '../tools/types';

export const MARKETING_CONTENT_SCHEMA_VERSION = 1 as const;
export const MARKETING_CONTENT_RELEASE_PREFIX = 'marketing-content/releases';
export const MAX_MARKETING_MANIFEST_BYTES = 2 * 1024 * 1024;
export const MAX_MARKETING_PAGE_BYTES = 2 * 1024 * 1024;
export const MAX_MARKETING_DIRECTORY_BYTES = 512 * 1024;
export const MAX_MARKETING_PROJECTION_BYTES = 512 * 1024;

const nonEmpty = z.string().trim().min(1);
const localeSchema = z.string().regex(/^[a-z]{2}(?:-[A-Z]{2})?$/);
const routeSegmentSchema = z
  .string()
  .regex(/^[a-z0-9](?:[a-z0-9-]{0,126}[a-z0-9])?$/);
const sha256Schema = z.string().regex(/^[a-f0-9]{64}$/);
const positiveInteger = z.number().int().positive();
const imageMimeTypeSchema = z.custom<`image/${string}`>(
  (value) => typeof value === 'string' && /^image\/[a-z0-9.+-]+$/i.test(value)
);
const videoMimeTypeSchema = z.custom<`video/${string}`>(
  (value) => typeof value === 'string' && /^video\/[a-z0-9.+-]+$/i.test(value)
);

const imageAssetSchema = z
  .object({
    id: routeSegmentSchema,
    kind: z.literal('image'),
    url: z.string().url(),
    mimeType: imageMimeTypeSchema,
    width: positiveInteger,
    height: positiveInteger,
    bytes: positiveInteger,
  })
  .strict();

const videoAssetSourceSchema = z
  .object({
    id: routeSegmentSchema,
    kind: z.literal('video'),
    url: z.string().url(),
    mimeType: videoMimeTypeSchema,
    width: positiveInteger,
    height: positiveInteger,
    bytes: positiveInteger,
    posterAssetId: routeSegmentSchema,
  })
  .strict();

const videoAssetSchema = z
  .object({
    id: routeSegmentSchema,
    kind: z.literal('video'),
    url: z.string().url(),
    mimeType: videoMimeTypeSchema,
    width: positiveInteger,
    height: positiveInteger,
    bytes: positiveInteger,
    poster: imageAssetSchema,
  })
  .strict();

export const marketingAssetSchema = z.discriminatedUnion('kind', [
  imageAssetSchema,
  videoAssetSchema,
]);

export const marketingAssetsSourceSchema = z
  .object({
    schemaVersion: z.literal(MARKETING_CONTENT_SCHEMA_VERSION),
    publicDomain: z.string().url(),
    assets: z
      .array(
        z.discriminatedUnion('kind', [imageAssetSchema, videoAssetSourceSchema])
      )
      .min(1),
  })
  .strict();

const sourceMediaSchema = z
  .object({ assetId: routeSegmentSchema, alt: nonEmpty })
  .strict();
const resolvedMediaSchema = z.union([
  imageAssetSchema.extend({ alt: nonEmpty }).strict(),
  videoAssetSchema.extend({ alt: nonEmpty }).strict(),
]);
const resolvedImageMediaSchema = imageAssetSchema
  .extend({ alt: nonEmpty })
  .strict();

const copyItemSchema = z
  .object({ title: nonEmpty, description: nonEmpty })
  .strict();
const copySectionSchema = z
  .object({
    title: nonEmpty,
    description: nonEmpty,
    items: z.array(copyItemSchema).min(1),
  })
  .strict();

function toolContentSchema(
  mediaSchema: typeof sourceMediaSchema | typeof resolvedMediaSchema
) {
  const promptExampleSchema = copyItemSchema
    .extend({ prompt: nonEmpty, media: mediaSchema })
    .strict();
  const comparisonSchema = copyItemSchema
    .extend({
      id: routeSegmentSchema,
      prompt: nonEmpty,
      source: mediaSchema,
      result: mediaSchema,
    })
    .strict();
  const useCaseSchema = copyItemSchema
    .extend({
      id: routeSegmentSchema,
      eyebrow: nonEmpty.optional(),
      bullets: z.array(nonEmpty).min(1).optional(),
      media: mediaSchema,
      mediaPosition: z.enum(['left', 'right']).optional(),
    })
    .strict();
  const workflowShowcaseSchema = copyItemSchema
    .extend({
      id: routeSegmentSchema,
      entityId: routeSegmentSchema,
      prompt: nonEmpty,
      media: z.tuple([mediaSchema, mediaSchema]),
    })
    .strict();
  const modelShowcaseSchema = copyItemSchema
    .extend({
      id: routeSegmentSchema,
      entityId: routeSegmentSchema,
      runtimeModelKey: nonEmpty,
      media: mediaSchema,
    })
    .strict();
  const common = {
    entityId: routeSegmentSchema,
    locale: localeSchema,
    seo: z.object({ title: nonEmpty, description: nonEmpty }).strict(),
    directory: z.object({ title: nonEmpty, description: nonEmpty }).strict(),
    hero: z
      .object({ eyebrow: nonEmpty, title: nonEmpty, description: nonEmpty })
      .strict(),
    workbench: z
      .object({ title: nonEmpty, description: nonEmpty, placeholder: nonEmpty })
      .strict(),
    inputOutput: copySectionSchema,
    showcase: z
      .object({
        workflows: z
          .object({
            title: nonEmpty,
            description: nonEmpty,
            items: z.array(workflowShowcaseSchema),
          })
          .strict(),
        models: z
          .object({
            title: nonEmpty,
            description: nonEmpty,
            items: z.array(modelShowcaseSchema),
          })
          .strict(),
      })
      .strict(),
    workflow: copySectionSchema,
    features: copySectionSchema,
    promptGuide: copySectionSchema,
    useCases: z
      .object({
        title: nonEmpty,
        description: nonEmpty,
        items: z.array(useCaseSchema).min(1),
      })
      .strict(),
    limitations: z
      .object({
        title: nonEmpty,
        description: nonEmpty,
        items: z.array(nonEmpty).min(1),
      })
      .strict(),
    faq: z
      .object({
        title: nonEmpty,
        items: z
          .array(z.object({ question: nonEmpty, answer: nonEmpty }).strict())
          .min(1),
      })
      .strict(),
    cta: z
      .object({
        title: nonEmpty,
        description: nonEmpty,
        primaryLabel: nonEmpty,
        secondaryLabel: nonEmpty,
      })
      .strict(),
  };
  const gallery = z
    .object({
      ...common,
      template: z.enum(['image-generator', 'text-to-video']),
      examples: z
        .object({
          title: nonEmpty,
          description: nonEmpty,
          labels: z
            .object({
              quickStart: nonEmpty,
              image: nonEmpty,
              video: nonEmpty,
              prompt: nonEmpty,
              download: nonEmpty,
              previous: nonEmpty,
              next: nonEmpty,
              close: nonEmpty,
              usePrompt: nonEmpty,
              expand: nonEmpty,
            })
            .strict(),
          items: z.array(promptExampleSchema).min(1),
        })
        .strict(),
    })
    .strict();
  const comparison = z
    .object({
      ...common,
      template: z.enum([
        'image-editor',
        'image-to-video',
        'reference-to-video',
        'background-editor',
      ]),
      comparisons: z
        .object({
          title: nonEmpty,
          description: nonEmpty,
          sourceLabel: nonEmpty,
          resultLabel: nonEmpty,
          usePromptLabel: nonEmpty,
          items: z.array(comparisonSchema).min(1),
        })
        .strict(),
    })
    .strict();
  return z.union([gallery, comparison]);
}

export const toolPageSourceContentSchema = toolContentSchema(sourceMediaSchema);
export const toolPageContentSchema = toolContentSchema(resolvedMediaSchema);

function modelContentSchema(
  mediaSchema: typeof sourceMediaSchema | typeof resolvedMediaSchema
) {
  const labels = z
    .object({
      modality: nonEmpty,
      duration: nonEmpty,
      resolutions: nonEmpty,
      aspectRatios: nonEmpty,
      audio: nonEmpty,
      referenceImages: nonEmpty,
      enabled: nonEmpty,
      disabled: nonEmpty,
      image: nonEmpty,
      video: nonEmpty,
      notApplicable: nonEmpty,
    })
    .strict();
  const previewLabels = z
    .object({
      image: nonEmpty,
      video: nonEmpty,
      prompt: nonEmpty,
      download: nonEmpty,
      previous: nonEmpty,
      next: nonEmpty,
      close: nonEmpty,
      usePrompt: nonEmpty,
      expand: nonEmpty,
    })
    .strict();
  const useCase = copyItemSchema
    .extend({
      id: routeSegmentSchema,
      eyebrow: nonEmpty.optional(),
      bullets: z.array(nonEmpty).min(1).optional(),
      media: mediaSchema,
      mediaPosition: z.enum(['left', 'right']).optional(),
    })
    .strict();
  return z
    .object({
      entityId: routeSegmentSchema,
      locale: localeSchema,
      template: z.enum(['image-model', 'video-model']),
      seo: z.object({ title: nonEmpty, description: nonEmpty }).strict(),
      directory: z.object({ title: nonEmpty, description: nonEmpty }).strict(),
      hero: z
        .object({ eyebrow: nonEmpty, title: nonEmpty, description: nonEmpty })
        .strict(),
      workbench: z
        .object({
          title: nonEmpty,
          description: nonEmpty,
          placeholder: nonEmpty,
        })
        .strict(),
      specs: z
        .object({ title: nonEmpty, description: nonEmpty, labels })
        .strict(),
      examples: z
        .object({
          title: nonEmpty,
          description: nonEmpty,
          disclosure: nonEmpty,
          labels: previewLabels,
          items: z
            .array(
              copyItemSchema
                .extend({
                  id: routeSegmentSchema,
                  prompt: nonEmpty,
                  media: mediaSchema,
                })
                .strict()
            )
            .min(1),
        })
        .strict(),
      capabilities: copySectionSchema,
      workflows: copySectionSchema,
      promptGuide: copySectionSchema,
      useCases: z
        .object({
          title: nonEmpty,
          description: nonEmpty,
          items: z.array(useCase).min(1),
        })
        .strict(),
      comparison: z
        .object({
          title: nonEmpty,
          description: nonEmpty,
          modelLabel: nonEmpty,
          relatedModelIds: z.array(routeSegmentSchema),
        })
        .strict(),
      limitations: z
        .object({
          title: nonEmpty,
          description: nonEmpty,
          items: z.array(nonEmpty).min(1),
        })
        .strict(),
      faq: z
        .object({
          title: nonEmpty,
          items: z
            .array(z.object({ question: nonEmpty, answer: nonEmpty }).strict())
            .min(1),
        })
        .strict(),
      cta: z
        .object({
          title: nonEmpty,
          description: nonEmpty,
          primaryLabel: nonEmpty,
          secondaryLabel: nonEmpty,
        })
        .strict(),
    })
    .strict();
}

export const modelPageSourceContentSchema =
  modelContentSchema(sourceMediaSchema);
export const modelPageContentSchema = modelContentSchema(resolvedMediaSchema);

export const toolPageSourceFileSchema = z
  .object({
    schemaVersion: z.literal(MARKETING_CONTENT_SCHEMA_VERSION),
    contentModifiedAt: z.string().date(),
    content: toolPageSourceContentSchema,
  })
  .strict();

export const toolPageReleaseObjectSchema = z
  .object({
    schemaVersion: z.literal(MARKETING_CONTENT_SCHEMA_VERSION),
    kind: z.literal('tool'),
    entityId: routeSegmentSchema,
    locale: localeSchema,
    contentModifiedAt: z.string().date(),
    content: toolPageContentSchema,
  })
  .strict();

export const modelPageSourceFileSchema = z
  .object({
    schemaVersion: z.literal(MARKETING_CONTENT_SCHEMA_VERSION),
    contentModifiedAt: z.string().date(),
    content: modelPageSourceContentSchema,
  })
  .strict();

export const modelPageReleaseObjectSchema = z
  .object({
    schemaVersion: z.literal(MARKETING_CONTENT_SCHEMA_VERSION),
    kind: z.literal('model'),
    entityId: routeSegmentSchema,
    locale: localeSchema,
    contentModifiedAt: z.string().date(),
    content: modelPageContentSchema,
  })
  .strict();

export const directorySourceFileSchema = z
  .object({
    schemaVersion: z.literal(MARKETING_CONTENT_SCHEMA_VERSION),
    seo: z.object({ title: nonEmpty, description: nonEmpty }).strict(),
    hero: z.object({ title: nonEmpty, description: nonEmpty }).strict(),
  })
  .strict();

const directoryItemSchema = z
  .object({
    entityId: routeSegmentSchema,
    href: z.string().startsWith('/'),
    title: nonEmpty,
    description: nonEmpty,
    availability: z.enum(['live', 'beta', 'coming-soon']),
  })
  .strict();

export const toolDirectoryReleaseObjectSchema = z
  .object({
    schemaVersion: z.literal(MARKETING_CONTENT_SCHEMA_VERSION),
    kind: z.literal('tools'),
    locale: localeSchema,
    seo: z.object({ title: nonEmpty, description: nonEmpty }).strict(),
    hero: z.object({ title: nonEmpty, description: nonEmpty }).strict(),
    items: z.array(directoryItemSchema),
  })
  .strict();

export const modelDirectoryReleaseObjectSchema = z
  .object({
    schemaVersion: z.literal(MARKETING_CONTENT_SCHEMA_VERSION),
    kind: z.literal('models'),
    locale: localeSchema,
    seo: z.object({ title: nonEmpty, description: nonEmpty }).strict(),
    hero: z.object({ title: nonEmpty, description: nonEmpty }).strict(),
    items: z.array(directoryItemSchema),
  })
  .strict();

const homeToolCardSchema = z
  .object({
    id: routeSegmentSchema,
    entityId: routeSegmentSchema,
    href: z.string().startsWith('/'),
    title: nonEmpty,
    description: nonEmpty,
    media: z.tuple([resolvedMediaSchema, resolvedMediaSchema]),
  })
  .strict();

const homeModelCardSchema = z
  .object({
    id: routeSegmentSchema,
    entityId: routeSegmentSchema,
    href: z.string().startsWith('/'),
    title: nonEmpty,
    description: nonEmpty,
    media: resolvedMediaSchema,
  })
  .strict();

export const homeProjectionReleaseObjectSchema = z
  .object({
    schemaVersion: z.literal(MARKETING_CONTENT_SCHEMA_VERSION),
    kind: z.literal('home'),
    locale: localeSchema,
    media: z
      .object({
        hero: resolvedMediaSchema,
        og: resolvedImageMediaSchema,
        marquee: z.array(resolvedImageMediaSchema).length(8),
        examples: z.array(resolvedMediaSchema).length(8),
        useCases: z.array(resolvedMediaSchema).length(3),
      })
      .strict(),
    featured: z
      .object({
        tools: z.array(homeToolCardSchema),
        models: z.array(homeModelCardSchema),
      })
      .strict(),
  })
  .strict();

const manifestObjectFields = {
  bytes: positiveInteger,
  sha256: sha256Schema,
};

export const marketingContentManifestSchema = z
  .object({
    schemaVersion: z.literal(MARKETING_CONTENT_SCHEMA_VERSION),
    releaseId: sha256Schema,
    sourceSha256: sha256Schema,
    pages: z.array(
      z
        .object({
          kind: z.enum(['tool', 'model']),
          entityId: routeSegmentSchema,
          locale: localeSchema,
          contentModifiedAt: z.string().date(),
          ...manifestObjectFields,
        })
        .strict()
    ),
    directories: z.array(
      z
        .object({
          kind: z.enum(['tools', 'models']),
          locale: localeSchema,
          itemCount: z.number().int().nonnegative(),
          ...manifestObjectFields,
        })
        .strict()
    ),
    projections: z.array(
      z
        .object({
          kind: z.literal('home'),
          locale: localeSchema,
          ...manifestObjectFields,
        })
        .strict()
    ),
  })
  .strict();

export type MarketingAssetsSource = z.infer<typeof marketingAssetsSourceSchema>;
export type ToolPageSourceFile = {
  schemaVersion: typeof MARKETING_CONTENT_SCHEMA_VERSION;
  contentModifiedAt: string;
  content: ToolPageSourceContent;
};
export type ToolPageReleaseObject = {
  schemaVersion: typeof MARKETING_CONTENT_SCHEMA_VERSION;
  kind: 'tool';
  entityId: string;
  locale: AppLocale;
  contentModifiedAt: string;
  content: ToolPageContent;
};
export type ToolDirectoryReleaseObject = {
  schemaVersion: typeof MARKETING_CONTENT_SCHEMA_VERSION;
  kind: 'tools';
  locale: AppLocale;
  seo: { title: string; description: string };
  hero: { title: string; description: string };
  items: ToolDirectoryItem[];
};
export type ModelPageSourceFile = {
  schemaVersion: typeof MARKETING_CONTENT_SCHEMA_VERSION;
  contentModifiedAt: string;
  content: ModelPageSourceContent;
};
export type ModelPageReleaseObject = {
  schemaVersion: typeof MARKETING_CONTENT_SCHEMA_VERSION;
  kind: 'model';
  entityId: string;
  locale: AppLocale;
  contentModifiedAt: string;
  content: ModelPageContent;
};
export type ModelDirectoryReleaseObject = {
  schemaVersion: typeof MARKETING_CONTENT_SCHEMA_VERSION;
  kind: 'models';
  locale: AppLocale;
  seo: { title: string; description: string };
  hero: { title: string; description: string };
  items: ModelDirectoryItem[];
};
export type HomeProjectionReleaseObject = z.infer<
  typeof homeProjectionReleaseObjectSchema
>;
export type MarketingContentManifest = z.infer<
  typeof marketingContentManifestSchema
>;

export function parseMarketingAsset(value: unknown): MarketingAsset {
  return marketingAssetSchema.parse(value) as MarketingAsset;
}

export function parseToolPageSourceFile(value: unknown): ToolPageSourceFile {
  return toolPageSourceFileSchema.parse(value) as ToolPageSourceFile;
}

export function parseToolPageReleaseObject(
  value: unknown
): ToolPageReleaseObject {
  return toolPageReleaseObjectSchema.parse(value) as ToolPageReleaseObject;
}

export function parseModelPageSourceFile(value: unknown): ModelPageSourceFile {
  return modelPageSourceFileSchema.parse(value) as ModelPageSourceFile;
}

export function parseModelPageReleaseObject(
  value: unknown
): ModelPageReleaseObject {
  return modelPageReleaseObjectSchema.parse(value) as ModelPageReleaseObject;
}

export function parseToolDirectoryReleaseObject(
  value: unknown
): ToolDirectoryReleaseObject {
  return toolDirectoryReleaseObjectSchema.parse(
    value
  ) as ToolDirectoryReleaseObject;
}

export function parseModelDirectoryReleaseObject(
  value: unknown
): ModelDirectoryReleaseObject {
  return modelDirectoryReleaseObjectSchema.parse(
    value
  ) as ModelDirectoryReleaseObject;
}

export function parseHomeProjectionReleaseObject(
  value: unknown
): HomeProjectionReleaseObject {
  return homeProjectionReleaseObjectSchema.parse(
    value
  ) as HomeProjectionReleaseObject;
}
