import { CheckCircle2 } from 'lucide-react';

import { m } from '@/paraglide/messages.js';
import { PromptLauncher } from '@/components/agent/prompt-launcher';
import {
  CatalogMedia,
  type CatalogMediaAsset,
} from '@/components/catalog/catalog-media';
import { CatalogSection } from '@/components/catalog/catalog-section';

export function HomeHero({ media }: { media: CatalogMediaAsset }) {
  const proofPoints = [
    m['landing.hero.proof_1'](),
    m['landing.hero.proof_2'](),
    m['landing.hero.proof_3'](),
  ];

  return (
    <CatalogSection
      id="generator"
      className="relative overflow-hidden pt-12 pb-16 sm:pt-16"
    >
      <header className="mx-auto max-w-3xl text-center">
        <p className="text-primary text-xs font-semibold tracking-[0.16em] uppercase">
          {m['landing.hero.eyebrow']()}
        </p>
        <h1 className="text-foreground mt-5 font-serif text-3xl font-normal tracking-[-0.01em] text-balance sm:text-4xl">
          {m['landing.hero.headline_1']()}
        </h1>
        <p className="text-muted-foreground mx-auto mt-4 max-w-2xl text-sm leading-relaxed sm:text-base">
          {m['landing.hero.subheadline']()}
        </p>
      </header>

      <PromptLauncher
        className="mx-auto mt-8 max-w-3xl"
        showHeading={false}
        showExamples={false}
      />

      <ul className="text-muted-foreground mt-5 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs sm:text-sm">
        {proofPoints.map((point) => (
          <li key={point} className="flex items-center gap-2">
            <CheckCircle2 aria-hidden="true" className="text-primary size-4" />
            {point}
          </li>
        ))}
      </ul>

      <div className="border-border bg-card relative mx-auto mt-12 aspect-[16/8.5] max-w-5xl overflow-hidden rounded-[2rem] border shadow-sm">
        <CatalogMedia asset={media} priority />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent" />
        <p className="absolute inset-x-0 bottom-0 px-6 py-5 text-sm text-white sm:px-8">
          {m['landing.hero.media_caption']()}
        </p>
      </div>
    </CatalogSection>
  );
}
