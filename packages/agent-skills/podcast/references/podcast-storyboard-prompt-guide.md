# Podcast Storyboard Prompt Guide

Reconstructed reference file. This is not an original creative platform side-file; it was rebuilt from `SKILL.md` contract requirements after exact public-source searches found no usable original.

## Purpose

Generate B&W 4-panel storyboard sheets that lock one chunk's shot grammar. Use `podcast:composite` plus both personas as references. The sheet is a map for Seedance, not final art.

## Global Storyboard Rules

- Strict black line art on pure white `#FFFFFF`.
- Four panels in a clean 2x2 grid or left-to-right strip; no color, no grey wash, no typography labels.
- Use the composite as blocking ground truth.
- Preserve 180-degree line across all panels.
- Never have either host look into camera.
- First panel framing must differ from last panel framing.
- Last active panel lands on listener close-up.
- If persona refs are colored, convert them mentally to grayscale line reference; do not carry color into the sheet.
- The `<frame>` tags in the templates are internal control syntax only. They define storyboard order and must never be rendered as visible text.

## Pattern A: Dialog Turn

```text
Create a strict black-and-white 4-panel podcast storyboard on a pure white background.

Reference @Image1 is the composite room and blocking. @Image2 is the host, @Image3 is the guest.

Pattern A: dialog turn.
<frame index="1" role="wide-two-shot">locked wide two-shot, both seated with microphones, host camera-left and guest camera-right, inward gaze.</frame>
<frame index="2" role="speaker-closeup">close-up of current speaker, mic in lower foreground, eye-line biased toward off-frame partner.</frame>
<frame index="3" role="shifted-wide">wide two-shot from a slightly shifted but same-side angle, still respecting 180-degree line.</frame>
<frame index="4" role="listener-closeup">close-up of listener reacting subtly, mic visible, mouth closed.</frame>

No color, no shading, no labels, no subtitles, no visible frame names, no metadata text, no camera-facing gaze, no extra people.
```

## Pattern B: Monologue Continuation

```text
Create a strict black-and-white 4-panel podcast storyboard on pure white.

Pattern B: monologue continuation.
<frame index="1" role="speaker-closeup">close-up of speaker, calm talking posture, mic visible.</frame>
<frame index="2" role="wide-two-shot">locked wide two-shot, listener attentive.</frame>
<frame index="3" role="alternate-speaker-closeup">close-up of same speaker from a different same-side angle, no eye contact with camera.</frame>
<frame index="4" role="listener-closeup">close-up of listener, mouth closed, subtle response.</frame>

Maintain the same room, same table, same 180-degree line, and same inward eyelines from the composite.
```

## Pattern C: Reaction Emphasis

```text
Create a strict black-and-white 4-panel podcast storyboard on pure white.

Pattern C: reaction emphasis.
<frame index="1" role="wide-before-reveal">locked wide two-shot before the reveal.</frame>
<frame index="2" role="speaker-key-line">close-up of speaker delivering the key line.</frame>
<frame index="3" role="wide-reaction">wide two-shot where both react naturally, restrained expression.</frame>
<frame index="4" role="listener-closeup">close-up of listener absorbing the beat, mouth closed.</frame>

No theatrical reaction, no mugging, no extra people, no color, no labels, no visible frame names, no metadata text.
```

## QA

Regenerate if the sheet has colored panels, any visible numeric/frame labels, broken left/right seating, eyes-to-camera, missing microphones, or a different room between panels.
