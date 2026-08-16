import { ArrowUpRight } from 'lucide-react';

import { Link } from '@/core/i18n/navigation';
import {
  CatalogMedia,
  type CatalogMediaAsset,
} from '@/components/catalog/catalog-media';
import { CatalogSection } from '@/components/catalog/catalog-section';

export type CatalogWorkflowShowcaseItem = {
  id: string;
  href: string;
  title: string;
  description: string;
  media: readonly [CatalogMediaAsset, CatalogMediaAsset];
};

export type CatalogModelShowcaseItem = {
  id: string;
  href: string;
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
}: {
  workflows: ShowcaseGroup<CatalogWorkflowShowcaseItem>;
  models: ShowcaseGroup<CatalogModelShowcaseItem>;
}) {
  const hasWorkflows = workflows.items.length > 0;
  const hasModels = models.items.length > 0;
  if (!hasWorkflows && !hasModels) return null;

  return (
    <CatalogSection>
      {hasWorkflows && (
        <div>
          <ShowcaseHeading
            title={workflows.title}
            description={workflows.description}
          />
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {workflows.items.map((item) => (
              <Link
                key={item.id}
                href={item.href}
                className="group focus-visible:ring-ring min-w-0 rounded-2xl text-left focus-visible:ring-2 focus-visible:ring-offset-4 focus-visible:outline-none"
              >
                <span className="border-border bg-muted group-hover:border-primary/40 grid aspect-[4/3] grid-cols-2 overflow-hidden rounded-2xl border transition-colors duration-150">
                  {item.media.map((asset) => (
                    <span
                      key={asset.id}
                      className="bg-muted block min-w-0 overflow-hidden"
                    >
                      <CatalogMedia asset={asset} deferUntilVisible />
                    </span>
                  ))}
                </span>
                <span className="text-foreground group-hover:text-primary mt-3 flex items-center gap-1.5 text-sm leading-5 font-medium transition-colors duration-150">
                  {item.title}
                  <ArrowUpRight aria-hidden="true" className="size-3.5" />
                </span>
                <span className="text-muted-foreground mt-1 block text-xs leading-[1.625]">
                  {item.description}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {hasModels && (
        <div className={hasWorkflows ? 'mt-16' : undefined}>
          <ShowcaseHeading
            title={models.title}
            description={models.description}
          />
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {models.items.map((item) => (
              <Link
                key={item.id}
                href={item.href}
                className="border-border bg-card group hover:border-primary/40 focus-visible:ring-ring min-w-0 overflow-hidden rounded-2xl border text-left transition duration-150 hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-offset-4 focus-visible:outline-none"
              >
                <span className="bg-muted block aspect-video overflow-hidden">
                  <CatalogMedia
                    asset={item.media}
                    deferUntilVisible
                    className="transition-transform duration-300 group-hover:scale-[1.025] motion-reduce:transition-none"
                  />
                </span>
                <span className="block p-4">
                  <span className="text-foreground flex items-center gap-1.5 text-sm font-semibold">
                    {item.title}
                    <ArrowUpRight aria-hidden="true" className="size-3.5" />
                  </span>
                  <span className="text-muted-foreground mt-1.5 block text-xs leading-relaxed">
                    {item.description}
                  </span>
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </CatalogSection>
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
      <h2 className="text-foreground content-heading text-2xl leading-tight font-normal tracking-[-0.02em] sm:text-3xl">
        {title}
      </h2>
      <p className="text-muted-foreground mt-3 max-w-2xl text-sm leading-relaxed">
        {description}
      </p>
    </header>
  );
}
