import type { ReactNode } from 'react';
import { ArrowRight } from 'lucide-react';

import { Link } from '@/core/i18n/navigation';
import {
  CatalogFaq,
  CatalogFinalCta,
} from '@/components/catalog/catalog-marketing-sections';
import { CatalogSectionHeading } from '@/components/catalog/catalog-section-heading';

export type ToolDetailRelatedItem = {
  entityId: string;
  href: string;
  title: string;
  description: string;
  actionLabel: string;
};

/**
 * Stable detail-page chassis. It owns shared framing only; a Block-layer tool
 * template supplies the hero supplement and the ordered, intent-specific body.
 */
export function ToolDetailShell({
  directoryTitle,
  hero,
  availabilityLabel,
  breadcrumbHomeLabel,
  breadcrumbToolsLabel,
  relatedTitle,
  relatedItems,
  workbench,
  heroSupplement,
  children,
  faq,
  cta,
}: {
  directoryTitle: string;
  hero: {
    eyebrow: string;
    title: string;
    description: string;
  };
  availabilityLabel: string;
  breadcrumbHomeLabel: string;
  breadcrumbToolsLabel: string;
  relatedTitle: string;
  relatedItems: readonly ToolDetailRelatedItem[];
  workbench: ReactNode;
  heroSupplement?: ReactNode;
  children: ReactNode;
  faq: {
    title: string;
    items: readonly { question: string; answer: string }[];
  };
  cta: {
    title: string;
    description: string;
    primaryLabel: string;
    secondaryLabel: string;
  };
}) {
  return (
    <article>
      <section
        id="generator"
        className="scroll-mt-20 px-4 pt-12 pb-16 sm:px-6 sm:pt-16"
      >
        <div className="mx-auto w-full max-w-3xl">
          <nav aria-label="Breadcrumb" className="sr-only">
            <Link href="/">{breadcrumbHomeLabel}</Link>
            <Link href="/tools">{breadcrumbToolsLabel}</Link>
            <span aria-current="page">{directoryTitle}</span>
          </nav>
          <p className="sr-only">
            {hero.eyebrow} · {availabilityLabel}
          </p>
          <h1 className="text-foreground text-center font-serif text-3xl font-normal tracking-[-0.01em] sm:text-4xl">
            {hero.title}
          </h1>
          <p className="text-muted-foreground mx-auto mt-4 max-w-2xl text-center text-sm leading-relaxed sm:text-base">
            {hero.description}
          </p>
          <div className="mt-8">{workbench}</div>
          {heroSupplement}
        </div>
      </section>

      {children}

      {relatedItems.length > 0 && (
        <section className="px-4 py-16 sm:px-6">
          <div className="mx-auto max-w-6xl">
            <CatalogSectionHeading title={relatedTitle} />
            <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {relatedItems.map((item) => (
                <Link
                  key={item.entityId}
                  href={item.href}
                  className="border-border bg-card rounded-2xl border p-5 transition-transform hover:-translate-y-0.5"
                >
                  <h3 className="font-semibold">{item.title}</h3>
                  <p className="text-muted-foreground mt-2 text-sm leading-6">
                    {item.description}
                  </p>
                  <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold">
                    {item.actionLabel}
                    <ArrowRight aria-hidden="true" className="size-4" />
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      <CatalogFaq title={faq.title} items={faq.items} />
      <CatalogFinalCta {...cta} />
    </article>
  );
}
