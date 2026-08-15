# Catalog marketing component reuse guide

Start here before adding or reusing a public tool/model-page section. The
components in `src/components/catalog/` are durable, pure-props UI; localized
content and product wiring stay outside them.

## Ownership boundaries

| Layer            | Responsibility                                                    | Canonical location                            |
| ---------------- | ----------------------------------------------------------------- | --------------------------------------------- |
| Route            | Load the localized tool/model entry and metadata                  | `src/routes/tools/$slug.tsx`                  |
| Block            | Read shared i18n, resolve R2 asset IDs, connect generator actions | `src/blocks/tool-detail.tsx`                  |
| Page composition | Arrange the durable catalog sections                              | `src/components/catalog/tool-detail-page.tsx` |
| Content          | Supply localized copy, prompts, asset references, and inventories | `src/content/tools/pages/<slug>/{en,zh}.ts`   |
| Media registry   | Define verified immutable R2 images/videos and metadata           | `src/config/catalog/assets.ts`                |
| Components       | Render props without reading i18n or importing runtime modules    | `src/components/catalog/*.tsx`                |

## Component index

| Component                   | Use it for                                               | Important inputs                                              | Media                                         |
| --------------------------- | -------------------------------------------------------- | ------------------------------------------------------------- | --------------------------------------------- |
| `ToolDetailPage`            | A complete tool detail/marketing page                    | `content`, `workbench`, prompt/model callbacks, related items | Image + video                                 |
| `CatalogShowcaseCardGrid`   | Reference-aligned Tools and Models card groups           | Dynamic workflow/model groups and real selection callbacks    | Workflow: two images; model: one image        |
| `CatalogMasonryGallery`     | A quantity-driven example gallery with optional collapse | `items`, preview labels, optional prompt callback             | Image + video                                 |
| `CatalogMediaCarousel`      | “Get Inspired” horizontal snap rail                      | `items`, preview labels, optional prompt callback             | Image + video; intended for video inspiration |
| `CatalogMediaFeatureList`   | Reusable alternating use-case rows                       | `items`, `mediaPosition`, `variant`                           | Image + video                                 |
| `CatalogMediaExplainer`     | One split copy/media explainer card                      | title/copy/optional eyebrow and footnote                      | Image + video                                 |
| `CatalogExploreSection`     | Grouped input/output and workflow cards                  | Copy groups                                                   | No required media                             |
| `CatalogFeatureGrid`        | Responsive feature cards                                 | Heading and copy items                                        | Optional icons                                |
| `CatalogSteps`              | Numbered process cards                                   | Heading and ordered copy items                                | No required media                             |
| `ToolQuickStarts`           | Compact prompt presets next to the workbench             | Gallery items and selection callback                          | Image + video                                 |
| `CatalogLimitations`        | Safety or limitation bullets                             | Heading and string items                                      | None                                          |
| `CatalogFaq`                | Accessible native FAQ disclosures                        | Heading and question/answer items                             | None                                          |
| `CatalogFinalCta`           | Final locale-aware CTA card                              | Copy, links, and layout variant                               | None                                          |
| `CatalogMedia`              | Typed responsive media primitive                         | `CatalogMediaAsset`                                           | Image + viewport-aware video                  |
| `CatalogMediaPreviewDialog` | Shared full-screen media/prompt viewer                   | Active item, labels, navigation, actions                      | Image + video                                 |
| `CatalogSectionHeading`     | Consistent compact/editorial section heading             | Title, description, alignment, size                           | None                                          |

Detailed geometry and behavior:

- [Supporting sections](./catalog-marketing-sections.spec.md)
- [Tools and Models cards](./catalog-showcase-card-grid.spec.md)
- [Video inspiration carousel](./catalog-video-inspiration-carousel.spec.md)

## Preferred reuse path: a complete tool page

Do not copy the existing AI image page JSX. Add the new page's localized
content and asset references to the content layer, then let `ToolDetail` resolve
assets and pass the result to `ToolDetailPage`. This preserves the shared
workbench, gallery, tools/models cards, video carousel, use cases, FAQ, and CTA
without creating a page-specific component fork.

