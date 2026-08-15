import type { ComponentType } from 'react';

export type CatalogDetailBlockProps = {
  entityId: string;
};

// Special cases stay in the project block layer. Catalog data may select an
// entity id, but it never stores a React component or arbitrary renderer.
export const catalogDetailBlockRegistry: Readonly<
  Partial<Record<string, ComponentType<CatalogDetailBlockProps>>>
> = {};
