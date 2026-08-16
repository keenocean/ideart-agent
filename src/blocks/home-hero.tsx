import { CheckCircle2 } from 'lucide-react';

import { m } from '@/paraglide/messages.js';
import { PromptLauncher } from '@/components/agent/prompt-launcher';
import { CatalogSection } from '@/components/catalog/catalog-section';

export function HomeHero() {
  const proofPoints = [
    m['landing.hero.proof_1'](),
    m['landing.hero.proof_2'](),
    m['landing.hero.proof_3'](),
  ];

  return (
    <CatalogSection
      id="generator"
      className="relative overflow-hidden pt-12 pb-0 sm:pt-16"
    >
      <header className="mx-auto max-w-3xl text-center">
        <p className="text-primary text-xs font-semibold tracking-[0.16em] uppercase">
          {m['landing.hero.eyebrow']()}
        </p>
        <h1 className="text-foreground content-heading mt-5 text-3xl font-normal tracking-[-0.01em] text-balance sm:text-4xl">
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
    </CatalogSection>
  );
}
