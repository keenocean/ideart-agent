import { useState } from 'react';
import { Pause, Play } from 'lucide-react';

import type { MarketingImageAsset } from '@/config/catalog/types';
import { cn } from '@/lib/utils';
import { CatalogMedia } from '@/components/catalog/catalog-media';

export type CatalogMediaMarqueeItem = MarketingImageAsset & {
  alt: string;
};

export function CatalogMediaMarquee({
  items,
  label,
  pauseLabel,
  playLabel,
  className,
  priorityCount = 3,
}: {
  items: readonly CatalogMediaMarqueeItem[];
  label: string;
  pauseLabel: string;
  playLabel: string;
  className?: string;
  priorityCount?: number;
}) {
  const [paused, setPaused] = useState(false);

  if (items.length === 0) return null;

  return (
    <div
      data-media-marquee
      data-paused={paused}
      role="region"
      aria-label={label}
      className={cn(
        'catalog-media-marquee relative left-1/2 w-screen -translate-x-1/2 overflow-hidden py-2',
        className
      )}
    >
      <div className="catalog-media-marquee-track flex w-max">
        {[false, true].map((duplicate) => (
          <div
            key={duplicate ? 'duplicate' : 'primary'}
            aria-hidden={duplicate || undefined}
            className="flex shrink-0 gap-3 pr-3 sm:gap-5 sm:pr-5"
          >
            {items.map((item, index) => {
              const priority = !duplicate && index < priorityCount;
              return (
                <figure
                  key={`${duplicate ? 'duplicate' : 'primary'}-${item.id}`}
                  className="border-border bg-muted relative aspect-[9/16] w-[clamp(9rem,15vw,19rem)] shrink-0 overflow-hidden rounded-[1.35rem] border shadow-sm sm:rounded-[1.75rem]"
                >
                  <CatalogMedia
                    asset={duplicate ? { ...item, alt: '' } : item}
                    priority={priority}
                    deferUntilVisible={!priority}
                    className="text-transparent"
                  />
                </figure>
              );
            })}
          </div>
        ))}
      </div>

      {items.length > 1 && (
        <button
          type="button"
          onClick={() => setPaused((current) => !current)}
          aria-label={paused ? playLabel : pauseLabel}
          aria-pressed={paused}
          className="border-border bg-background/85 text-foreground focus-visible:ring-ring hover:bg-background absolute top-5 right-4 z-10 flex size-10 items-center justify-center rounded-full border shadow-sm backdrop-blur-md transition-colors focus-visible:ring-2 focus-visible:outline-none sm:right-6"
        >
          {paused ? (
            <Play aria-hidden="true" className="ml-0.5 size-3.5 fill-current" />
          ) : (
            <Pause aria-hidden="true" className="size-3.5 fill-current" />
          )}
        </button>
      )}
    </div>
  );
}
