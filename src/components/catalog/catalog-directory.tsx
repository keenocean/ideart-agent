import { ArrowRight, Sparkles } from 'lucide-react';

import { Link } from '@/core/i18n/navigation';
import { CatalogSection } from '@/components/catalog/catalog-section';

export type CatalogDirectoryCard = {
  entityId: string;
  href: string;
  title: string;
  description: string;
  statusLabel: string;
  actionLabel: string;
};

export function CatalogDirectory({
  eyebrow,
  title,
  description,
  items,
  emptyText,
}: {
  eyebrow: string;
  title: string;
  description: string;
  items: readonly CatalogDirectoryCard[];
  emptyText: string;
}) {
  return (
    <CatalogSection>
      <header className="max-w-3xl">
        <p className="text-primary text-sm font-semibold tracking-[0.16em] uppercase">
          {eyebrow}
        </p>
        <h1 className="content-heading mt-4 text-4xl font-normal tracking-tight sm:text-5xl">
          {title}
        </h1>
        <p className="text-muted-foreground mt-5 max-w-2xl text-base leading-7 sm:text-lg">
          {description}
        </p>
      </header>

      {items.length ? (
        <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <article
              key={item.entityId}
              className="border-border bg-card flex min-h-72 flex-col rounded-3xl border p-6 shadow-sm"
            >
              <div className="flex items-center justify-between gap-4">
                <span className="bg-primary/10 text-primary flex size-10 items-center justify-center rounded-2xl">
                  <Sparkles aria-hidden="true" className="size-5" />
                </span>
                <span className="border-border text-muted-foreground rounded-full border px-3 py-1 text-xs font-medium">
                  {item.statusLabel}
                </span>
              </div>
              <h2 className="mt-7 text-xl font-semibold tracking-tight">
                {item.title}
              </h2>
              <p className="text-muted-foreground mt-3 flex-1 text-sm leading-6">
                {item.description}
              </p>
              <Link
                href={item.href}
                className="text-foreground mt-7 inline-flex items-center gap-2 text-sm font-semibold"
              >
                {item.actionLabel}
                <ArrowRight aria-hidden="true" className="size-4" />
              </Link>
            </article>
          ))}
        </div>
      ) : (
        <p className="border-border text-muted-foreground mt-12 rounded-3xl border border-dashed px-6 py-16 text-center">
          {emptyText}
        </p>
      )}
    </CatalogSection>
  );
}
