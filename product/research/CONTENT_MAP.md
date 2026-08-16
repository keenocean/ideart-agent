# AI image generator content map

The rebuilt page maps existing, reviewed UGCMind content into the reference topology. The table names semantic fields, not a runtime TypeScript module: the canonical editing source is `product/marketing/tools/ai-image-generator/{en,zh}.json`, compiled into the pinned marketing content release before deployment.

| Page region        | UGCMind source                          | Rendering component                                |
| ------------------ | --------------------------------------- | -------------------------------------------------- |
| Hero and workbench | `hero`, `workbench`, runtime readiness  | `ToolDetailShell` + existing `GenerationWorkbench` |
| Quick starts       | `examples.items`                        | `ToolQuickStarts`                                  |
| Inputs/outputs     | `inputOutput`                           | `CatalogFeatureGrid`                               |
| Example showcase   | `examples.items` and resolved R2 assets | `CatalogMasonryGallery`                            |
| Workflow           | `workflow`                              | `CatalogSteps`                                     |
| Features           | `features`                              | `CatalogFeatureGrid`                               |
| Prompt guidance    | `promptGuide`                           | `CatalogFeatureGrid`                               |
| Use cases          | `useCases.items[].media`                | `CatalogMediaFeatureList`                          |
| Limitations        | `limitations`                           | `CatalogLimitations`                               |
| FAQ                | `faq`                                   | `CatalogFaq`                                       |
| Final CTA          | `cta`                                   | `CatalogFinalCta`                                  |

The current content selects the `image-generator` template, so every example and use-case asset is an image. Video assets stay registered in R2 but are not rendered here. Future video pages reuse `CatalogMedia`, `CatalogMediaFeatureList`, `CatalogMediaCarousel`, and `CatalogMediaComparisonGrid` through the Block-owned template registry. The component layer accepts content and assets via props and does not read translations.

Asset IDs are edited in the locale page JSON and resolved from `product/marketing/assets.json` while building the release. The emitted page object contains only the assets that page needs; neither the global asset registry nor the other pages enter the Worker/client bundle. Localized alt/caption remains beside each page reference.

Current implementation note: as of 2026-08-15 the live slice reads the exact page object through `src/content/marketing/registry.ts` and `store.ts`, pinned by `MARKETING_CONTENT_RELEASE`. The editable source and media inventory are `product/marketing/**`; the old TypeScript page/global-asset paths have been removed. New bulk pages must go through the release compiler and 100-page/bundle gates.
