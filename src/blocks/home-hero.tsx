import { CheckCircle2 } from 'lucide-react';

import { m } from '@/paraglide/messages.js';
import { PromptLauncher } from '@/components/agent/prompt-launcher';
import {
  CatalogMedia,
  type CatalogMediaAsset,
} from '@/components/catalog/catalog-media';

export function HomeHero({ media }: { media: CatalogMediaAsset }) {
  const proofPoints = [
    m['landing.hero.proof_1'](),
    m['landing.hero.proof_2'](),
    m['landing.hero.proof_3'](),
  ];

  return (
    <section
      id="generator"
      className="relative scroll-mt-20 overflow-hidden px-4 pt-16 pb-20 sm:px-6 sm:pt-24 sm:pb-28"
    >
      <div className="mx-auto max-w-6xl">
        <header className="mx-auto max-w-4xl text-center">
          <p className="text-primary text-xs font-semibold tracking-[0.16em] uppercase">
            {m['landing.hero.eyebrow']()}
          </p>
          <h1 className="text-foreground mt-5 font-serif text-4xl leading-[1.02] font-normal tracking-[-0.035em] text-balance sm:text-6xl lg:text-7xl">
            {m['landing.hero.headline_1']()}
          </h1>
          <p className="text-muted-foreground mx-auto mt-6 max-w-2xl text-base leading-7 sm:text-lg">
            {m['landing.hero.subheadline']()}
          </p>
        </header>

        <PromptLauncher
          className="mx-auto mt-10 max-w-4xl"
          showHeading={false}
          showExamples={false}
        />

        <ul className="text-muted-foreground mt-5 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs sm:text-sm">
          {proofPoints.map((point) => (
            <li key={point} className="flex items-center gap-2">
              <CheckCircle2
                aria-hidden="true"
                className="text-primary size-4"
              />
              {point}
            </li>
          ))}
        </ul>

        <div className="border-border bg-card relative mx-auto mt-12 aspect-[16/8.5] max-w-5xl overflow-hidden rounded-[2rem] border shadow-2xl shadow-black/10">
          <CatalogMedia asset={media} priority />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent" />
          <p className="absolute inset-x-0 bottom-0 px-6 py-5 text-sm text-white sm:px-8">
            {m['landing.hero.media_caption']()}
          </p>
        </div>
      </div>
    </section>
  );
}
