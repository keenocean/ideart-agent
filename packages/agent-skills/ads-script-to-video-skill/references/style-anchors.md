# Reconstructed Style Anchors

This file is a reconstructed functional reference inferred from `SKILL.md`. It is not an original creative platform side file.

## Tone Buckets

### Legal / Professional / B2B

- Visual anchor: composed, credible, clean, moderate contrast, no frantic cutting.
- Camera: slow push-in, locked tripod, office/table/document details, 35-85mm lens language.
- Palette: neutral, navy, charcoal, cream, restrained accent.
- Caption preset: `editorial-clean`; font: Alice or clean serif/sans mix.
- Aspect default: `16:9` unless script explicitly says vertical/social.

### DTC / Lifestyle / Wellness

- Visual anchor: warm natural light, tactile product moments, home or routine context.
- Camera: handheld-soft or stabilized lifestyle, macro product cutaways.
- Palette: warm neutrals, product accent colors, soft shadows.
- Caption preset: `editorial-soft`; font: humanist sans.
- Aspect default: `9:16` for social scripts, `1:1` for feed scripts.

### Hype / Energy / Fitness / Gen-Z

- Visual anchor: high movement, fast action, bold close-ups, energetic transitions.
- Camera: handheld, whip cuts, quick push-ins, punchy product shots.
- Palette: high contrast, bold brand accent, but preserve product fidelity.
- Caption preset: `kinetic-bold`; font: heavy sans.
- Aspect default: `9:16`.

### Tech / SaaS

- Visual anchor: UI, product workflow, clean device/screen compositions.
- Camera: controlled motion, screen recordings, cursor/interaction moments, no fake UI if script supplies real UI.
- Palette: dark or clean monochrome with one accent.
- Caption preset: `mono-modern`.
- Aspect default: `16:9` for demo/explainer, `9:16` for short social.

### UGC / Testimonial

- Visual anchor: creator in natural setting, direct eye contact, lightly imperfect framing.
- Camera: phone-like handheld, simple cuts, product held in frame.
- Palette: natural skin tones, no heavy grade.
- Caption preset: `outlined-text` unless script specifies none.
- Aspect default: `9:16`.

## Director Prefix Template

Prefix each `visual_description` with one sentence:

```text
Style anchor: [TONE_BUCKET] — [camera grammar], [lighting], [palette], faithful to the script visual; no invented beats.
```

Then paste the script's Visual column verbatim.

## Director Payload Checklist

For each scene, build a payload with these exact fields from the script and setup stages:

- `vo_text`: script VO exactly, except documented duration trimming after user accepts condensing.
- `visual_description`: style anchor prefix plus the script Visual column verbatim.
- `motion_prompt`: timestamped beat list derived only from the visual column.
- `voice_asset_id`: same value for every scene unless the script names multiple speakers.
- `kling_voice_id`: same value paired with the voice asset.
- `brand`: brand from script or one product-page fetch.
- `product_1_title`: product/service name from script or fetch.
- `product_1_description`: one-sentence description from script or fetch.
- `duration`: scene seconds after any cap/condensing decision.

Do not add unsupported provider fields, extra scenes, rewritten VO, or invented overlay copy.

## Caption Preset Picker

- Legal/professional/B2B: `editorial-clean`.
- DTC/lifestyle/wellness: `editorial-soft`.
- Hype/energy/TikTok: `kinetic-bold`.
- Tech/SaaS: `mono-modern`.
- CTA/end card: use `mute_captions=true` and text overlays only.
