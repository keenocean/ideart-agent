import { WandSparkles } from 'lucide-react';

import {
  CatalogMedia,
  type CatalogMediaAsset,
} from '@/components/catalog/catalog-media';

export type CatalogMediaComparisonItem = {
  id: string;
  title: string;
  description: string;
  prompt: string;
  source: CatalogMediaAsset;
  result: CatalogMediaAsset;
};

/** Side-by-side source/result evidence for editing and image-to-video tools. */
export function CatalogMediaComparisonGrid({
  items,
  sourceLabel,
  resultLabel,
  usePromptLabel,
  onUsePrompt,
}: {
  items: readonly CatalogMediaComparisonItem[];
  sourceLabel: string;
  resultLabel: string;
  usePromptLabel: string;
  onUsePrompt?: (item: CatalogMediaComparisonItem) => void;
}) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {items.map((item) => (
        <article
          key={item.id}
          className="border-border bg-card overflow-hidden rounded-3xl border"
        >
          <div className="bg-border grid grid-cols-2 gap-px">
            {[
              { label: sourceLabel, media: item.source },
              { label: resultLabel, media: item.result },
            ].map(({ label, media }, index) => (
              <figure
                key={`${item.id}-${index}`}
                className="bg-muted relative min-w-0"
              >
                <div
                  className="overflow-hidden"
                  style={{ aspectRatio: `${media.width} / ${media.height}` }}
                >
                  <CatalogMedia asset={media} deferUntilVisible />
                </div>
                <figcaption className="bg-background/85 text-foreground absolute top-3 left-3 rounded-full px-3 py-1 text-xs font-medium backdrop-blur-sm">
                  {label}
                </figcaption>
              </figure>
            ))}
          </div>
          <div className="p-5 sm:p-6">
            <h3 className="text-foreground text-lg font-semibold">
              {item.title}
            </h3>
            <p className="text-muted-foreground mt-2 text-sm leading-6">
              {item.description}
            </p>
            {onUsePrompt && (
              <button
                type="button"
                onClick={() => onUsePrompt(item)}
                className="text-primary focus-visible:ring-ring mt-5 inline-flex items-center gap-2 rounded-md text-sm font-semibold focus-visible:ring-2 focus-visible:outline-none"
              >
                <WandSparkles aria-hidden="true" className="size-4" />
                {usePromptLabel}
              </button>
            )}
          </div>
        </article>
      ))}
    </div>
  );
}
