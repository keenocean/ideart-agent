# CatalogMasonryGallery component specification

## Geometry

- Maximum width: 1152px for image-tool pages; 1280px may be selected by the video variant.
- Gaps: 16px for the image variant and 8px for the dense video variant.
- Image variant distributes items into balanced deterministic lanes: 3 desktop, 2 tablet, 1 mobile.
- Dense/video variant uses CSS columns with break-inside avoidance: 4 desktop, 3 tablet, 2 mobile.
- Column count is capped by item count so one or two examples never render empty lanes.
- Media keeps its intrinsic aspect ratio; wrappers use 16px radius for image variant and up to 24px for dense video variant.

## Interaction

- Each item is a real button with title/alt context and visible focus.
- Clicking opens a reusable preview dialog with position, media, title, prompt, navigation, and optional actions.
- `onUsePrompt` is supported for all items.
- `onUseAsReference` is optional and is omitted unless supplied by the page controller.
- The dense variant may set `collapsedHeight`; a bottom fade and expand action reveal the full gallery.

## Data contract

Each item contains `id`, `title`, `description`, `prompt`, and typed `media`. Image and video items may coexist in the same gallery.
