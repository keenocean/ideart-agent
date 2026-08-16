import { z } from 'zod';

import homeConfigSource from '../../product/home.json';

export const HOME_SCHEMA_VERSION = 2 as const;

export const HOME_SECTION_IDS = [
  'hero',
  'stats',
  'gallery',
  'features',
  'models',
  'pricing',
  'faq',
  'blog',
  'cta',
] as const;

const homeSectionSchema = z
  .object({
    id: z.enum(HOME_SECTION_IDS),
    enabled: z.boolean(),
  })
  .strict();

export const homeConfigSchema = z
  .object({
    schemaVersion: z.literal(HOME_SCHEMA_VERSION),
    sections: z
      .array(homeSectionSchema)
      .length(HOME_SECTION_IDS.length)
      .superRefine((sections, context) => {
        const seen = new Set<string>();

        for (const [index, section] of sections.entries()) {
          if (seen.has(section.id)) {
            context.addIssue({
              code: 'custom',
              message: `Duplicate home section: ${section.id}`,
              path: [index, 'id'],
            });
          }
          seen.add(section.id);
        }

        for (const sectionId of HOME_SECTION_IDS) {
          if (!seen.has(sectionId)) {
            context.addIssue({
              code: 'custom',
              message: `Missing home section: ${sectionId}`,
              path: [],
            });
          }
        }
      }),
    blogPostLimit: z.number().int().min(1).max(12),
  })
  .strict();

export type HomeSectionId = (typeof HOME_SECTION_IDS)[number];
export type HomeConfig = z.infer<typeof homeConfigSchema>;

export function parseHomeConfig(source: unknown): HomeConfig {
  return homeConfigSchema.parse(source);
}

export const homeConfig = parseHomeConfig(homeConfigSource);
