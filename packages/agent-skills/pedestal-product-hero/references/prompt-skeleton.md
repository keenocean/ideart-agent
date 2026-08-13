# Prompt Skeleton

Reconstructed reference file. This is not an original creative platform side-file; it was rebuilt from `SKILL.md` contract requirements after exact public-source searches found no usable original.

## `generate_image` Parameters

```json
{
  "model": "<nano-banana-2 without headline, gpt-image-2 with headline/non-English text>",
  "image_urls": ["<hero product image only>"],
  "aspect_ratio": "<1:1 | 4:5 | 9:16>",
  "resolution": "1K",
  "prompt": "<filled skeleton below>",
  "output_asset_id": "pedestal-product-hero:final:image"
}
```

Do not pass a layout reference image unless the user explicitly insists; describe the pedestal layout in prose to avoid reference-content leakage.

```text
Create a clean editorial pedestal-style product hero image.

SUBJECT:
Use the supplied product image as the only subject reference. Preserve the packaging shape, front label, printed typography, brand marks, colors, proportions, and material finish exactly. The product stands upright, centered on a round pale maple/birch wood disc pedestal.

COMPOSITION:
[aspect ratio]. Warm beige seamless paper backdrop, product in the lower-middle of the frame, front label squared to camera. Pale wood round disc pedestal, 3-4 cm tall, smooth straight edge, faint end-grain visible. Product footprint fits naturally on the disc.

SPILLAGE:
[exact product contents] appear in 2-3 small natural clusters around the pedestal base, with a few stragglers. Organic, not symmetrical, not a ring. The spillage is only the product's own contents.

LIGHTING:
Single soft warm key from upper right, mild warm fill from below-left. Long soft diagonal cast shadow falling to lower left of the pedestal, feathered and warm. No rim light, no specular hotspots.

CAMERA:
Slight high eye-line, 5-10 degrees down, straight-on to label, 50mm equivalent. Cinematic editorial still-life.

[OPTIONAL HEADLINE BLOCK]

NEGATIVE:
No people, no hands, no lifestyle scene, no props, no leaves, no spoon, no fabric, no other SKUs, no star ratings, no callout pills, no ribbons, no price flashes, no added brand wordmark, no CTA, no extra text, no wall/floor seam.

SPILLAGE NEGATIVE:
NO [specific wrong reference contents]. Only [exact contents].
```

## Model Choice

- No headline: `nano-banana-2`, 1K or higher.
- Headline or non-English text: `gpt-image-2`.

## Image Inputs

Pass only the product image unless the user explicitly insists on also passing a layout reference.
