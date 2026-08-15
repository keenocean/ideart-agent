import { useRef, useState, type ReactNode } from 'react';
import {
  ArrowRight,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Play,
  WandSparkles,
} from 'lucide-react';

import { Link } from '@/core/i18n/navigation';
import { cn } from '@/lib/utils';
import type { CatalogGalleryItem } from '@/components/catalog/catalog-masonry-gallery';
import {
  CatalogMedia,
  type CatalogMediaAsset,
} from '@/components/catalog/catalog-media';
import {
  CatalogMediaPreviewDialog,
  type CatalogMediaPreviewLabels,
} from '@/components/catalog/catalog-media-preview-dialog';
import { CatalogSectionHeading } from '@/components/catalog/catalog-section-heading';
import { buttonVariants } from '@/components/ui/button';

export type CatalogCopyItem = {
  title: string;
  description: string;
  icon?: ReactNode;
};

export function CatalogFeatureGrid({
  title,
  description,
  items,
  id,
  className,
}: {
  title: string;
  description?: string;
  items: readonly CatalogCopyItem[];
  id?: string;
  className?: string;
}) {
  return (
    <section
      id={id}
      className={cn('scroll-mt-20 px-4 py-16 sm:px-6', className)}
    >
      <div className="mx-auto w-full max-w-5xl">
        <CatalogSectionHeading title={title} description={description} />
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <article
              key={item.title}
              className="border-border bg-card rounded-2xl border p-5"
            >
              {item.icon}
              <h3 className="text-foreground mt-3 text-sm font-medium">
                {item.title}
              </h3>
              <p className="text-muted-foreground mt-1.5 text-sm leading-relaxed">
                {item.description}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export function CatalogExploreSection({
  groups,
}: {
  groups: readonly {
    title: string;
    description?: string;
    items: readonly CatalogCopyItem[];
  }[];
}) {
  return (
    <section id="explore" className="scroll-mt-20 px-4 py-16 sm:px-6">
      <div className="mx-auto w-full max-w-6xl space-y-16">
        {groups.map((group) => (
          <div key={group.title}>
            <CatalogSectionHeading
              title={group.title}
              description={group.description}
            />
            <div
              className={cn(
                'mt-8 grid gap-5 sm:grid-cols-2',
                group.items.length >= 4 ? 'lg:grid-cols-4' : 'lg:grid-cols-3'
              )}
            >
              {group.items.map((item) => (
                <article
                  key={item.title}
                  className="border-border bg-card rounded-2xl border p-5"
                >
                  {item.icon}
                  <h3 className="text-foreground mt-4 font-medium">
                    {item.title}
                  </h3>
                  <p className="text-muted-foreground mt-2 text-sm leading-6">
                    {item.description}
                  </p>
                </article>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export function CatalogSteps({
  title,
  description,
  items,
  id,
}: {
  title: string;
  description?: string;
  items: readonly { title: string; description: string }[];
  id?: string;
}) {
  return (
    <section
      id={id}
      className="bg-muted/35 border-border scroll-mt-20 border-y px-4 py-16 sm:px-6"
    >
      <div className="mx-auto max-w-6xl">
        <CatalogSectionHeading title={title} description={description} />
        <div
          className={cn(
            'mt-10 grid grid-cols-1 gap-4 md:grid-cols-2',
            items.length >= 4 ? 'lg:grid-cols-4' : 'lg:grid-cols-3'
          )}
        >
          {items.map((item, index) => (
            <article
              key={item.title}
              className="border-border bg-card grid h-full grid-rows-[auto_auto_1fr] rounded-[1.375rem] border p-6 sm:p-7"
            >
              <span className="border-primary/30 bg-primary/10 text-primary flex size-9 items-center justify-center rounded-full border text-sm font-semibold">
                {index + 1}
              </span>
              <h3 className="text-foreground mt-4 text-base leading-6 font-medium">
                {item.title}
              </h3>
              <p className="text-muted-foreground mt-3 text-sm leading-6">
                {item.description}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export function ToolQuickStarts({
  label,
  items,
  onSelect,
}: {
  label: string;
  items: readonly CatalogGalleryItem[];
  onSelect: (item: CatalogGalleryItem) => void;
}) {
  const columns =
    items.length <= 1
      ? 'grid-cols-1'
      : items.length === 2
        ? 'grid-cols-2'
        : items.length === 3
          ? 'grid-cols-2 sm:grid-cols-3'
          : 'grid-cols-2 sm:grid-cols-4';

  return (
    <div className="mt-6">
      <p className="text-foreground mb-3 text-sm font-medium">{label}</p>
      <div className={cn('grid gap-3', columns)}>
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => onSelect(item)}
            className="group focus-visible:ring-ring min-w-0 text-left focus-visible:ring-2 focus-visible:outline-none"
          >
            <span className="border-border bg-muted block aspect-[4/3] overflow-hidden rounded-xl border">
              <CatalogMedia
                asset={item.media}
                className="transition-transform duration-300 group-hover:scale-[1.025] motion-reduce:transition-none"
              />
            </span>
            <span className="text-muted-foreground group-hover:text-foreground mt-2 block truncate text-xs transition-colors">
              {item.title}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

export function CatalogLimitations({
  title,
  description,
  items,
}: {
  title: string;
  description?: string;
  items: readonly string[];
}) {
  return (
    <section className="bg-muted/35 border-border border-y px-4 py-16 sm:px-6">
      <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[0.8fr_1.2fr]">
        <CatalogSectionHeading
          title={title}
          description={description}
          align="left"
        />
        <ul className="grid gap-4 sm:grid-cols-2">
          {items.map((item) => (
            <li
              key={item}
              className="border-border bg-card flex gap-3 rounded-2xl border p-4 text-sm leading-6"
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
  );
}

export function CatalogFaq({
  title,
  description,
  items,
}: {
  title: string;
  description?: string;
  items: readonly { question: string; answer: string }[];
}) {
  return (
    <section id="faq" className="scroll-mt-20 px-4 py-16 sm:px-6">
      <div className="mx-auto w-full max-w-5xl">
        <CatalogSectionHeading title={title} description={description} />
        <div className="mt-10 space-y-3">
          {items.map((item) => (
            <details
              key={item.question}
              className="border-border bg-card group rounded-2xl border px-5 py-4"
            >
              <summary className="focus-visible:ring-ring cursor-pointer list-none rounded-md font-medium focus-visible:ring-2 focus-visible:outline-none">
                {item.question}
              </summary>
              <p className="text-muted-foreground mt-3 max-w-3xl text-sm leading-6">
                {item.answer}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

export function CatalogFinalCta({
  title,
  description,
  primaryLabel,
  secondaryLabel,
  primaryHref = '#generator',
  secondaryHref = '/pricing',
  wide = false,
}: {
  title: string;
  description: string;
  primaryLabel: string;
  secondaryLabel: string;
  primaryHref?: string;
  secondaryHref?: string;
  wide?: boolean;
}) {
  return (
    <section className="px-4 py-16 sm:px-6">
      <div
        className={cn(
          'border-border bg-card mx-auto w-full rounded-[2rem] border px-6 py-12 text-center shadow-sm sm:py-14',
          wide ? 'max-w-7xl' : 'max-w-5xl'
        )}
      >
        <h2 className="text-foreground font-serif text-3xl font-normal tracking-[-0.01em] sm:text-4xl">
          {title}
        </h2>
        <p className="text-muted-foreground mx-auto mt-4 max-w-xl text-sm leading-relaxed sm:text-base">
          {description}
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <a href={primaryHref} className={cn(buttonVariants(), 'gap-2')}>
            {primaryLabel}
            <ArrowRight aria-hidden="true" className="size-4" />
          </a>
          <Link
            href={secondaryHref}
            className={buttonVariants({ variant: 'outline' })}
          >
            {secondaryLabel}
          </Link>
        </div>
      </div>
    </section>
  );
}

export function CatalogMediaExplainer({
  title,
  description,
  eyebrow,
  copy,
  footnote,
  media,
}: {
  title: string;
  description?: string;
  eyebrow?: string;
  copy: string;
  footnote?: string;
  media: CatalogMediaAsset;
}) {
  return (
    <section className="bg-muted/35 border-border border-y px-4 py-20 sm:px-6 sm:py-28">
      <div className="mx-auto max-w-7xl">
        <CatalogSectionHeading
          title={title}
          description={description}
          size="editorial"
        />
        <div className="border-border bg-card mt-14 grid overflow-hidden rounded-[1.75rem] border sm:grid-cols-[minmax(0,0.78fr)_minmax(0,1.22fr)]">
          <div className="bg-muted/55 flex min-h-80 flex-col p-6 sm:p-10 lg:min-h-[28rem] lg:p-12">
            {eyebrow && (
              <p className="text-primary text-xs font-semibold tracking-[0.14em] uppercase">
                {eyebrow}
              </p>
            )}
            <p className="text-foreground mt-8 text-lg leading-8">{copy}</p>
            {footnote && (
              <p className="text-muted-foreground mt-auto pt-10 text-xs leading-5">
                {footnote}
              </p>
            )}
          </div>
          <div className="bg-muted relative min-h-80 lg:min-h-[28rem]">
            <CatalogMedia asset={media} />
          </div>
        </div>
      </div>
    </section>
  );
}

export function CatalogMediaCarousel({
  title,
  description,
  items,
  labels,
  onUsePrompt,
}: {
  title: string;
  description?: string;
  items: readonly CatalogGalleryItem[];
  labels: CatalogMediaPreviewLabels & { usePrompt: string };
  onUsePrompt?: (item: CatalogGalleryItem) => void;
}) {
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);
  const railRef = useRef<HTMLDivElement>(null);
  const preview = previewIndex === null ? null : (items[previewIndex] ?? null);

  function navigate(offset: number) {
    setPreviewIndex((current) => {
      if (current === null || items.length === 0) return null;
      return (current + offset + items.length) % items.length;
    });
  }

  function scrollRail(offset: -1 | 1) {
    const rail = railRef.current;
    const firstCard = rail?.querySelector<HTMLElement>('[data-carousel-card]');
    if (!rail || !firstCard) return;

    const step = firstCard.offsetWidth + 20;
    const maximum = Math.max(0, rail.scrollWidth - rail.clientWidth);
    const atStart = rail.scrollLeft <= step / 2;
    const atEnd = rail.scrollLeft >= maximum - step / 2;
    const left =
      offset < 0 && atStart
        ? maximum
        : offset > 0 && atEnd
          ? 0
          : rail.scrollLeft + offset * step;
    const reduceMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;
    rail.scrollTo({ left, behavior: reduceMotion ? 'auto' : 'smooth' });
  }

  if (items.length === 0) return null;

  return (
    <section
      id="prompt-examples"
      className="bg-foreground text-background w-full scroll-mt-20 py-20 sm:py-28"
    >
      <div className="mx-auto max-w-5xl px-6 text-center">
        <h2 className="font-serif text-4xl leading-[1.08] font-normal tracking-[-0.02em] text-balance sm:text-5xl">
          {title}
        </h2>
        {description && (
          <p className="text-background/65 mx-auto mt-4 max-w-2xl text-base leading-relaxed sm:text-lg">
            {description}
          </p>
        )}
      </div>
      <div className="relative mt-8 sm:mt-10">
        <div
          ref={railRef}
          className="flex w-full snap-x snap-mandatory [scroll-padding:0_1.5rem] gap-5 overflow-x-auto px-6 py-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {items.map((item, index) => (
            <button
              key={item.id}
              type="button"
              data-carousel-card
              onClick={() => setPreviewIndex(index)}
              aria-label={item.title}
              className="border-background/15 bg-background/8 group focus-visible:ring-background relative w-[85vw] max-w-[60rem] shrink-0 snap-start overflow-hidden rounded-3xl border text-left shadow-[0_18px_55px_rgba(0,0,0,0.24)] focus-visible:ring-2 focus-visible:outline-none"
            >
              <span className="bg-muted relative block aspect-video overflow-hidden">
                <CatalogMedia
                  asset={item.media}
                  className="transition-transform duration-500 ease-out group-hover:scale-[1.03] motion-reduce:transition-none"
                />
                {item.media.kind === 'video' && (
                  <span className="absolute top-1/2 left-1/2 flex size-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-white/30 bg-black/45 text-white opacity-0 backdrop-blur-md transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
                    <Play
                      aria-hidden="true"
                      className="ml-0.5 size-4 fill-current"
                    />
                  </span>
                )}
                <span className="absolute inset-x-0 bottom-0 hidden bg-gradient-to-t from-black/80 to-transparent px-6 pt-20 pb-5 text-sm font-medium text-white transition-opacity duration-300 group-hover:opacity-0 group-focus-visible:opacity-0 sm:block">
                  {item.title}
                </span>
                <span className="absolute inset-0 hidden flex-col justify-end bg-gradient-to-t from-black/90 via-black/45 to-transparent p-6 text-white opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus-visible:opacity-100 sm:flex">
                  <strong className="text-lg leading-tight font-semibold">
                    {item.title}
                  </strong>
                  <span className="mt-2 line-clamp-4 text-sm leading-6 text-white/80">
                    {item.prompt}
                  </span>
                </span>
              </span>
              <span className="block min-h-40 p-5 sm:hidden">
                <strong className="text-background block text-lg leading-tight font-semibold">
                  {item.title}
                </strong>
                <span className="text-background/65 mt-2 [display:-webkit-box] block overflow-hidden text-sm leading-[1.6] [-webkit-box-orient:vertical] [-webkit-line-clamp:4]">
                  {item.description ?? item.prompt}
                </span>
              </span>
            </button>
          ))}
        </div>

        {items.length > 1 && (
          <>
            <button
              type="button"
              onClick={() => scrollRail(-1)}
              aria-label={labels.previous}
              className="border-background/20 bg-foreground/90 text-background focus-visible:ring-background hover:bg-foreground absolute top-[calc(1rem+min(23.90625vw,17rem))] left-2 flex size-11 -translate-y-1/2 items-center justify-center rounded-full border shadow-lg backdrop-blur-md transition-colors focus-visible:ring-2 focus-visible:outline-none"
            >
              <ChevronLeft aria-hidden="true" className="size-5" />
            </button>
            <button
              type="button"
              onClick={() => scrollRail(1)}
              aria-label={labels.next}
              className="border-background/20 bg-foreground/90 text-background focus-visible:ring-background hover:bg-foreground absolute top-[calc(1rem+min(23.90625vw,17rem))] right-2 flex size-11 -translate-y-1/2 items-center justify-center rounded-full border shadow-lg backdrop-blur-md transition-colors focus-visible:ring-2 focus-visible:outline-none"
            >
              <ChevronRight aria-hidden="true" className="size-5" />
            </button>
          </>
        )}
      </div>

      <CatalogMediaPreviewDialog
        open={preview !== null}
        item={preview}
        index={previewIndex ?? -1}
        total={items.length}
        labels={labels}
        onClose={() => setPreviewIndex(null)}
        onNavigate={navigate}
        actions={
          preview && onUsePrompt ? (
            <button
              type="button"
              onClick={() => {
                const selected = preview;
                setPreviewIndex(null);
                onUsePrompt(selected);
              }}
              className="bg-primary text-primary-foreground focus-visible:ring-ring flex h-11 w-full items-center justify-center gap-2 rounded-xl px-4 text-sm font-medium hover:opacity-90 focus-visible:ring-2 focus-visible:outline-none"
            >
              <WandSparkles aria-hidden="true" className="size-4" />
              {labels.usePrompt}
            </button>
          ) : null
        }
      />
    </section>
  );
}
