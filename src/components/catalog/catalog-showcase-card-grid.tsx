import { ArrowUpRight } from 'lucide-react';

import { cn } from '@/lib/utils';
import {
  CatalogMedia,
  type CatalogMediaAsset,
} from '@/components/catalog/catalog-media';

export type CatalogWorkflowShowcaseItem = {
  id: string;
  title: string;
  description: string;
  prompt: string;
  media: readonly [CatalogMediaAsset, CatalogMediaAsset];
};

export type CatalogModelShowcaseItem = {
  id: string;
  runtimeModelKey: string;
  title: string;
  description: string;
  media: CatalogMediaAsset;
};

type ShowcaseGroup<TItem> = {
  title: string;
  description: string;
  items: readonly TItem[];
};

export function CatalogShowcaseCardGrid({
  workflows,
  models,
  onSelectWorkflow,
  onSelectModel,
}: {
  workflows: ShowcaseGroup<CatalogWorkflowShowcaseItem>;
  models: ShowcaseGroup<CatalogModelShowcaseItem>;
  onSelectWorkflow: (item: CatalogWorkflowShowcaseItem) => void;
  onSelectModel?: (item: CatalogModelShowcaseItem) => void;
}) {
  return (
    <section className="px-4 py-16 sm:px-6">
      <div className="mx-auto w-full max-w-6xl">
        <ShowcaseHeading
          title={workflows.title}
          description={workflows.description}
        />
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {workflows.items.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectWorkflow(item)}
              className="group focus-visible:ring-ring min-w-0 rounded-2xl text-left focus-visible:ring-2 focus-visible:ring-offset-4 focus-visible:outline-none"
            >
              <span className="border-border bg-muted group-hover:border-primary/40 grid aspect-[4/3] grid-cols-2 overflow-hidden rounded-2xl border transition-colors duration-150">
                {item.media.map((asset) => (
                  <span
                    key={asset.id}
                    className="bg-muted block min-w-0 overflow-hidden"
                  >
                    <CatalogMedia asset={asset} />
                  </span>
                ))}
              </span>
              <span className="text-foreground group-hover:text-primary mt-3 block text-sm leading-5 font-medium transition-colors duration-150">
                {item.title}
              </span>
              <span className="text-muted-foreground mt-1 block text-xs leading-[1.625]">
                {item.description}
              </span>
            </button>
          ))}
        </div>

        <div className="mt-16">
          <ShowcaseHeading
            title={models.title}
            description={models.description}
          />
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {models.items.map((item) => {
              const interactive = Boolean(onSelectModel);
              const className = cn(
                'border-border bg-card group min-w-0 overflow-hidden rounded-2xl border text-left transition duration-150',
                interactive &&
                  'hover:border-primary/40 focus-visible:ring-ring hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-offset-4 focus-visible:outline-none'
              );
              const content = (
                <>
                  <span className="bg-muted block aspect-video overflow-hidden">
                    <CatalogMedia
                      asset={item.media}
                      className="transition-transform duration-300 group-hover:scale-[1.025] motion-reduce:transition-none"
                    />
                  </span>
                  <span className="block p-4">
                    <span className="text-foreground flex items-center gap-1.5 text-sm font-semibold">
                      {item.title}
                      {interactive && (
                        <ArrowUpRight aria-hidden="true" className="size-3.5" />
                      )}
                    </span>
                    <span className="text-muted-foreground mt-1.5 block text-xs leading-relaxed">
                      {item.description}
                    </span>
                  </span>
                </>
              );

              return interactive ? (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onSelectModel?.(item)}
                  className={className}
                >
                  {content}
                </button>
              ) : (
                <article key={item.id} className={className}>
                  {content}
                </article>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

function ShowcaseHeading({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <header>
      <h2 className="text-foreground font-serif text-2xl leading-tight font-normal tracking-[-0.02em] sm:text-3xl">
        {title}
      </h2>
      <p className="text-muted-foreground mt-3 max-w-2xl text-sm leading-relaxed">
        {description}
      </p>
    </header>
  );
}
