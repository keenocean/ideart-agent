# Catalog showcase card grid specification

Reuse entry point: [Catalog marketing component reuse guide](./README.md).

## Purpose

Reusable, pure-props card groups for the compact “tools” and “models” sections on catalog detail pages. The component copies the geometry and interaction hierarchy of the image-generator reference while inheriting this product's theme tokens and exposing only content-backed public pages.

## Geometry

- Section padding: 64px vertically and 16px horizontally; 24px horizontal padding from the `sm` breakpoint.
- Content width: 1152px maximum.
- Group spacing: 64px between the tool and model groups.
- Heading: left-aligned serif, 24px on mobile and 30px from `sm`; description has 12px top margin, 672px maximum width, and compact muted copy.
- Grid: 20px gap; one column on mobile, two from `sm`, four from `lg` when inventory permits.
- Workflow media: 4:3, 16px radius, one border, two equal media panes.
- Model card: 16px radius, one border, 16:9 media, and 16px body padding.

## Interaction

- Every rendered card is a locale-aware link to a content-backed Catalog page.
- Candidate cards without a published, loadable target page are filtered before they reach the component. An empty group is omitted, and the entire section returns `null` when both groups are empty.
- Hover/focus changes the border and title to the system primary color. Model cards translate upward by 2px and their cover scales to 1.025.
- Visible focus rings and descriptive accessible names are required.

## Data contract

- Workflow cards receive `title`, `description`, a two-item typed R2 media tuple, and a verified `href`.
- Model cards receive `title`, `description`, one typed R2 image, and a verified `href`.
- Item counts are dynamic. Cards appear only after their exact-locale detail content is available; grids expand without a component rewrite as pages are published.
- Components do not read i18n, invent routes, or treat runtime availability as proof that a marketing page exists.

## Theme and media rules

- Use semantic system tokens only: `background`, `card`, `muted`, `foreground`, `muted-foreground`, `border`, `primary`, and ring variants.
- All rendered marketing media is resolved from the typed R2 asset registry. No reference-site URL or new local public asset is allowed.
