# UGC Unboxing Board Prompt Guide

Status: reconstructed from `SKILL.md`; this is not an original creative platform side file.

Use this guide to compose each 21:9 four-slot unboxing board.

## Reference Order

Typical order:

1. `@Image1 = product reference`, if present.
2. `@Image2 = character/persona reference`.
3. `@Image3 = package reference`, if present.
4. `@Image4 = previous board`, for K > 1 only.

Omit absent assets but preserve relative order.

## Board Roles

### Board 1: `BOARD_1_CANONICAL_UNBOXING`

1. `PACKED`: sealed delivery box; product is not visible.
2. `REVEAL`: box opened, packing paper and first glimpse.
3. `PRODUCT-FOCUS`: product held or placed for inspection.
4. `SATISFACTION`: character satisfied with product; box gone.

### Board K > 1: `BOARD_K_POST_REVEAL`

Continue post-reveal exploration. Do not reintroduce the sealed box. Carry product
state, cap/lid state, wardrobe, lighting, and setting continuity from the previous
board.

## Required Prompt Template

```text
Create one 21:9 horizontal four-panel iPhone UGC unboxing storyboard sheet.
The four panels must sit side-by-side in one row, equal width, separated by thin
vertical dividers. Do not stack panels vertically. Do not create horizontal bands.
Do not label panels as SLOT 1, SLOT 2, SLOT 3, SLOT 4. No title text, no arrows,
no captions, no packaging callout typography.

Reference order:
<map @Image references here>

Preserve character identity, wardrobe, age, hair, and face from the persona
reference. Preserve product appearance if a product reference is provided.
Render a natural iPhone UGC scene, not a studio advertisement.

The leftmost quarter shows <sealed package for Board 1; post-reveal continuation
for K>1>.

The next quarter shows <opening action, packing paper, product first glimpse, or
continued interaction>.

The next quarter shows <product close focus, texture, feature, scale, or use>.

The rightmost quarter shows <settled reaction, product in hand/use, box gone>.

Style: authentic phone-shot unboxing in a real home environment, natural tabletop
mess, imperfect packing paper, casual expression, ordinary lighting, no studio
product photography, no commercial polish.
```

## Physical Continuity

- Board 1 panel 1: box closed, product hidden.
- Board 1 panel 2: tape open, flaps open, packing paper disturbed.
- Board 1 panel 3: product visible and inspectable.
- Board 1 panel 4: box gone or pushed out of focus.
- Boards K > 1: never re-close the box; never return product to unopened state.
- Cap/lid state only moves forward unless a script explicitly shows closing it.

## POV Cadence

Use a mix across slots:

- Tripod tabletop medium.
- Selfie-facing reaction.
- Over-the-shoulder opening.
- First-person hands opening package.
- Macro product detail.

Avoid four identical tabletop shots.

## Hand and Weight Logic

- Small/light products: one hand can lift; second hand may gesture or stabilize.
- Medium products: two hands or table support.
- Heavy products: never lifted casually; reveal on floor/table.
- Sharp or fragile items: careful grip, no careless tossing.

## Packing Paper and Box Behavior

- Packing paper should accumulate naturally, not vanish between reveal and focus.
- Do not show the product before the reveal.
- Do not multiply boxes.
- Do not show brand packaging unless provided or specified.

## Hard Bans

- Phone object visible in mirror/selfie.
- Product visible in Board 1 panel 1.
- Box reintroduced after it is gone.
- Studio product photography.
- Text labels, arrows, slot captions.
- Extra characters unless requested.
