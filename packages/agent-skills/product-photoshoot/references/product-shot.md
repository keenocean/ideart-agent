# Product Shot Mode

Reconstruction notice: this file is reconstructed from `SKILL.md`; it is not an original creative platform side file.

Use for neutral studio backgrounds, catalog shots, packshots, Shopify, and ecommerce product photos. Default aspect ratio: `1:1`; use `4:5` for paid social portrait and `3:4` for product detail pages when requested.

## Prompt Template

```text
[SUBJECT]
<product description or supplied product reference>. Product is the only hero.

[COMPOSITION]
Studio packshot, front label readable, three-quarter angle or front-facing label, grounded contact shadow, centered with balanced breathing room.

[LIGHTING]
<lighting vocabulary>, realistic reflection control, no harsh blown highlights.

[SURFACE AND BACKGROUND]
<preset surface/background>, seamless and uncluttered.

[BRAND INTEGRATION]
Palette, material tone, and visual direction from brand memory or user brief. No competitor brands.

[STYLE REFERENCE]
<descriptor-only style anchors from photographer-references.md>.

[QUALITY CONSTRAINTS]
Photoreal commercial product photography, accurate product geometry, crisp edges, clean material texture.

[NEGATIVE PROMPTS]
<append negative-prompts.md>
```

## Presets

- `clean-studio`: matte seamless sweep, soft frontal key, neutral 5600K, catalog-safe.
- `dramatic-studio`: dark matte surface, side key, rim light, negative fill, premium shadow.
- `minimal-design`: pastel or brand-color field, geometric plinth, wide breathing room.
- `clinical-white`: high-key white sweep, accurate color, minimal shadow, regulated/health-safe.
- `warm-natural`: linen or oak surface, warm key, soft domestic tone.

## Quality Gate

Reject if the product is tiny, label is warped, surface contact is fake, or any marketplace badges/prices are invented.
