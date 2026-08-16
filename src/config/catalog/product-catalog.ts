import { z } from 'zod';

import { VIDEO_GENERATION_KINDS } from '@/lib/agent-settings';

import modelCatalogSource from '../../../product/catalog/models.json';
import toolCatalogSource from '../../../product/catalog/tools.json';
import { legacyCatalogRoutes, type LegacyCatalogRoute } from './legacy-routes';
import { catalogRouteSegment } from './paths';
import type {
  CatalogDefinition,
  ModelDefinition,
  ToolDefinition,
} from './types';
import { validateCatalog } from './validate';

const routeSegmentSchema = z
  .string()
  .superRefine((value, context) => {
    try {
      catalogRouteSegment(value);
    } catch (error) {
      context.addIssue({
        code: 'custom',
        message:
          error instanceof Error ? error.message : 'Invalid Catalog segment',
      });
    }
  })
  .transform(catalogRouteSegment);

const localePageSchema = z.strictObject({
  slug: routeSegmentSchema,
  contentModifiedAt: z.string().optional(),
  indexing: z.enum(['index', 'noindex']).optional(),
});

const placementSchema = z.strictObject({
  directoryOrder: z.number().int().nonnegative(),
  home: z
    .strictObject({
      featured: z.literal(true),
      order: z.number().int().nonnegative(),
    })
    .optional(),
});

const inputPolicySchema = z.strictObject({
  minimum: z.number().int().nonnegative(),
  maximum: z.number().int().nonnegative().optional(),
  accepts: z.array(z.enum(['image', 'video', 'audio'])),
});

const commonDefinitionShape = {
  entityId: routeSegmentSchema,
  publication: z.enum(['listed', 'unlisted', 'hidden']),
  availability: z.enum(['live', 'beta', 'coming-soon']),
  localePages: z.record(z.string().min(1), localePageSchema).optional(),
  placement: placementSchema.optional(),
  related: z.array(routeSegmentSchema).optional(),
};

const toolDefinitionSchema = z.strictObject({
  ...commonDefinitionShape,
  kind: z.literal('tool'),
  archetype: z.enum([
    'image-generator',
    'image-editor',
    'text-to-video',
    'image-to-video',
    'reference-to-video',
    'background-editor',
  ]),
  execution: z.discriminatedUnion('mediaMode', [
    z.strictObject({
      kind: z.literal('agent-preset'),
      mediaMode: z.literal('image'),
      inputPolicy: inputPolicySchema,
    }),
    z.strictObject({
      kind: z.literal('agent-preset'),
      mediaMode: z.literal('video'),
      videoOperation: z.enum(VIDEO_GENERATION_KINDS),
      inputPolicy: inputPolicySchema.optional(),
    }),
  ]),
});

const detailPageVariantSchema = z.strictObject({
  hero: z.enum(['centered', 'split', 'visual-first']).optional(),
  workbench: z.enum(['composer', 'upload-first', 'before-after']).optional(),
  examples: z.enum(['gallery', 'comparison', 'timeline']).optional(),
  sections: z
    .array(
      z.enum([
        'capabilities',
        'workflow',
        'prompt-guide',
        'model-specs',
        'comparison',
        'before-after',
        'use-cases',
        'limitations',
      ])
    )
    .optional(),
});

const modelDefinitionSchema = z.strictObject({
  ...commonDefinitionShape,
  kind: z.literal('model'),
  modality: z.enum(['image', 'video']),
  runtimeModelKey: z.string().min(1),
  variant: detailPageVariantSchema.optional(),
});

const toolCatalogFileSchema = z.strictObject({
  schemaVersion: z.literal(1),
  tools: z.array(toolDefinitionSchema),
});
const modelCatalogFileSchema = z.strictObject({
  schemaVersion: z.literal(1),
  models: z.array(modelDefinitionSchema),
});

export type ProductCatalogSource = {
  tools: unknown;
  models: unknown;
};

export type ParsedProductCatalog = {
  tools: readonly ToolDefinition[];
  models: readonly ModelDefinition[];
};

/**
 * Product JSON is untrusted configuration. Zod owns its structural boundary;
 * validateCatalog owns cross-entry and executable-runtime invariants.
 */
export function parseProductCatalog(
  source: ProductCatalogSource,
  legacyRoutes: readonly LegacyCatalogRoute[] = []
): ParsedProductCatalog {
  const tools = toolCatalogFileSchema.parse(source.tools)
    .tools as ToolDefinition[];
  const models = modelCatalogFileSchema.parse(source.models)
    .models as ModelDefinition[];

  validateCatalog(
    [...tools, ...models] as readonly CatalogDefinition[],
    legacyRoutes
  );

  return { tools, models };
}

const parsedProductCatalog = parseProductCatalog(
  { tools: toolCatalogSource, models: modelCatalogSource },
  legacyCatalogRoutes
);

// Keep these exports deliberately wide: product JSON may be empty or replaced.
export const toolCatalog: readonly ToolDefinition[] =
  parsedProductCatalog.tools;
export const modelCatalog: readonly ModelDefinition[] =
  parsedProductCatalog.models;
