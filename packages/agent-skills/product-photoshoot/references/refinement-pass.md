# Refinement Pass

Reconstruction notice: this file is reconstructed from `SKILL.md`; it is not an original creative platform side file.

Every first-pass generation gets a second pass unless the user explicitly stops the run after seeing the first asset.

## Audit Checklist

- Product identity: shape, label, material, color, scale, and category are correct.
- Hero clarity: product is the main subject, not a prop.
- Lighting: shadows are physically plausible, reflections match surface, no flat AI sheen.
- Composition: product is not cropped awkwardly; use-case aspect ratio still works.
- Text: any required label/headline is readable and exact.
- Brand fit: palette and tone match memory or brief.
- Artifact scan: no duplicate products, impossible hands, warped edges, fake marks, watermark.

## Refinement Prompt Pattern

Use the first output as `image_urls` and ask for a controlled correction:

```text
Refine the supplied image while preserving the product identity and overall composition.
[CORRECTIONS]
- <specific issue 1>
- <specific issue 2>
[LOCKED]
- Preserve product shape, color, label placement, and hero scale.
- Preserve the selected aspect ratio and marketing use case.
- Remove AI artifacts listed in the negative prompt block.
```

Do not make broad style changes during refinement unless the user asked for a style pivot.
