import { z } from 'zod';

import brandJson from '../../../product/brand.json';
import { parseProductFile } from './validation';

export const productBrandSchema = z
  .object({
    schemaVersion: z.literal(1),
    name: z.string().trim().min(1).max(80),
    description: z.string().trim().min(1).max(240),
    logo: z
      .string()
      .trim()
      .min(1)
      .max(2048)
      .refine(
        (value) => value.startsWith('/') || /^https:\/\//i.test(value),
        'must be a root-relative path or an HTTPS URL'
      ),
  })
  .strict();

export type ProductBrand = z.infer<typeof productBrandSchema>;

export function parseProductBrand(value: unknown): ProductBrand {
  return parseProductFile('product/brand.json', productBrandSchema, value);
}

export const productBrand = Object.freeze(parseProductBrand(brandJson));

export type ProductBrandEnv = Pick<
  ProductBrand,
  'name' | 'description' | 'logo'
>;

export function resolveProductBrandEnv(
  readEnv: (key: string) => string | undefined
): ProductBrandEnv {
  return {
    name: readEnv('VITE_APP_NAME') ?? productBrand.name,
    description: readEnv('VITE_APP_DESCRIPTION') ?? productBrand.description,
    logo: readEnv('VITE_APP_LOGO') ?? productBrand.logo,
  };
}
