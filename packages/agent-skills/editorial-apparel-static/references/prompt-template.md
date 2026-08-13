# Editorial Apparel Prompt Template

Reconstructed reference file. This is not an original creative platform side-file; it was rebuilt from `SKILL.md` contract requirements after exact public-source searches found no usable original.

## Fill-In Template

## `generate_image` Parameters

Use this as the image call contract:

```json
{
  "model": "nano-banana-2",
  "image_urls": ["<uploaded model reference>"],
  "aspect_ratio": "<1:1 | 4:5 | 9:16 | 3:4>",
  "resolution": "2K",
  "prompt": "<filled template below>",
  "output_asset_id": "editorial-apparel:final:image"
}
```

`nano-banana-2` is required for human-reference preservation. Use `gpt-image-2` only for typography-only graphic ads with no person in frame.

```text
Create a premium editorial apparel static ad from the supplied model reference.

SUBJECT:
Preserve the subject from the reference image exactly — face, skin tone, hair, body, pose, framing, gaze. Only the garment changes.

GARMENT:
[Brand] [garment type] in [color]. [Fabric]. [Cut/silhouette/waistband/hem/stitching detail]. Replace any pre-existing branding from the reference garment with the target brand treatment: [exact wordmark/label/accent]. The reference's existing wordmark must not appear.

SET AND LIGHT:
Studio seamless backdrop, off-white to warm-grey gentle vertical gradient. Soft large key from camera-left at 45 degrees, gentle rim from camera-right. Luminous skin, no glossy retouching. No props, no furniture, no environment.

FRAMING:
[Aspect ratio]. Subject occupies the right two-thirds of the canvas. Left third reserved for typography. [Three-quarter / full] length. Slight headroom. 85mm editorial lens feel.

TYPOGRAPHY:
Top-left: "[BRAND]" wordmark in [high-contrast modern serif / clean geometric sans]. Beneath it: "[SUB-MARK]" in wide-tracked all caps.
Centre-left, stacked on three lines:
"[WORD 1]."
"[WORD 2]."
"[WORD 3]."
Below headline, small: "[SKU / fabric sub-line]."
Bottom-left: pill-shaped CTA reading "[CTA COPY] ->" with high contrast.

SPELLING GUARDS:
[word]: [W-O-R-D]. Do not misspell.

NEGATIVE:
No extra people. No props. No environment. No additional text beyond the specified typography. No watermarks. No competitor branding. No distorted letters. No duplicated limbs. No garment redesign.
```

## Moderation-Safe Apparel Rewrite

For intimates, swimwear, base layers, or underwear-like categories, avoid body-part nouns and explicit nudity terms. Do not write `torso`, `chest`, `abs`, `thigh`, `thighs`, `crotch`, `shirtless`, `nude`, `naked`, or `underwear` in the prompt body. Describe garment construction and the model/reference preservation instead.

Use brand category terms like `brief`, `trunk`, `boxer`, `bralette`, `swim short`, `base layer`, or the user's own product name.

## QA Checklist

- Model likeness preserved.
- Garment changed to briefed product only.
- Reference competitor branding removed.
- Typography is left-column, subject right-column.
- Every baked-in word is spelled correctly.
- One CTA pill only.
