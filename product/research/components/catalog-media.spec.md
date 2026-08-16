# CatalogMedia component specification

## Purpose

Render a typed marketing image or video without leaking page content, i18n, storage lookup, or runtime logic into the component.

## Props

- `asset`: `MarketingAsset` plus localized `alt` text.
- `className`: optional layout styling.
- `fit`: `cover` or `contain`, default `cover`.
- `priority`: image loading priority only.
- `controls`: video controls, default false.
- `autoPlay`: viewport-aware muted looping video, default true for previews.

## Rendering contract

- Images emit declared width, height, alt, async decoding, and lazy loading unless prioritized.
- Videos require a typed poster and reuse `ViewportVideo`; no eager multi-video downloads.
- All media fills its wrapper and follows the requested object-fit.
- The component contains no R2 upload logic and accepts only already-registered assets.

## Accessibility

- Informative images require localized alt text; decorative images pass an empty alt.
- Controlled videos expose native controls. Muted decorative previews are not keyboard targets.
- Reduced-motion behavior is delegated to `ViewportVideo`.
