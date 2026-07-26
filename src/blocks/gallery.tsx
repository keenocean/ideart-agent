import { ArrowRight, Sparkles } from 'lucide-react';

import { Link } from '@/core/i18n/navigation';
import { cn } from '@/lib/utils';
import { m } from '@/paraglide/messages.js';
import { buttonVariants } from '@/components/ui/button';

// Subtle gradient palettes used as image placeholders for the first version
const swatches = [
  'from-rose-200 via-pink-200 to-orange-200',
  'from-amber-200 via-yellow-200 to-lime-200',
  'from-sky-200 via-indigo-200 to-violet-200',
  'from-emerald-200 via-teal-200 to-cyan-200',
  'from-fuchsia-200 via-purple-200 to-indigo-200',
  'from-orange-200 via-rose-200 to-red-200',
  'from-stone-200 via-amber-100 to-yellow-100',
  'from-cyan-200 via-sky-200 to-blue-200',
];

export function Gallery() {
  const items = [
    m['landing.gallery.item_1'](),
    m['landing.gallery.item_2'](),
    m['landing.gallery.item_3'](),
    m['landing.gallery.item_4'](),
    m['landing.gallery.item_5'](),
    m['landing.gallery.item_6'](),
    m['landing.gallery.item_7'](),
    m['landing.gallery.item_8'](),
  ];

  return (
    <section id="gallery" className="px-4 py-20 sm:py-24">
      <div className="mx-auto max-w-6xl">
        <div className="text-center">
          <p className="text-primary text-xs font-medium tracking-[0.18em] uppercase">
            {m['landing.gallery.eyebrow']()}
          </p>
          <h2 className="mx-auto mt-4 max-w-2xl text-3xl font-bold tracking-[-0.02em] sm:text-4xl lg:text-5xl">
            {m['landing.gallery.title']()}
          </h2>
          <p className="text-muted-foreground mx-auto mt-4 max-w-xl text-base">
            {m['landing.gallery.description']()}
          </p>
        </div>

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((prompt, i) => (
            <article
              key={i}
              className="group border-border bg-card overflow-hidden rounded-lg border transition-shadow hover:shadow-lg"
            >
              <div
                className={cn(
                  'relative aspect-[4/5] w-full bg-gradient-to-br',
                  swatches[i % swatches.length]
                )}
              >
                <span className="bg-background/80 text-foreground absolute top-2 right-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium backdrop-blur">
                  <Sparkles className="text-primary size-3" />
                  AI
                </span>
              </div>
              <div className="p-4">
                <p className="text-muted-foreground line-clamp-3 text-xs leading-relaxed">
                  &ldquo;{prompt}&rdquo;
                </p>
              </div>
            </article>
          ))}
        </div>

        <div className="mt-10 flex justify-center">
          <Link
            href="/chat"
            className={cn(
              buttonVariants({ variant: 'outline', size: 'lg' }),
              'gap-2 rounded-full px-6'
            )}
          >
            {m['landing.gallery.view_all']()}
            <ArrowRight className="size-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
