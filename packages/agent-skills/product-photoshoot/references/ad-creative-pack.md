# Ad Creative Pack Mode

Reconstruction notice: this file is reconstructed from `SKILL.md`; it is not an original creative platform side file.

Use for coordinated static ad variants for Meta, TikTok, Pinterest, and Google Ads. Default aspect ratios: `1:1` and `4:5`; add `9:16` when story placement is requested.

## Variant Set

- Product hero: clean product-first ad.
- Benefit-led: headline plus visual proof.
- Lifestyle proof: product in use.
- Offer or CTA: only if user supplied offer details.
- Social proof: only if user supplied real proof.

## Typography Notes

If the ad contains on-image headlines, switch to `gpt-image-2`. Keep copy short and exact. Do not invent prices, reviews, star ratings, app badges, compliance marks, or marketplace badges.

## Prompt Template

```text
[PLACEMENT]
<platform and aspect ratio>.

[AD CONCEPT]
<variant name and one-sentence objective>.

[SUBJECT]
<product, preserved from reference when supplied>.

[LAYOUT]
Clear first-read product, short text if required, thumb-stopping but brand-safe.

[CLAIM SAFETY]
Only use claims supplied by the user. No fabricated proof.
```
