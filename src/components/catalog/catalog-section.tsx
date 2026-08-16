import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

export type CatalogSectionWidth = 'narrow' | 'standard' | 'wide';
export type CatalogSectionSurface = 'plain' | 'muted';

const widthClasses: Record<CatalogSectionWidth, string> = {
  narrow: 'max-w-5xl',
  standard: 'max-w-6xl',
  wide: 'max-w-7xl',
};

/**
 * Shared visual frame for homepage, directory, tool, and future model sections.
 * Blocks choose only a named width/surface; spacing and theme-token usage stay
 * consistent across page families.
 */
export function CatalogSection({
  id,
  width = 'standard',
  surface = 'plain',
  className,
  containerClassName,
  children,
}: {
  id?: string;
  width?: CatalogSectionWidth;
  surface?: CatalogSectionSurface;
  className?: string;
  containerClassName?: string;
  children: ReactNode;
}) {
  return (
    <section
      id={id}
      className={cn(
        'scroll-mt-20 px-4 py-16 sm:px-6',
        surface === 'muted' && 'bg-muted/35 border-border border-y',
        className
      )}
    >
      <div
        className={cn(
          'mx-auto w-full',
          widthClasses[width],
          containerClassName
        )}
      >
        {children}
      </div>
    </section>
  );
}
