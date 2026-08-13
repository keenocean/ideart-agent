# Negative Prompts

Reconstruction notice: this file is reconstructed from `SKILL.md`; it is not an original creative platform side file.

Append this block to every product-photoshoot generation prompt. Keep it descriptive rather than adversarial.

## Universal Suppression Block

Avoid AI artifacts: warped logo text, misspelled labels, extra labels, duplicate products, melted geometry, plastic sheen, over-smoothed surfaces, synthetic skin, waxy hands, extra fingers, broken fingernails, distorted packaging seams, inconsistent reflections, impossible shadows, floating contact shadows, low-resolution texture, generic stock-photo lighting, cluttered background, unrelated props, competitor branding, watermark, signature, frame border, screenshot UI, fake marketplace badges.

## Product-Fidelity Suppression

- Do not change the product category, package shape, closure, dispenser, cap, label placement, colorway, material finish, or visible ingredients.
- Do not invent certification marks, QR codes, barcodes, nutrition facts, prices, ratings, or discount badges unless the user supplied them.
- Do not hide the product behind props, hands, fabric, foam, splash, or motion blur.

## People And Hands

- Use natural adult hands only when the mode asks for a person or hands.
- Avoid extra fingers, fused fingers, unnatural grip, overly glossy skin, incorrect scale, and hands covering critical product details.

## Typography

- If text is not the deliverable, keep on-image text limited to the real product label.
- If text is the deliverable, use `gpt-image-2` and follow `typography.md`.
