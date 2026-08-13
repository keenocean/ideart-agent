---
name: 'ugc-diaspora-direct-address-hook'
description: 'Create a vertical diaspora-audience UGC direct-address hook video from project references, generated speaker scenes, speech, music, and final composition.'
---

# UGC Diaspora Direct Address Hook

Use this for short vertical UGC-style direct-address ads aimed at diaspora audiences, where the speaker opens with a culturally specific hook, names the audience context plainly, and closes with a simple CTA. The workflow must use only current project assets, user-provided facts, and tool-returned project artifacts.

## Inputs

- Product, service, event, creator, or campaign being promoted: required.
- Diaspora audience and location context: required.
- Exact language, dialect, script, and pronunciation constraints: required when speech or visible text must be localized.
- Brand, product, creator, wardrobe, location, or style project asset ids: optional but required when visual identity must stay consistent.
- CTA wording and destination text: required before final composition.

## Workflow

1. Confirm the audience, offer, language, exact CTA, duration, and required project asset ids. If a required reference is missing, ask for upload or selection before generation.
2. Write a 15-25 second direct-address script with three beats: immediate diaspora hook, product or offer proof, and CTA. Keep claims grounded in user-provided facts.
3. Call `run_skill`, then `visual_design_task` for the speaker start frame, brand card, product still, or background stills needed before motion. Use project asset ids as references when identity, product, attire, or setting must stay consistent.
4. Call `run_skill`, then `speech_generation` for the spoken script in the selected language or dialect. Require natural direct-address pacing and pronunciation notes from the brief.
5. Call `run_skill`, then `video_generation` for the speaker hook, proof, and CTA scenes. Prompts must include aspect ratio, duration, speaking energy, project reference asset ids, and constraints against unreadable in-image text.
6. Optional music: call `run_skill`, then `music_generation` for a low-volume bed that supports the cultural tone without overpowering speech.
7. Call `run_skill`, then `compose_video` with generated scene asset ids, speech asset id, optional music asset id, exact scene durations, captions or CTA overlays, and final 9:16 output. The composed result is automatically persisted as a project asset.
8. QA the result for speech intelligibility, pronunciation constraints, caption readability, audience specificity, claim accuracy, and no mismatched product or identity references.

## Tool Rules

- Call `run_skill` immediately before each concrete tool call.
- Allowed concrete tools for this skill: `visual_design_task`, `video_generation`, `speech_generation`, `music_generation`, `compose_video`.
- Use only project asset ids and artifact references for inputs and outputs.
- Do not use external media links, non-project file inputs, command-line media processing, upload, publication, or artifact registration steps.
- Keep generated visuals original and brand-safe; do not impersonate a real person unless the user supplies authorized project references for that person.

## Output

Return the final `assetId` or `artifactRef`, the script beats, generated scene asset ids, speech asset id, music asset id when used, overlay copy, and any pronunciation or cultural-fit caveats.
