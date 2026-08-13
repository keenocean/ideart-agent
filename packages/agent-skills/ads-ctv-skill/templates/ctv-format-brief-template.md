# Reconstructed CTV Format Brief Template

This file is a reconstructed functional template inferred from `SKILL.md`. It is not an original creative platform side file.

```markdown
# CTV Format Brief — {PRODUCT_OR_CAMPAIGN}

Output path: `/tmp/outputs/format-brief-ctv-{product-slug}.md`

## Placement Type

{TYPE_A_LINEAR_OR_TYPE_B_INTERACTIVE}

Rationale: {why this placement type matches the user brief/reference/platform}.

## Platform / Inventory

- Target platform(s): {PLATFORMS}
- Common-denominator spec if mixed: 16:9, 1920x1080 minimum, MP4 H.264, AAC stereo 48 kHz, 15 Mbps target.
- Duration: {15s|30s|60s|10-15s hold}

## Viewing Context

Lean-back living-room viewing, sound on, 8-10 feet from screen, no clickable interaction unless the placement itself supports remote input. CTA must work through QR, spoken URL/brand recall, or retargeting.

## Hook Rules

- Brand visible or spoken by second 3.
- Product/outcome visible by second {3 for 15s / 6 for 30s}.
- Opening should feel TV-native: cinematic, clear, and confident, not social-feed pattern interruption.

## Narrative Structure

Recommended structure: {mini-narrative|problem-solution|lifestyle|before-after|Type B static product-card}.

Scene budget:
{SCENE_BUDGET}

Required downstream handoff fields:

- `placement_type`: `{linear_in_stream|interactive_pause|home_screen|post_roll_extension|shoppable_takeover}`
- `duration_seconds`: `{15|30|60|10-15 hold}`
- `aspect_ratio`: `16:9`
- `resolution_minimum`: `1920x1080`
- `container_codec`: `MP4 H.264`
- `audio_spec`: `AAC stereo, 48 kHz, broadcast-normalized`
- `safe_zone`: `3.5% title-safe inset for text, logo, QR, CTA`
- `overlay_plan`: see exact entries below

## CTA Strategy

Primary CTA: {QR|spoken URL|brand recall|remote interaction|retargeting support}.

Exact CTA copy:

- Spoken: "{SPOKEN_CTA}"
- On-screen: "{ON_SCREEN_CTA}"
- URL / QR destination: {URL_OR_PLACEHOLDER}

## Overlay Plan (Required)

Persistent overlay:

- Type: brand bug
- Copy/source: {LOGO_OR_WORDMARK}
- Timing: 0:00-end
- Position/size: {corner}, 4-6% frame width, inside 3.5% title safe

Temporal overlay 1:

- Type: {lower-third super|offer super|proof super}
- Copy: "{EXACT_COPY_OR_PLACEHOLDER}"
- Timing: {START}-{END}
- Position: {POSITION}

CTA / QR overlay:

- Copy: "{CTA_COPY}"
- Timing: {START}-{END}
- QR size/position: {SIZE_POSITION}
- Spoken reinforcement: "{SPOKEN_REINFORCEMENT}"

Legal / disclaimer overlay if needed:

- Copy: "{LEGAL_OR_NONE}"
- Timing: {START}-{END}

## Safe Zones / Typography

- Keep text, logo, CTA, and QR inside 3.5% title-safe inset.
- Body text >=60px; headlines >=90px at 1920x1080.
- Avoid bottom 8% when platform chrome may overlay.

## QA Checklist

- [ ] File saved to `/tmp/outputs/format-brief-ctv-{product-slug}.md`.
- [ ] Brand visible/spoken by second 3.
- [ ] Overlay Plan contains exact copy or explicit placeholders.
- [ ] No mobile CTA language.
- [ ] QR visible at least 5 seconds if used.
- [ ] Text is TV-readable at 8-10 feet.
- [ ] Audio is broadcast-normalized.
- [ ] MP4 H.264, AAC, 16:9, platform duration exact.
```
