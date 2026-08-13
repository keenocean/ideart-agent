---
name: ai-ad-prompt-guide
description: Write and repair production-ready prompts for AI-generated advertising images and video. Use for image prompts, text-to-video or image-to-video prompts, UGC scenes, product shots, camera direction, hallucination control, and prompt quality review.
---

# AI Ad Prompt Guide

Turn a creative brief into a model-portable generation prompt. This is a knowledge skill: produce the prompt and QA notes without calling media-generation tools.

## 1. Ground the brief

Identify the product, audience, platform, aspect ratio, duration, message, required reference assets, claim limits, and visual constraints. Mark missing facts as placeholders. Do not invent packaging, logos, product effects, discounts, certifications, or performance claims.

## 2. Build with SLCT

Every prompt should make four layers explicit:

- **Subject**: the main person, product, action, environment, and relative positions.
- **Lighting/Look**: time of day, source direction, contrast, palette, texture, and intended realism.
- **Camera**: shot size, angle, lens feel, movement, focus, and composition.
- **Technical**: aspect ratio, duration, resolution, visual style, continuity rules, and reference-image usage.

Write observable instructions. “A single amber serum bottle centered on a dry marble counter” is more reliable than “a beautiful premium skincare scene.”

## 3. Prevent common failures

- Limit each shot to one primary action and no more than three important entities.
- Define left/right, foreground/background, contact points, and movement direction.
- Keep actions physically plausible and temporally simple.
- Use a supplied product reference for identity-sensitive packaging.
- Add brand text, labels, prices, and legal copy in post when exact spelling matters.
- Describe the desired scene instead of relying on long negative-prompt lists.
- Split multiple interactions into separate shots and edit them together.
- Preserve the same identity, wardrobe, product, lighting logic, and screen direction across shots.
- Never request a real person's likeness or cloned voice without appropriate authorization.

## 4. Choose camera language

Use one clear camera instruction per shot:

- static locked shot for legibility and product truth;
- slow push-in for emphasis;
- pull-back for reveal;
- lateral tracking for motion and context;
- orbit for a hero product view;
- handheld micro-movement for natural UGC;
- overhead for layouts and demonstrations;
- macro close-up for material or texture details.

Avoid contradictory combinations such as “locked camera with dramatic handheld movement.”

## 5. Use the right formula

### Product image

`[product and exact placement], [environment], [lighting/look], [camera/lens/composition], [material fidelity], [aspect ratio and finish]`

### Image-to-video

`Preserve the reference product and composition. [single subject action]. [single camera movement]. [environmental motion]. [continuity and physical constraints]. [duration/aspect ratio/style].`

### UGC scene

`[specific presenter without sensitive inference] in [ordinary setting], [one natural action], [phone-camera framing], [available light], [authentic pacing and micro-imperfections], [spoken intent without rendering on-screen text], 9:16.`

### Product B-roll

`[one product] [one interaction or motion], [surface and background], [directional lighting], [macro/hero camera move], [real material behavior], [clean ending frame for edit].`

## 6. Run Pass³ QA

Review the final prompt three times:

1. **Physics pass**: can the action, contact, motion, and timing happen coherently?
2. **Detail pass**: are subject count, spatial relationships, camera, light, duration, and aspect ratio explicit?
3. **Brand pass**: are product identity and claims grounded, with exact text deferred to overlays where needed?

## Output

Return:

- assumptions and claim constraints;
- the final copy-ready prompt;
- optional shot-by-shot prompts when one generation would be overloaded;
- concise continuity or negative constraints;
- the Pass³ checklist with any remaining risk.

Do not name a specific model unless the user asks or has selected one. When model limits are unknown, keep the prompt portable and label model-dependent parameters.
