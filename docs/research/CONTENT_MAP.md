# AI image generator content map

The rebuilt page maps existing, reviewed UGCMind content into the reference topology.

| Page region        | UGCMind source                                | Rendering component                                  |
| ------------------ | --------------------------------------------- | ---------------------------------------------------- |
| Hero and workbench | `hero`, `workbench`, runtime readiness        | `ToolGeneratorHero` + existing `GenerationWorkbench` |
| Quick starts       | `examples.items`                              | `ToolQuickStarts`                                    |
| Inputs/outputs     | `inputOutput`                                 | `CatalogFeatureGrid`                                 |
| Example showcase   | `examples.items` and R2 asset registry        | `CatalogMasonryGallery`                              |
| Workflow           | `workflow`                                    | `CatalogSteps`                                       |
| Features           | `features`                                    | `CatalogFeatureGrid`                                 |
| Prompt guidance    | `promptGuide`                                 | `CatalogFeatureGrid`                                 |
| Use cases          | `useCases` paired with existing example media | `CatalogMediaFeatureList`                            |
| Limitations        | `limitations`                                 | `CatalogLimitations`                                 |
| FAQ                | `faq`                                         | `CatalogFaq`                                         |
| Final CTA          | `cta`                                         | `CatalogFinalCta`                                    |

Future video tool pages can reuse `CatalogMedia`, `CatalogMasonryGallery`, `CatalogMediaFeatureList`, `CatalogMediaExplainer`, and `CatalogMediaCarousel` with video assets. The component layer accepts content and assets via props and does not read translations.
