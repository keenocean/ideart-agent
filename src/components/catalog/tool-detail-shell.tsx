import type { ComponentProps } from 'react';

import {
  CatalogDetailShell,
  type CatalogDetailRelatedItem,
} from './catalog-detail-shell';

export type ToolDetailRelatedItem = CatalogDetailRelatedItem;

/** Compatibility adapter for existing tool templates. */
export function ToolDetailShell(
  props: Omit<
    ComponentProps<typeof CatalogDetailShell>,
    'directoryHref' | 'breadcrumbDirectoryLabel'
  > & { breadcrumbToolsLabel: string }
) {
  const { breadcrumbToolsLabel, ...shellProps } = props;
  return (
    <CatalogDetailShell
      {...shellProps}
      directoryHref="/tools"
      breadcrumbDirectoryLabel={breadcrumbToolsLabel}
    />
  );
}
