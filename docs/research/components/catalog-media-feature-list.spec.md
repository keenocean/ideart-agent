# CatalogMediaFeatureList component specification

## Purpose

A reusable image/video plus copy section for use cases, capability explanations, and future tool pages.

## Props

- Section `title` and optional `description`.
- `items`: id, title, description, optional eyebrow/bullets, typed media, and `mediaPosition: left | right`.
- `variant`: `compact` (image reference) or `banded` (video reference).

## Compact geometry

- 1152px maximum width, two equal columns, 56px desktop gap.
- 96px between rows; 16px media radius.
- Copy uses 24px serif heading and readable 14–16px body.

## Banded geometry

- Full-width surface bands with a 1280px inner grid.
- Two 560px columns and up to 112px desktop gap; 80px vertical row padding.
- 16:9 media wrapper, 28px radius, 4px theme-border frame.
- Alternate rows use the secondary surface token, not copied reference colors.

## Responsive behavior

- At `md` and above, `mediaPosition` controls grid order.
- Below `md`, all rows are one column and media is first, regardless of desktop position.
- Images and videos use the same `CatalogMedia` rendering path.
