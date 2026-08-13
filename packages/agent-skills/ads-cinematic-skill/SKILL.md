---
name: 'ads-cinematic-skill'
description: 'Style-anchors reference for any ad scene rendered in the cinematic visual_style (the counterpart to ugc). Provides the camera/lens vocabulary, lighting recipe, color grade, composition rules, pacing, and audio profile that the director appends to its I2I and I2V prompts. Trigger whenever visual_style is "cinematic" — also when the user asks for "film look," "production-grade," "premium," "anamorphic," "documentary cinematic," or names a film/director as a reference. Does NOT replace ads-scriptwriter-skill / ads-storyboard-skill / ads-ctv-skill — it provides the *look*, not the narrative or platform spec.'
---

# Cinematic Style Anchors

This is a **style reference** the director appends to its image/video prompts whenever `visual_style: cinematic`. It is intentionally narrow: it does not specify duration, narrative, beat count, CTA placement, or platform — those come from the script + storyboard + platform-specific skills (ctv, ecommerce, etc.). Cinematic answers a single question: **what does this shot LOOK like?**

It is the deliberate opposite of `ads-ugc-skill`, which mandates iPhone deep-focus / natural light / no grade. Whenever the producer or storyboard passes `visual_style: cinematic`, the director reads this skill and appends the relevant anchor block to its prompt.

## When To Use This Skill

**Use cinematic when**:

- The script/storyboard explicitly sets `visual_style: cinematic`
- The user asks for "film look," "production-grade," "premium," "anamorphic," "Apple-ad style," or names a director / film as reference
- The product is a luxury / aspirational / high-AOV category (auto, beauty premium tier, jewelry, hospitality, financial services brand-building)
- The brief is a CTV / brand-film / hero-spot deliverable (in combination with `ads-ctv-skill` for screen-specifics)
- The scene needs to feel "filmed by a crew with real lights" rather than "captured by a person with a phone"

**Do NOT use cinematic when**:

- The brief is UGC, creator-style, peer-to-peer testimonial → use `ads-ugc-skill`
- The brief is street-interview / vox-pop → use `ads-street-interview-skill` (which has its own documentary look)
- The brief is podcast-style → use `ads-podcast-skill` (which is "produced," not "cinematic" — different lighting and grade)
- The product's authenticity depends on it looking unproduced (mass-market consumables, low-AOV impulse buys, gen-Z trend products)

## The 30-Second Definition

Cinematic means:

1. **Soft, sculpted light** (motivated, 3-point, never flat overhead)
2. **Shallow depth of field** (subject sharp, background rendered into colored bokeh)
3. **Color grade** (not the raw camera image; deliberate hue/contrast/saturation choices)
4. **Held shots** (3–5 second holds, slow camera motion, no jitter)
5. **Wide cinematic aspect** mentality even when delivered vertical (compose for the wide frame first)
6. **Confident audio** (load-bearing music, professional VO, designed sound)

If any one of these is missing, the result reads as "UGC trying to look fancy" rather than "cinematic." Anchor every prompt against all six.

---

## Camera & Lens Anchors

Append to I2I and I2V prompts whenever cinematic, picking ONE camera and ONE lens per scene (do not stack vocabulary):

**Cameras (pick one)**:

- ARRI Alexa Mini LF
- RED Komodo / Raptor
- Sony FX6 / FX9 (when describing high-fidelity but accessible-cinematic)
- Canon C500 mk II
- Blackmagic URSA 12K (for muscular over-budget look)

**Lenses (pick one based on scene)**:

- 35mm anamorphic (T2.0) — for wide environmental shots with subtle horizontal squeeze
- 50mm anamorphic (T2.0) — the "default cinematic portrait" lens, slight squeeze, classic film look
- 85mm prime (T1.4) — for tight portraits with maximum bokeh separation, no anamorphic
- 24mm wide prime (T1.5) — for wide product hero shots, environmental establishing
- 100mm macro (T2.8) — for product-detail beats with razor-thin focus plane

**Anamorphic note**: anamorphic glass produces horizontal lens flares (long blue or amber streaks) and slightly oval bokeh balls. If using anamorphic, the prompt should explicitly mention "horizontal lens flares" and "oval bokeh" — otherwise the model defaults to spherical look and the anamorphic vocabulary is wasted.

---