The current composition derives sections as follows:

```text
examples.items (image) -> quick starts + masonry gallery
examples.items (video) -> CatalogMediaCarousel
showcase.workflows      -> content-backed tool links
showcase.models         -> content-backed model links
useCases.items          -> alternating CatalogMediaFeatureList rows
```

Only publish a card when its target Catalog page has loadable content in the
active locale. Runtime support alone does not make a marketing page real.
Inventory counts remain dynamic; do not pad a grid with fake items.

## Standalone alternating image/video rows

```tsx
import {
  CatalogMediaFeatureList,
  type CatalogMediaFeatureItem,
} from '@/components/catalog/catalog-media-feature-list';

const items: CatalogMediaFeatureItem[] = [
  {
    id: 'product-demo',
    eyebrow: 'Use case',
    title: 'Turn a product still into a short demo',
    description: 'Explain what changes and why this workflow is useful.',
    bullets: ['Accepts images or videos', 'Keeps copy outside the component'],
    media: resolvedR2Asset,
    mediaPosition: 'left',
  },
  {
    id: 'social-variation',
    title: 'Create a second visual direction',
    description: 'Alternate the media position without a second component.',
    media: anotherResolvedR2Asset,
    mediaPosition: 'right',
  },
];

<CatalogMediaFeatureList
  id="use-cases"
  title="Use cases"
  description="Reusable image and video workflows."
  items={items}
  variant="banded"
/>;
```

Use `variant="compact"` for the current tool-page rhythm and `"banded"` for
the wider video-reference treatment.

## Standalone inspiration carousel

```tsx
import { CatalogMediaCarousel } from '@/components/catalog/catalog-marketing-sections';
import type { CatalogGalleryItem } from '@/components/catalog/catalog-masonry-gallery';

const items: CatalogGalleryItem[] = resolvedExamples;

<CatalogMediaCarousel
  title="Get inspired"
  description="Open a clip to inspect its full prompt."
  items={items}
  labels={localizedPreviewLabels}
  onUsePrompt={(item) => applyPrompt(item.prompt)}
/>;
```

Any item count is valid. The rail measures the rendered card width, scrolls by
one card plus its gap, and wraps at either end. Omit `onUsePrompt` when the page
is inspiration-only.

## Standalone Tools and Models cards

```tsx
import { CatalogShowcaseCardGrid } from '@/components/catalog/catalog-showcase-card-grid';

<CatalogShowcaseCardGrid
  workflows={localizedWorkflowGroup}
  models={localizedModelGroup}
/>;
```

Resolve every item to a content-backed locale-aware `href` before rendering.
The component omits empty groups and never renders fake links or buttons for
unpublished pages.

## Media and theme rules

1. Upload production page media to R2 first, then register its immutable URL,
   kind, MIME type, dimensions, byte size, and video poster in
   `src/config/catalog/assets.ts`.
2. Content files store typed asset IDs plus localized alt text. Blocks resolve
   those IDs; reusable components never receive unverified raw URLs.
3. Components use semantic theme tokens such as `background`, `card`, `muted`,
   `foreground`, `border`, `primary`, and their foreground/ring variants. Do
   not copy reference-site hex, RGB, black, or white colors.
4. Components never read Paraglide messages. Blocks/content own localization;
   components receive all visible strings and accessible labels through props.
5. Preserve reduced-motion behavior, keyboard focus, touch scrolling, video
   `preload="none"`, and the shared preview dialog when reusing media sections.

## Verification for a new consumer

- Check English and Chinese content.
- Check desktop and mobile geometry with the actual inventory count.
- Check light and dark theme colors.
- Exercise prompt/model callbacks and the preview dialog.
- Run `pnpm exec tsc --noEmit`, relevant tests, and `pnpm build`.

Future implementation sessions should read this index first, then the linked
component-specific specification before changing geometry or interaction.
