# UGC Confessional Board Prompt Guide

Reconstructed reference file. This is not an original creative platform side-file; it was rebuilt from `SKILL.md` contract requirements after exact public-source searches found no usable original.

## Purpose

Create one 16:9 storyboard sheet with exactly three vertical 9:16 slots. The board maps one Seedance clip with three internal hard cuts.

## Image Reference Order

- With product, board 1: `[product, character]`.
- With product, board K>1: `[product, character, ugc:board:K-1]`.
- Product-less: `[character]`, plus previous board when K>1.
- Do not include voice assets.

## Required Template

```text
Create a 16:9 three-slot vertical storyboard sheet for a UGC ad.

LAYOUT:
Three equal 9:16 panels arranged left-to-right inside one 16:9 canvas.
Do not stack panels vertically. Do not create horizontal bands.
Do not render any labels, captions, typography, UI, numbers, or metadata text inside the image.
The `<frame>` tags below are internal control syntax only; they define order and must never appear visually.

REFERENCES:
@Image references define character, product, and continuity. Preserve identity, wardrobe continuity, product scale, label colors, and product state.

ARC ROLE:
[FULL_ARC / HOOK / HOOK+SETUP / MAIN / REVEAL / APPLY / APPLY+CLOSER / CLOSER]

<frame index="1" role="hook_or_action">
[selfie or tripod hook/action, framing band]
</frame>

<frame index="2" role="main_action">
[different action, different framing band]
</frame>

<frame index="3" role="closer_or_payoff">
[different action, different framing band]
</frame>

STYLE:
Authentic phone-native UGC, natural light, crisp enough for product recognition. Default expression register is intensely hyped unless the brief indicates calm/cold/clinical/luxury.

NEGATIVE:
No mirrors, no visible phone object, no duplicate products, no extra people, no added text, no watermarks.
```

## Arc Roles

- `FULL_ARC`: selfie hook -> tripod demo/application -> selfie closer.
- `HOOK`: three hook variations or escalating reactions.
- `HOOK+SETUP`: hook then setup product/problem.
- `MAIN`: product demonstration or proof.
- `REVEAL`: show product state change, opening, before/after, result.
- `APPLY`: application or usage beat.
- `APPLY+CLOSER`: use then recommendation.
- `CLOSER`: recap, payoff, final human reaction.

## Slot Diversity

Every board must show three different physical actions and three different framing distances:

- Tight: face/product/detail.
- Mid: torso/tabletop/action.
- Wide: body/room/context.

Regenerate if two slots repeat the same action or distance band.
