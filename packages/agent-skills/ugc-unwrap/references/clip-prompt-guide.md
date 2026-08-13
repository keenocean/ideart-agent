# UGC Unboxing Clip Prompt Guide

Status: reconstructed from `SKILL.md`; this is not an original creative platform side file.

Compose one Seedance prompt per unboxing board. One board becomes one 9:16 clip
with four internal hard cuts.

## Tool-Side Reference Images

Pass image references to `generate_scene_video` in this order, omitting absent
assets while preserving relative order:

- Board 1: `[character, product, package]`.
- Board K > 1: `[character, product, package, unboxing:board:K-1]`.

Never include `persona:<name>:voice` or any voice-only asset in
`reference_images`. The voice routes through the `{{speak}}` span plus matching
`dialogue[]` entry.

## Prompt Shape

```text
Duration: <clip_duration>s. Aspect ratio: 9:16. Four internal hard cuts.
Start image is a 21:9 four-panel unboxing board; use it as narrative guidance,
not as literal split-screen layout.

Cut 1 (<seconds>s) - <PACKED or continuation>:
<5+ micro-beats, at least one within-cut motion beat>
Hard cut to.

Cut 2 (<seconds>s) - <REVEAL or exploration>:
<5+ micro-beats, package/product motion>
Hard cut to.

Cut 3 (<seconds>s) - <PRODUCT-FOCUS or detail>:
<5+ micro-beats, feature/texture/scale>
Hard cut to.

Cut 4 (<seconds>s) - <SATISFACTION or payoff>:
<5+ micro-beats, expression settles, product visible>

Audio:
<optional Board 1 non-verbal sounds, then monologue>
{{speak:persona:<name>}}<monologue_segment verbatim>{{/speak}}

Quality suffix: realistic iPhone UGC, natural skin texture, ordinary home
lighting, casual handheld imperfections, no glossy commercial polish, no AI
smoothness, no phone visible.
```

## Time Slicing

| Clip duration | Cut 1 | Cut 2 | Cut 3 | Cut 4 |
| ------------: | ----: | ----: | ----: | ----: |
|          4-6s |    1s |  1.5s |  1.5s |    1s |
|         7-10s |    2s |  2.5s |  2.5s |    2s |
|        11-15s |    3s |    4s |    4s |  3-4s |

Keep the reveal and product-focus cuts long enough to read.

## Audio Rules

- Board 1 may include up to three short bracketed trailer sounds before speech,
  such as `[excited gasp]`, `[box tape tears]`, or `[soft laugh]`.
- Boards K > 1 must open mid-thought. No greetings, no `so this is`, no product
  re-introduction.
- No repeated sentence or near-identical phrase across boards.
- The `dialogue[]` text must match the `{{speak}}` span exactly.

## Expression Arc

Board 1:

1. Anticipation.
2. Peak surprise.
3. Focused admiration.
4. Settled satisfaction.

Boards K > 1:

- Continue from prior emotional state.
- Avoid resetting to first-discovery surprise unless a new feature is revealed.

## Camera Language

- `TRIPOD`: locked, no camera movement words.
- `SELFIE`: camera is the phone, but no phone object appears.
- `FIRST-PERSON`: hands/forearms enter frame; camera is viewer viewpoint.
- `MACRO`: product or packaging detail only.

Forbidden for tripod cuts: `handheld`, `shake`, `drift`, `wobble`, `floating`,
`orbit`, `dolly`.

## Product-Type Action Sequences

- Beauty: open cap, swatch/apply, texture close-up, satisfied skin/result.
- Apparel/accessory: remove from tissue, hold up, detail stitch/material, try/pose.
- Gadget: open box, remove device, power/connect, use result.
- Food/drink: open package, pour/mix, texture/taste, satisfied close.
- Home/kitchen: unpack, assemble or place, use on target, finished result.

## Continuity Locks

- No phone object in frame.
- No mirror selfie wording.
- Never re-close a previously opened product across boards.
- Box is gone after Board 1 Cut 1 unless visible as background mess.
- Product stays one instance.
