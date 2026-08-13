# Static Image From Reference Prompt Template

Reconstructed reference file. This is not an original creative platform side-file; it was rebuilt from `SKILL.md` contract requirements after exact public-source searches found no usable original.

## Image URL Order

1. User product image.
2. Brand logo, if supplied.
3. Reference layout image.

## `generate_image` Parameters

```json
{
  "model": "<gpt-image-2 for dense typography, nano-banana-2 for minimal text plus product fidelity>",
  "image_urls": [
    "<product image>",
    "<brand logo if supplied>",
    "<reference layout image>"
  ],
  "aspect_ratio": "<user override, reference ratio, or 1:1 default>",
  "resolution": "2K",
  "prompt": "<filled template below>",
  "output_asset_id": "static-reference:final:image"
}
```

Choose `gpt-image-2` for three or more distinct text blocks, logo fidelity, legible product label text, or non-English typography. Choose `nano-banana-2` only when text is minimal and packaging material fidelity is the main risk.

## Prompt Template

```text
Create one static product ad that uses the uploaded reference layout as a style/layout mold while replacing the subject and claims with the user's product.

LAYOUT:
[Aspect ratio]. Mirror the reference's spatial zones:
- [top-left/top-right logo or headline zone]
- [center hero product zone]
- [side callout stack / badges / decorative motif count]
- [bottom footer/legal zone]

Use only this exact text:
- Logo/brand: "[BRAND]"
- Headline: "[VERIFIED HEADLINE]"
- Subhead: "[VERIFIED SUBHEAD]"
- Callout 1: "[VERIFIED CLAIM]"
- Callout 2: "[VERIFIED CLAIM]"
- Footer: "[VERIFIED FOOTER]"

STYLE:
Palette: [named colors / hex if known], matching the reference unless the user asked to rebrand.
Typography feel: [rounded sans / serif / condensed / handwritten].
Decorative grammar: [motifs from reference].
Product treatment: photoreal, sharp, true packaging proportions.
Negative-space density: [open / dense / balanced].

HARD CONSTRAINTS:
Preserve the product packaging exactly as shown in the primary reference — same label, same brand marks, same colors, same proportions.
Do NOT alter the product's printed label text or brand logo colors.
Do NOT add extra text, claims, badges, graphics, ratings, discounts, or legal marks beyond what is listed above.
Do NOT reproduce competitor brand names, competitor product shapes, or competitor claims from the layout reference.
Reference image is style guidance only; the user's product is the subject.
```

## QA

After generation, inspect product label, logo, every claim, and layout zones. Regenerate at most twice; simplify if dense text remains garbled.
