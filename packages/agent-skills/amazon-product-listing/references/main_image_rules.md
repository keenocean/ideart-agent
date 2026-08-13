# Reconstructed Main Image Rules

This file is a reconstructed functional reference inferred from `SKILL.md` and public Amazon image guidance. It is not an original creative platform side file.

## Mandatory Main-Image Contract

- Pure white background only: use `RGB 255,255,255`; no gray sweep, gradient, shadowed tabletop, lifestyle scene, props, badges, text, watermark, inset, border, icon, packaging callout, or decorative graphic.
- Show only what the buyer receives. Include accessories only when they are included in the purchase.
- Product must be the dominant subject, centered, fully visible, and cropped with enough margin that no edge is cut.
- Target about 85% frame occupancy while keeping the whole product readable.
- Keep product color, label, materials, and proportions faithful to the input reference.
- Use a clean front or front-three-quarter angle. For bottles, cans, boxes, bags, devices, and appliances, a subtle 35-45 degree turn is preferred when it reveals depth without hiding the label.
- No human model unless the product category requires worn display, such as apparel, shoes, jewelry, eyewear, or wearable accessories.
- Do not imply quantity, size, bundle contents, flavor, model, or variant not visible in the source.

## Suppressed-Listing Triggers To Avoid

- Non-white main background.
- Promotional text, star ratings, claims, coupons, sale stickers, "best seller", "new", "limited", warranty badges, or shipping badges.
- Logo/watermark added outside the actual product packaging.
- Multiple product duplicates that imply a multi-pack when the offer is a single item.
- Product smaller than thumbnail-readable size.
- Blurry, low-resolution, distorted, or AI-mutated packaging.
- Extra props or scene objects that could be confused as included items.
- Cropped apparel or accessories that make size or contents ambiguous.

## Apparel-Specific Rules

- Clothing must be shown on a model or as a clean flat/ghost-mannequin presentation only when appropriate for the category.
- Do not use seated, kneeling, or complex lifestyle poses for the main image.
- Show the full item clearly; avoid cropped limbs, dramatic poses, or styling props.
- Shoes should show the pair unless sold as a single shoe. Use a clean 3/4 angle on white.

## Prompt Checklist

Before calling `generate_image`, verify the prompt states:

1. Pure white Amazon-compliant background.
2. Product only, no props, no text overlays.
3. Faithful label, color, material, and shape from reference.
4. Centered full product, about 85% of frame.
5. High-resolution commercial product photography.
6. `aspect_ratio="1:1"`, `resolution="2K"`, `model="nano-banana-2"`.
