# Catalog video inspiration carousel specification

Reuse entry point: [Catalog marketing component reuse guide](./README.md).

## Purpose

Reusable horizontal inspiration rail for video-capable marketing pages. It matches the `Get Inspired by AI-Generated Videos` reference behavior while reusing the catalog's typed media, viewport-aware playback, and full-screen preview dialog.

## Geometry

- Section padding: 80px vertically on mobile and 112px from `sm`.
- Heading container: 1024px maximum with 24px horizontal padding and centered copy.
- Editorial heading: 36px/1.08 on mobile, 48px from `sm`; description is 16px on mobile and 18px from `sm`.
- Rail: 32px top margin on mobile, 40px from `sm`; 20px item gap; 24px horizontal scroll padding and page padding; 16px vertical padding.
- Card width: 85vw up to 960px; 24px radius; one border; 16:9 media.
- Desktop copy is an image overlay. Mobile copy is a separate 20px-padded card body with an 18px title and four-line description clamp.
- Previous/next controls are 44px circles, placed 8px from the rail viewport edges and vertically centered over the media region.

## Interaction

- The rail uses horizontal mandatory snap and hides browser scrollbars without disabling touch or trackpad scrolling.
- Previous/next controls scroll by one measured card width plus the 20px gap; they wrap at the ends.
- Each card is a button that opens the shared full-screen preview dialog.
- Video sources keep `preload="none"` and load/play only near the viewport. Reduced-motion preferences prevent autoplay and smooth scrolling.
- Hover/focus scales media to 1.03, reveals the prompt on desktop, and preserves title/description copy on mobile.
- Keyboard navigation, visible focus, dialog close, next/previous, download, and optional prompt action remain available.

## Data contract

- Accept any number of `CatalogGalleryItem` records containing typed image or video media; the current consumer filters to the 12 existing R2 MP4 assets.
- Copy and labels arrive entirely through props. The component does not read i18n.
- The section must remain reusable on future video tool/model pages without importing page content or runtime modules.

## Theme and media rules

- Geometry follows the reference; color follows system tokens. No copied reference-site hex values are allowed.
- All media URLs must come through the typed R2 asset registry. Reference-site assets are evidence only and are never rendered directly.
