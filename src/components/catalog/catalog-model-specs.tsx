import { CatalogSection } from './catalog-section';
import { CatalogSectionHeading } from './catalog-section-heading';

export type CatalogModelSpec = { label: string; value: string };

export function CatalogModelSpecs({
  title,
  description,
  items,
}: {
  title: string;
  description: string;
  items: readonly CatalogModelSpec[];
}) {
  return (
    <CatalogSection id="model-specs" width="narrow">
      <CatalogSectionHeading title={title} description={description} />
      <dl className="border-border bg-card mt-10 grid overflow-hidden rounded-3xl border sm:grid-cols-2">
        {items.map((item) => (
          <div
            key={item.label}
            className="border-border border-b p-5 last:border-b-0 sm:[&:nth-child(odd)]:border-r sm:[&:nth-last-child(-n+2)]:border-b-0"
          >
            <dt className="text-muted-foreground text-xs font-semibold tracking-[0.12em] uppercase">
              {item.label}
            </dt>
            <dd className="text-foreground mt-2 text-sm leading-6 font-medium">
              {item.value}
            </dd>
          </div>
        ))}
      </dl>
    </CatalogSection>
  );
}
