import { Cpu, GitBranch, MessageSquare, Network } from 'lucide-react';

import { m } from '@/paraglide/messages.js';

export function Features() {
  const models = [
    m['landing.models.item_1'](),
    m['landing.models.item_2'](),
    m['landing.models.item_3'](),
    m['landing.models.item_4'](),
    m['landing.models.item_5'](),
  ];

  return (
    <section id="features" className="px-4 py-20 sm:py-24">
      <div className="mx-auto max-w-6xl">
        {/* Eyebrow + heading */}
        <div className="text-center">
          <p className="text-primary text-xs font-medium tracking-[0.18em] uppercase">
            {m['landing.features.eyebrow']()}
          </p>
          <h2 className="text-foreground mx-auto mt-4 max-w-2xl text-3xl font-bold tracking-[-0.02em] sm:text-4xl lg:text-5xl">
            {m['landing.features.title']()}
          </h2>
          <p className="text-muted-foreground mx-auto mt-4 max-w-xl text-base leading-relaxed">
            {m['landing.features.description']()}
          </p>
        </div>

        {/* Two top feature cards */}
        <div className="mt-14 grid gap-6 lg:grid-cols-2">
          {/* Conversational Editing */}
          <div className="group border-border bg-card relative overflow-hidden rounded-lg border p-7">
            <div className="bg-primary/10 text-primary flex size-11 items-center justify-center rounded-md">
              <MessageSquare className="size-5" />
            </div>
            <h3 className="mt-5 text-xl font-semibold tracking-tight">
              {m['landing.features.conversational_title']()}
            </h3>
            <p className="text-muted-foreground mt-2 max-w-md text-sm leading-relaxed">
              {m['landing.features.conversational_description']()}
            </p>

            {/* Mock chat bubbles */}
            <div className="border-border bg-background/60 mt-6 space-y-2 rounded-lg border p-3">
              <div className="bg-primary/10 text-foreground ml-auto inline-block max-w-[85%] rounded-md rounded-tr-sm px-3 py-2 text-xs">
                Make the sky a sunset and add a soft glow
              </div>
              <div className="bg-secondary text-muted-foreground block max-w-[85%] rounded-md rounded-tl-sm px-3 py-2 text-xs">
                Done — generated 1 variation in 4.1s. Want it warmer?
              </div>
            </div>
          </div>

          {/* Infinite Canvas */}
          <div className="group border-border bg-card relative overflow-hidden rounded-lg border p-7">
            <div className="bg-primary/10 text-primary flex size-11 items-center justify-center rounded-md">
              <Network className="size-5" />
            </div>
            <h3 className="mt-5 text-xl font-semibold tracking-tight">
              {m['landing.features.canvas_title']()}
            </h3>
            <p className="text-muted-foreground mt-2 max-w-md text-sm leading-relaxed">
              {m['landing.features.canvas_description']()}
            </p>

            {/* Mock node graph */}
            <div className="border-border bg-background/60 mt-6 grid grid-cols-3 items-center gap-3 rounded-lg border p-4">
              <div className="border-border bg-card text-muted-foreground rounded-lg border p-3 text-center text-[10px] font-medium">
                Source
              </div>
              <div className="border-primary/40 bg-primary/10 text-primary rounded-lg border p-3 text-center text-[10px] font-medium">
                Style: Pixar
              </div>
              <div className="border-border bg-card text-muted-foreground rounded-lg border p-3 text-center text-[10px] font-medium">
                v3
              </div>
            </div>
          </div>
        </div>

        {/* Multi-model + Version sub-section */}
        <div className="mt-12 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="border-border bg-card relative overflow-hidden rounded-lg border p-7">
            <div className="bg-primary/10 text-primary flex size-11 items-center justify-center rounded-md">
              <Cpu className="size-5" />
            </div>
            <p className="text-muted-foreground mt-5 text-xs font-medium tracking-[0.16em] uppercase">
              {m['landing.features.multimodel_eyebrow']()}
            </p>
            <h3 className="mt-2 text-2xl font-semibold tracking-tight">
              {m['landing.features.multimodel_title']()}
            </h3>
            <p className="text-muted-foreground mt-3 max-w-xl text-sm leading-relaxed">
              {m['landing.features.multimodel_desc']()}
            </p>

            <div className="mt-6 grid grid-cols-3 gap-3 sm:grid-cols-4">
              {models.map((name) => (
                <div
                  key={name}
                  className="border-border bg-background/60 text-foreground/80 rounded-md border px-3 py-3 text-center text-xs font-medium"
                >
                  {name}
                </div>
              ))}
              <div className="border-border bg-background/40 text-muted-foreground rounded-md border border-dashed px-3 py-3 text-center text-xs font-medium">
                + more
              </div>
            </div>
          </div>

          <div className="border-border bg-card relative overflow-hidden rounded-lg border p-7">
            <div className="bg-primary/10 text-primary flex size-11 items-center justify-center rounded-md">
              <GitBranch className="size-5" />
            </div>
            <h3 className="mt-5 text-xl font-semibold tracking-tight">
              {m['landing.features.version_title']()}
            </h3>
            <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
              {m['landing.features.version_description']()}
            </p>

            {/* Version timeline */}
            <ol className="mt-6 space-y-2">
              {[
                'Original',
                'v1 · style transfer',
                'v2 · color grade',
                'v3 · final',
              ].map((label, i) => (
                <li
                  key={label}
                  className="border-border bg-background/60 flex items-center gap-3 rounded-lg border px-3 py-2 text-xs"
                >
                  <span className="bg-primary size-1.5 rounded-full" />
                  <span className="text-muted-foreground">{label}</span>
                  {i === 3 && (
                    <span className="bg-primary/10 text-primary ml-auto rounded-full px-2 py-0.5 text-[10px] font-medium">
                      current
                    </span>
                  )}
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </section>
  );
}