## Lighting Anchors

Append to every cinematic scene's image prompt. The lighting recipe is **motivated** — every source should be readable as "someone with a light there" or "a window / lamp / streetlight at that position."

- **Three-point as a default**: key (camera-right or camera-left, soft, ~3200–4000K), fill (opposite side, dimmer + cooler), hair/rim (from behind, separating subject from background)
- **Soft sources, never hard direct**: large softbox, lantern, bounced light off a wall, or large window with diffusion. Hard direct light from a bare bulb reads as "amateur" instantly
- **Motivated practicals**: every cinematic scene should have at least one visible warm practical (lamp, candle, neon sign, sconce, streetlight) in frame or just out of frame. these are what make the lighting feel "real" rather than "rigged"
- **Negative fill**: the side opposite the key should be allowed to fall into shadow. flat lighting (equal both sides) is the most common "fake cinematic" tell. Embrace contrast
- **Backlight separation**: a rim of light on the subject's hair / shoulder from a back-key source. without it, the subject merges into the background

**Time-of-day vocabulary** (pick one per scene):

- Golden hour: warm low-angle key from a window, long shadows, amber + magenta sky
- Blue hour: cool blue ambient with warm practical interiors as the only warm sources
- Night interior: low-key, warm practicals dominant, cool moonlight rim from a window
- Overcast natural: large diffused soft light through a north-facing window, neutral white balance
- Studio (locked): three-point softbox setup with motivated practicals, warm key cool fill

---

## Color & Grading Anchors

Append the grade language explicitly to the prompt. The image model will not "go cinematic" without the grade words.

- **Standard cinematic grade**: warm shadows (subtle teal/cyan), warm midtones, slight desaturation of greens, lifted blacks (so blacks are deep but not crushed). reference: "Roger Deakins Sicario palette," "1917 grade"
- **Orange & teal**: the most overused but still effective cinematic grade — skin tones warm orange, shadows pushed cyan/teal. reference: "Michael Bay Transformers grade," "modern Marvel film grade." use sparingly — it's the "easy cinematic" but reads as derivative if overused
- **Kodak Vision3 emulation**: warm skin, slightly desaturated everywhere else, fine grain. reference: "shot on 35mm Kodak Vision3 500T," "Portra 800 stills"
- **Bleach bypass / desaturated**: low-saturation, slightly raised contrast, slight green push in midtones. reference: "Saving Private Ryan grade," "Children of Men palette." use for serious / documentary cinematic tone
- **High-key luxury**: bright, soft, slightly overexposed highlights, slightly muted but warm color. reference: "Apple ad," "modern Chanel commercial." use for premium fashion / beauty / hospitality
- **Black and white**: high contrast, deep blacks, milky whites, sharp midtone separation. reference: "modern B&W ad," "Schindler's List grade"

**Always grade for skin**. Skin tones must remain warm and three-dimensional regardless of grade. A grade that turns skin cyan or sallow is a failed grade.

---

## Composition Anchors

- **Rule of thirds**: subject on a third intersection, never dead center unless deliberately symmetric (Wes Anderson-style or one-shot product hero)
- **Leading lines**: streets, hallways, shelves, lighting strips that lead the eye to the subject
- **Negative space**: cinematic frames tolerate (and reward) large areas of empty/textured space. UGC fills frames; cinematic breathes
- **Depth layers**: a foreground element (out-of-focus practical, prop, plant), a midground (subject), a background (motivated context). three depth layers are the signature of cinematic composition
- **Headroom**: tighter than UGC. eyes on the upper third of the frame, slight crown shave on close-ups
- **Subject scale**: cinematic favors mid and wide framings more than UGC. let the subject be small within a large environment for environmental cinematic; let them dominate for portrait cinematic. avoid the UGC default of "head-and-shoulders bust shot"

---

## Pacing & Camera Motion Anchors

- **Held shots**: 3–5 second average. cinematic rewards stillness. eye gets to explore the frame
- **Slow push-in / pull-out**: confident, smooth, ~10–15% size change over 3 seconds. handheld jitter is forbidden. dolly, slider, or virtual move only
- **Subtle handheld**: only for documentary-cinematic tone (Children of Men, Roma). natural breath-rhythm sway, never the rapid micro-shake of UGC iPhone footage
- **No whip-pans, no zoom-snaps**: those are music-video / UGC vocabulary. cinematic is patient
- **Cut points**: on motion, on a beat, on the resolution of a held composition. never cut mid-action for the sake of "energy" — cinematic does not get its energy from cut rhythm, it gets it from light and composition

