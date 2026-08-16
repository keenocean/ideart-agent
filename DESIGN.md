# Design

## Source of truth

- Status: Active
- Last refreshed: 2026-08-16
- Primary product surfaces: public homepage, tool/model directories and detail pages, Agent workspace, account/admin application.
- Evidence reviewed: `src/styles/globals.css`, `src/routes/index.tsx`, `src/routes/tools/$slug.tsx`, `src/blocks/home-*.tsx`, `src/blocks/tool-detail*.tsx`, `src/components/catalog/*`, `docs/marketing-pages-guide.md`, and `.omx/plans/marketing-pages-architecture.md`.

## Brand

- Personality: capable, focused, editorial, and creator-friendly rather than playful or ornamental.
- Trust signals: truthful capability copy, visible limitations, predictable controls, private-workspace language, and consistent page structure.
- Avoid: unrelated template-brand links, invented provider claims, gradients or colors outside theme tokens, and visually unrelated page families.

## Product goals

- Goals: move a visitor from an idea to a real Agent generation workflow; explain tools and models without overstating Runtime support; keep public pages coherent as the Catalog grows beyond 100 entries.
- Non-goals: a generic JSON page renderer, one universal page component, or a second design system beside Tailwind and the existing shadcn/theme tokens.
- Success signals: visitors can identify the primary action quickly, page families feel related, new pages reuse established primitives, and SSR/SEO/accessibility contracts remain intact.

## Personas and jobs

- Primary personas: creators, marketers, and operators producing or evaluating visual media.
- User jobs: start a generation, understand a focused workflow, compare examples, assess a model or tool, and continue work in the private Agent workspace.
- Key contexts of use: desktop creative work, mobile discovery, light/dark themes, and English/Chinese locales.

## Information architecture

- Primary navigation: homepage sections, Tools, Create, Pricing, account actions, and locale/theme controls.
- Core routes/screens: `/`, `/tools`, `/tools/$slug`, future `/models` and `/models/$slug`, `/chat`, `/library`, `/pricing`, Blog, support, and legal pages.
- Content hierarchy: page intent and primary action first; examples and evidence second; workflow/use cases/limitations next; FAQ and final CTA last.

## Design principles

- One visual chassis, multiple intents: homepage, tool, and model pages share section rhythm, surfaces, headings, cards, and widths while retaining different content and execution semantics.
- Theme tokens are the palette: use `background`, `foreground`, `card`, `muted`, `primary`, and `border`; do not hardcode project colors in marketing sections.
- Plain first: a marketing section is transparent over `bg-background` by default. A muted band is an explicit semantic variant, not an alternating decoration added by individual Blocks.
- Components own visual rules; Blocks own content and choose a small named variant. Routes own composition.
- Tradeoff: the homepage can keep a more prominent hero and richer media, but its section spacing and card language must match detail pages.

## Visual language

- Color: inherit the oklch light/dark tokens in `src/styles/globals.css`. Section surfaces use `bg-background`; cards use `bg-card`; media placeholders use `bg-muted`; accents use `primary`.
- Typography: IBM Plex Sans for UI/body and IBM Plex Serif for editorial headings. Standard section headings use the compact Catalog heading scale; editorial scale is reserved for a hero or media-led explainer.
- Spacing/layout rhythm: standard sections use `px-4 py-16 sm:px-6`; standard content width is `max-w-6xl`, narrow content is `max-w-5xl`, and `max-w-7xl` is reserved for intentionally wide media. Blocks must not invent `py-20/28` or width overrides for ordinary sections.
- Shape/radius/elevation: content cards use `rounded-2xl` with `border-border bg-card`; major CTA/media frames may use `rounded-[2rem]`; elevation is restrained and never substitutes for hierarchy.
- Motion: short hover/focus transitions only; honor `prefers-reduced-motion` for scrolling and animated media effects.
- Imagery/iconography: marketing media comes from the project R2 inventory with intrinsic metadata; Lucide icons support meaning and use theme tokens.

## Components

- Existing components to reuse: `CatalogSection`, `CatalogSectionHeading`, `CatalogFeatureGrid`, `CatalogMediaFeatureList`, `CatalogMasonryGallery`, `CatalogShowcaseCardGrid`, `CatalogFaq`, `CatalogFinalCta`, `GenerationWorkbench`, `SiteHeader`, and `SiteFooter`.
- New/changed components: `CatalogSection` is the durable section frame for homepage, tool, and future model pages. Existing Catalog sections compose it instead of repeating root spacing, surface, and width classes.
- Variants and states: widths are `narrow`, `standard`, or `wide`; surfaces are `plain` or `muted`. `compact` and `banded` media layouts remain content-layout variants, but `compact` is the cross-page default.
- Token/component ownership: theme colors live in `src/styles/globals.css`; shared marketing layout lives in `src/components/catalog`; project copy and component selection live in `src/blocks`; page order lives in routes.

## Accessibility

- Target standard: WCAG 2.2 AA for public and application surfaces.
- Keyboard/focus behavior: every interactive element retains a visible theme-token focus ring; galleries, dialogs, accordions, menus, and workbenches remain keyboard operable.
- Contrast/readability: use semantic foreground tokens; do not place muted text on arbitrary media without an overlay.
- Screen-reader semantics: one H1 per page, ordered headings, real section/article/nav landmarks, visible-content-backed structured data, and useful media alt text.
- Reduced motion and sensory considerations: disable nonessential animation for reduced-motion users and never rely on color or hover alone.

## Responsive behavior

- Supported breakpoints/devices: mobile-first layout through Tailwind `sm`, `md`, and `lg` breakpoints.
- Layout adaptations: multi-column cards collapse without reordering meaning; media precedes copy on mobile; horizontal media rails remain touch-scrollable.
- Touch/hover differences: primary information stays visible without hover; hover reveals only supplemental controls or copy.

## Interaction states

- Loading: reserve stable media/workbench space and show existing loading treatments.
- Empty: omit optional marketing collections or show an intentional empty state; never render a broken shell.
- Error: content-release faults use the established 503 boundary; executable failures stay in the Agent workflow.
- Success: preserve the generated result and continuation path in the same conversation.
- Disabled: explain capability/readiness in accessible copy without exposing provider configuration details.
- Offline/slow network: SSR core content remains useful; media uses dimensions/posters and avoids layout shift.

## Content voice

- Tone: direct, concrete, calm, and task-oriented.
- Terminology: use “Agent”, “tool”, “model”, “reference”, “result”, and “credits” consistently with Runtime behavior.
- Microcopy rules: describe outcomes and constraints; do not expose admin configuration, promise deterministic generation, or claim unavailable models/tools.

## Implementation constraints

- Framework/styling system: TanStack Start, React 19, Tailwind CSS 4, shadcn/ui v4, and semantic theme tokens.
- Design-token constraints: no new dependency or parallel token layer; shared Catalog components are the enforcement surface.
- Performance constraints: public core content is SSR; R2 media has dimensions/posters; page growth must satisfy route, Worker, and external-content bundle checks.
- Compatibility constraints: Paraglide locale-free internal paths, light/dark modes, and pure-props components with no server imports.
- Test/screenshot expectations: format, tests, TypeScript, build, bilingual SSR, and representative desktop/mobile visual review before production release.

## Open questions

- [ ] Capture durable desktop/mobile visual-regression baselines after the unified section contract is deployed; owner: frontend/SEO release owner; impact: detects later spacing and surface drift.
