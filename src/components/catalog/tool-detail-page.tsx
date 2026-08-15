import type { ReactNode } from 'react';
import {
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  Lightbulb,
} from 'lucide-react';

import { Link } from '@/core/i18n/navigation';
import { cn } from '@/lib/utils';
import { buttonVariants } from '@/components/ui/button';
import type { ToolPageContent } from '@/content/tools/types';

export type ToolDetailRelatedItem = {
  entityId: string;
  href: string;
  title: string;
  description: string;
  actionLabel: string;
};

export function ToolDetailPage({
  content,
  availabilityLabel,
  breadcrumbHomeLabel,
  breadcrumbToolsLabel,
  relatedTitle,
  relatedItems,
  workbench,
}: {
  content: ToolPageContent;
  availabilityLabel: string;
  breadcrumbHomeLabel: string;
  breadcrumbToolsLabel: string;
  relatedTitle: string;
  relatedItems: readonly ToolDetailRelatedItem[];
  workbench: ReactNode;
}) {
  return (
    <article>
      <section className="px-4 pt-10 pb-16 sm:px-6 sm:pt-14 sm:pb-20">
        <div className="mx-auto max-w-6xl">
          <nav
            aria-label="Breadcrumb"
            className="text-muted-foreground flex min-w-0 items-center gap-1.5 text-sm"
          >
            <Link href="/" className="hover:text-foreground transition-colors">
              {breadcrumbHomeLabel}
            </Link>
            <ChevronRight aria-hidden="true" className="size-3.5 shrink-0" />
            <Link
              href="/tools"
              className="hover:text-foreground transition-colors"
            >
              {breadcrumbToolsLabel}
            </Link>
            <ChevronRight aria-hidden="true" className="size-3.5 shrink-0" />
            <span aria-current="page" className="truncate">
              {content.directory.title}
            </span>
          </nav>

          <header className="mx-auto mt-12 max-w-4xl text-center">
            <div className="flex flex-wrap items-center justify-center gap-2">
              <span className="text-primary text-sm font-semibold tracking-[0.14em] uppercase">
                {content.hero.eyebrow}
              </span>
              <span className="border-border text-muted-foreground rounded-full border px-2.5 py-1 text-xs font-medium">
                {availabilityLabel}
              </span>
            </div>
            <h1 className="mt-5 font-serif text-4xl font-normal tracking-tight sm:text-5xl lg:text-6xl">
              {content.hero.title}
            </h1>
            <p className="text-muted-foreground mx-auto mt-6 max-w-3xl text-base leading-7 sm:text-lg">
              {content.hero.description}
            </p>
          </header>

          <div id="generator" className="scroll-mt-24 pt-12">
            {workbench}
          </div>
        </div>
      </section>

      <CopyGridSection
        className="bg-muted/40 border-y"
        content={content.inputOutput}
      />

      <section className="px-4 py-16 sm:px-6 sm:py-24">
        <div className="mx-auto max-w-6xl">
          <SectionHeader
            title={content.examples.title}
            description={content.examples.description}
          />
          <div className="mt-10 grid gap-5 lg:grid-cols-3">
            {content.examples.items.map((item) => (
              <article
                key={item.title}
                className="border-border bg-card flex flex-col rounded-3xl border p-6"
              >
                <h3 className="font-semibold">{item.title}</h3>
                <p className="text-muted-foreground mt-2 text-sm leading-6">
                  {item.description}
                </p>
                <div className="bg-muted mt-5 flex-1 rounded-2xl p-4">
                  <p className="text-sm leading-6">{item.prompt}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <CopyGridSection
        className="bg-card border-y"
        content={content.workflow}
      />
      <CopyGridSection content={content.features} />
      <CopyGridSection
        className="bg-muted/40 border-y"
        content={content.promptGuide}
        icon="idea"
      />
      <CopyGridSection content={content.useCases} />

      <section className="bg-card border-y px-4 py-16 sm:px-6 sm:py-24">
        <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[0.8fr_1.2fr]">
          <SectionHeader
            title={content.limitations.title}
            description={content.limitations.description}
          />
          <ul className="space-y-4">
            {content.limitations.items.map((item) => (
              <li
                key={item}
                className="border-border bg-background flex gap-3 rounded-2xl border p-4 text-sm leading-6"
              >
                <CheckCircle2
                  aria-hidden="true"
                  className="text-primary mt-0.5 size-4 shrink-0"
                />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {relatedItems.length > 0 && (
        <section className="px-4 py-16 sm:px-6 sm:py-24">
          <div className="mx-auto max-w-6xl">
            <h2 className="font-serif text-3xl font-normal tracking-tight sm:text-4xl">
              {relatedTitle}
            </h2>
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

      <section className="px-4 py-16 sm:px-6 sm:py-24">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-center font-serif text-3xl font-normal tracking-tight sm:text-4xl">
            {content.faq.title}
          </h2>
          <div className="mt-10 space-y-3">
            {content.faq.items.map((item) => (
              <details
                key={item.question}
                className="border-border bg-card group rounded-2xl border p-5"
              >
                <summary className="cursor-pointer list-none font-semibold">
                  {item.question}
                </summary>
                <p className="text-muted-foreground mt-3 text-sm leading-6">
                  {item.answer}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-neutral-950 px-4 py-16 text-neutral-100 sm:px-6 sm:py-20">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="font-serif text-3xl font-normal tracking-tight sm:text-4xl">
            {content.cta.title}
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-neutral-400">
            {content.cta.description}
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <a href="#generator" className={cn(buttonVariants(), 'gap-2')}>
              {content.cta.primaryLabel}
              <ArrowRight aria-hidden="true" className="size-4" />
            </a>
            <Link
              href="/pricing"
              className={cn(
                buttonVariants({ variant: 'outline' }),
                'border-neutral-700 bg-transparent text-neutral-100 hover:bg-white/10 hover:text-white'
              )}
            >
              {content.cta.secondaryLabel}
            </Link>
          </div>
        </div>
      </section>
    </article>
  );
}

function SectionHeader({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <header className="max-w-2xl">
      <h2 className="font-serif text-3xl font-normal tracking-tight sm:text-4xl">
        {title}
      </h2>
      <p className="text-muted-foreground mt-4 leading-7">{description}</p>
    </header>
  );
}

function CopyGridSection({
  content,
  className,
  icon = 'check',
}: {
  content: {
    title: string;
    description: string;
    items: readonly { title: string; description: string }[];
  };
  className?: string;
  icon?: 'check' | 'idea';
}) {
  const Icon = icon === 'idea' ? Lightbulb : CheckCircle2;
  return (
    <section
      className={cn('border-border px-4 py-16 sm:px-6 sm:py-24', className)}
    >
      <div className="mx-auto max-w-6xl">
        <SectionHeader
          title={content.title}
          description={content.description}
        />
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {content.items.map((item) => (
            <article
              key={item.title}
              className="border-border bg-background rounded-2xl border p-5"
            >
              <Icon aria-hidden="true" className="text-primary size-5" />
              <h3 className="mt-5 font-semibold">{item.title}</h3>
              <p className="text-muted-foreground mt-2 text-sm leading-6">
                {item.description}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
