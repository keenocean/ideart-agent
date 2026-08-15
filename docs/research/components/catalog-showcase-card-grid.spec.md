# Catalog showcase card grid specification

## Purpose

Reusable, pure-props card groups for the compact “tools” and “models” sections on catalog detail pages. The component copies the geometry and interaction hierarchy of the image-generator reference while inheriting this product's theme tokens and only exposing real runtime capabilities.

## Geometry

- Section padding: 64px vertically and 16px horizontally; 24px horizontal padding from the `sm` breakpoint.
- Content width: 1152px maximum.
- Group spacing: 64px between the tool and model groups.
- Heading: left-aligned serif, 24px on mobile and 30px from `sm`; description has 12px top margin, 672px maximum width, and compact muted copy.
- Grid: 20px gap; one column on mobile, two from `sm`, four from `lg` when inventory permits.
- Workflow media: 4:3, 16px radius, one border, two equal media panes.
- Model card: 16px radius, one border, 16:9 media, and 16px body padding.

## Interaction

- Workflow cards are real buttons that apply a truthful prompt preset and return focus to the generator.
- Model cards are buttons only when a real selectable runtime model exists. Non-interactive inventory is rendered as an article, never as a fake link.
- Hover/focus changes the border and title to the system primary color. Model cards translate upward by 2px and their cover scales to 1.025.
- Visible focus rings and descriptive accessible names are required.

## Data contract

- Workflow cards receive `title`, `description`, a two-item typed R2 media tuple, and a prompt.
- Model cards receive `title`, `description`, one typed R2 image, and an optional model key/action.
- Item counts are dynamic. The current image tool may show one model because the runtime exposes only GPT Image 2; the grid must expand without a component rewrite when more models are published.
- Components do not read i18n and do not invent routes.

## Theme and media rules

- Use semantic system tokens only: `background`, `card`, `muted`, `foreground`, `muted-foreground`, `border`, `primary`, and ring variants.
- All rendered marketing media is resolved from the typed R2 asset registry. No reference-site URL or new local public asset is allowed.
