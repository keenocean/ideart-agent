# Supporting catalog marketing components

Reuse entry point: [Catalog marketing component reuse guide](./README.md).

## CatalogSectionHeading

Centered serif title, optional centered description, semantic foreground/muted colors, maximum text width of 672px. Compact variant uses 30–36px titles; editorial variant may scale to 48–56px for future video pages.

## CatalogSteps

Pure-props numbered cards. Four columns desktop, two tablet, one mobile; 16px gap; 22px radius. The current three-step image workflow naturally caps at three columns.

## CatalogFeatureGrid

Pure-props feature cards. Three columns desktop, two tablet, one mobile. Default spacing is 24px. A `matrix` variant supports the video reference's shared border and 1px separators without hard-coded colors.

## CatalogMediaExplainer

Two-column `0.78fr / 1.22fr` card with copy first and media second, 28px radius. Below 640px it becomes one column. Supports image or video through `CatalogMedia`.

## CatalogMediaCarousel

Horizontal snap rail with 20px gap, hidden scrollbar, 24px horizontal padding, cards sized to 85vw up to 960px, 44px previous/next controls, mobile copy bodies, and desktop prompt overlays. Supports image/video and opens the shared preview dialog. Exact behavior lives in `catalog-video-inspiration-carousel.spec.md`.

## CatalogShowcaseCardGrid

Two reusable catalog groups reproduce the reference tool/model card geometry with dynamic inventory. Workflow cards accept paired R2 media and a prompt action; model cards accept a single R2 cover and only become interactive for a real runtime model. Exact behavior lives in `catalog-showcase-card-grid.spec.md`.

## CatalogFaq

Native `details/summary` disclosures in a 1024px container. Clear focus, no JavaScript-required expand behavior, and theme-token surfaces.

## CatalogFinalCta

1024px compact or 1280px wide bordered card, 28–32px radius, centered copy/actions, and theme-token background/foreground. Links remain locale aware.

## Visual token rule

Every component uses `background`, `card`, `muted`, `foreground`, `muted-foreground`, `border`, `primary`, and related system classes. No copied reference-page hex or RGB colors are allowed.