---

## Audio Anchors

- **Music is load-bearing**: every cinematic spot needs a designed score or licensed track that does narrative work. royalty-free underbed is insufficient — it exposes itself against the visual production value
- **Voice over (when used)**: confident, measured, low-register. reads "trustworthy" not "excited." pacing slower than UGC by ~20%
- **Sound design**: every visual moment has a matched sound effect (foley footsteps, designed product impact, environmental wash). silence between cues is acceptable; un-designed sound is not
- **Dialogue (when used)**: dramatically scripted, not conversational. delivered for the room, not for the phone. lavalier mic chain
- **Mix**: dynamic range > UGC. cinematic can be quiet then loud. UGC is flat-loud throughout. respect headroom for crescendo

---

## The 6 "Fake Cinematic" Mistakes

These are the recurring tells that make cinematic prompts produce mediocre results. Every prompt should be audited against them.

1. **Bokeh without a reason** — shallow DOF on phone-grade footage. The eye reads "this was shot on iPhone and someone added blur in post." If you want shallow DOF, the entire prompt has to commit to large-sensor camera + fast lens + motivated lighting. Half-cinematic doesn't work.
2. **LUT without lighting** — applying an orange-and-teal grade to flatly-lit footage. The grade exposes the lighting. Cinematic light first, grade second. If the underlying lighting is flat, no grade can save it.
3. **"Cinematic" prompt words with no scene direction** — writing "cinematic, film look, professional" and no actual lighting/camera/composition specifics. The image model will produce a generic stock-photo result. Specifics or nothing.
4. **Wide aspect mentality on a 9:16 deliverable without reframe planning** — if the final is vertical, the composition has to work vertically. cinematic for vertical means tighter framings + vertical depth layers, not just a cropped horizontal.
5. **Hard direct light on the face** — even if the rest of the scene is cinematic, a single hard direct frontal light on a subject's face screams "amateur lighting." Always soft and side-keyed.
6. **Modern reference + period-incompatible vocabulary** — asking for "cinematic 1970s look" and then prompting "Sony FX6 / cinematic LUT." Pick one era of vocabulary and commit. Anachronism reads as "AI mess."

---

## Pairing With Other Skills

This skill provides the **look**. It does not provide:

- Narrative / script structure → use `ads-scriptwriter-skill` or a category-format skill (cinematic + ads-ecommerce-skill, cinematic + ads-ctv-skill)
- Scene-by-scene breakdown → use `ads-storyboard-skill`
- Platform constraints (safe zones, broadcast loudness, QR codes, etc.) → use `ads-ctv-skill` for CTV deliveries
- Motion direction (which way the camera moves) → use `ads-motion-skill` for cinematic motion (it will read the visual_style anchor and lean confident/held)
- Persona generation → use `ads-persona-skill` (passing visual_style ensures persona images are lit / framed cinematic-style)

**Director appends cinematic anchors to its prompts. Storyboard references the look but does not embed the full vocabulary. Producer never quotes cinematic — it just sets `visual_style: cinematic` and lets the downstream skills compose.**

---

## Usage Pattern

When the director reads this skill (because `visual_style: cinematic` is set):

1. Read the scene's storyboard entry — what's the scene about? Portrait, product, environmental?
2. Pick ONE camera + ONE lens from the Camera Anchors above
3. Pick ONE time-of-day from the Lighting Anchors (or compose freely if it doesn't fit a preset)
4. Pick ONE grade from the Color Anchors
5. Append composition anchors that apply to this scene (rule of thirds, depth layers, etc.)
6. Append the pacing / motion anchor for any video generation
7. Audit against the 6 "Fake Cinematic" Mistakes before finalizing the prompt

The total cinematic anchor block appended to a prompt is typically 4–6 lines. It should be specific to the scene, not a copy-paste of this entire document.

---

**Usage**: Loaded as an `inline` skill (not forked) by the director whenever `visual_style: cinematic`. The director reads only the sections relevant to the current scene and appends the chosen anchors to its I2I or I2V prompt — same execution pattern as `ads-director-skill` itself.
