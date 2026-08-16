import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';
import {
  CatalogMedia,
  type CatalogMediaAsset,
} from '@/components/catalog/catalog-media';
import { CatalogSection } from '@/components/catalog/catalog-section';
import { CatalogSectionHeading } from '@/components/catalog/catalog-section-heading';

export type CatalogMediaFeatureItem = {
  id: string;
  title: string;
  description: string;
  eyebrow?: string;
  bullets?: readonly string[];
  icon?: ReactNode;
  media: CatalogMediaAsset;
  mediaPosition: 'left' | 'right';
};

export function CatalogMediaFeatureList({
  id,
  title,
  description,
  items,
  variant = 'compact',
}: {
  id?: string;
  title: string;
  description?: string;
  items: readonly CatalogMediaFeatureItem[];
  variant?: 'compact' | 'banded';
}) {
  return (
    <CatalogSection id={id} width={variant === 'banded' ? 'wide' : 'standard'}>
      <CatalogSectionHeading title={title} description={description} />
      <div className="mt-12">
        {items.map((item, index) => (
          <article
            key={item.id}
            className={cn(
              'grid items-center md:grid-cols-2',
              variant === 'banded'
                ? 'gap-10 md:gap-20 lg:gap-28'
                : 'gap-8 md:gap-14',
              index < items.length - 1 && 'mb-16 sm:mb-20 lg:mb-24'
            )}
          >
            <MediaFeatureMedia item={item} variant={variant} />
            <MediaFeatureCopy item={item} variant={variant} />
          </article>
        ))}
      </div>
    </CatalogSection>
  );
}

function MediaFeatureMedia({
  item,
  variant,
}: {
  item: CatalogMediaFeatureItem;
  variant: 'compact' | 'banded';
}) {
  return (
    <div
      className={cn(
        'border-border bg-muted order-1 overflow-hidden border shadow-sm',
        item.mediaPosition === 'right' && 'md:order-2',
        variant === 'banded'
          ? 'aspect-video rounded-[1.75rem] border-4'
          : 'aspect-[3/2] rounded-2xl'
      )}
    >
      <CatalogMedia asset={item.media} deferUntilVisible />
    </div>
  );
}

function MediaFeatureCopy({
  item,
  variant,
}: {
  item: CatalogMediaFeatureItem;
  variant: 'compact' | 'banded';
}) {
  return (
    <div
      className={cn('order-2', item.mediaPosition === 'right' && 'md:order-1')}
    >
      {(item.eyebrow || item.icon) && (
        <div className="text-primary flex items-center gap-3 text-xs font-semibold tracking-[0.14em] uppercase">
          {item.icon}
          {item.eyebrow && <span>{item.eyebrow}</span>}
        </div>
      )}
      <h3
        className={cn(
          'text-foreground content-heading font-normal tracking-[-0.02em] text-balance',
          (item.eyebrow || item.icon) && 'mt-6',
          variant === 'banded'
            ? 'text-2xl leading-[1.12] md:text-4xl lg:text-[2.75rem]'
            : 'text-xl leading-8 sm:text-2xl'
        )}
      >
        {item.title}
      </h3>
      <p
        className={cn(
          'text-muted-foreground mt-4 max-w-lg leading-relaxed',
          variant === 'banded' ? 'text-base' : 'text-sm sm:text-base'
        )}
      >
        {item.description}
      </p>
      {item.bullets && item.bullets.length > 0 && (
        <ul className="text-muted-foreground mt-5 space-y-2 text-sm leading-6">
          {item.bullets.map((bullet) => (
            <li key={bullet} className="flex gap-3">
              <span
                aria-hidden="true"
                className="bg-primary mt-2.5 size-1.5 shrink-0 rounded-full"
              />
              <span>{bullet}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
