# Reconstructed Main Image Prompt Template

This file is a reconstructed functional template inferred from `SKILL.md`. It is not an original creative platform side file.

Use with `model="nano-banana-2"`, `aspect_ratio="1:1"`, `resolution="2K"`, and `image_urls=["product:main"]`.

```text
Create an Amazon-compliant main listing image for [BRAND] [PRODUCT_NAME], [CATEGORY], using the supplied product reference as the exact source of truth.

Show the real product only, centered on a pure white RGB 255,255,255 background. Keep the product color, label design, logo placement, packaging shape, materials, size relationships, flavor/variant/model, and visible details faithful to the reference. Use clean professional catalog lighting, soft natural product shadows only if they do not tint the background, crisp focus, and high-resolution commercial product photography.

Composition: full product visible, no cropped edges, product fills about 85% of the square frame, front or subtle 35-45 degree three-quarter angle chosen to make the label and product shape clear.

Strict exclusions: no props, no lifestyle background, no hands, no added text, no badges, no rating stars, no sale claims, no watermark, no border, no duplicate products unless the offer is explicitly a multi-pack, no extra accessories unless included in the purchase, no invented claims, no AI-mutated label text.
```

## Fill-ins

- `[BRAND]`: as read from package or product page; use `{BRAND}` if unknown.
- `[PRODUCT_NAME]`: include variant/flavor/model only when verified.
- `[CATEGORY]`: short category label used to select angle/category conventions.
