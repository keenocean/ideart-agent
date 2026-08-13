---
name: 'ads-animated-storymode-skill'
description: 'Use when the ad format is animated / cartoon storytelling for any general industry — explainer animations, animated UGC, cartoon mascots, illustrated narratives, AI-animated ads, motion-graphic stories, doodle ads, 2D-vector ads. Produces an Animated Story Creative Brief — ranked hook concepts, scroll-stop frame spec, art-style direction, character cast, story arc, voiceover/sound spec, asset readiness QA, enhancement opportunities, and asset gaps. Trigger before scriptwriting whenever the brief mentions animation, cartoon, illustrated, motion graphics, explainer video, animated story, AI-animated ad, Pixar-style, doodle ad, or "make it a cartoon." The producer should run this skill first so its output feeds ads-scriptwriter-skill (or ads-fast-skill). For game products use ads-games-skill (which already covers animated mascots inside game ads); for live-action UGC use ads-ugc-skill.'
---

# Ads Animated Story-Mode Skill

Produce an **Animated Story Creative Brief** — a structured document that gives the scriptwriter everything they need to write a high-converting animated/cartoon ad. The brief leads with **ranked hook concepts and scroll-stop frames**, backed by art-style direction, character cast, story arc, voiceover/sound spec, and asset readiness.

The audience is TikTok-scrollers, Reels-swipers, Shorts-skippers. The first 0.5 seconds decides if they stop. The first 3 seconds decides if they stay. Animated ads win when **the world looks unmistakable in frame 1** — a style so specific the viewer instantly knows "this isn't another live-action talking head" — and a character whose face you'd recognize again.

This skill runs **before** `ads-scriptwriter-skill` (or `ads-fast-skill`) when the chosen format is animated/cartoon. The scriptwriter inherits the brief and uses it to write to a defined art style, cast, and arc.

## What this skill is responsible for

1. **Rank hook concepts** — 3–5 hooks tailored to this product + animated format, each with scroll-stop frame (≤ 0.5s) and hook payoff (≤ 3s).
2. **Define the scroll-stop frame** — for animation this is the _first frame of the world_ + the protagonist's face. The style is the stop, the character is the stay.
3. **Pick an art style direction** — primary + alternate. The art style is half the ad.
4. **Build the character cast** — protagonist, antagonist (often the problem personified), side characters, mascot if any. Visual refs and personality.
5. **Recommend a story arc** — the 30s narrative shape (relatable hero solves problem with product / world-of-the-product / villain-becomes-vanquished / before→after-portal).
6. **Spec voiceover & sound** — VO archetype, music feel, sound-design beats.
7. **Validate asset readiness** — character refs, brand colors, logo files, voiceover samples, music license.
8. **Flag enhancement opportunities** and **asset gaps**.

## Step 1 — Gather inputs

**Minimum required:** a product name OR a landing-page URL.

The producer should pass:

- **Product name** and/or **URL**
- **Brand assets** — logo files, brand color hex codes, brand fonts, existing illustration style (`brand-profile.json` if present)
- **Existing animation assets** — `input:video-*` / `input:image-*` IDs (character sheets, prior animation, mood boards, AI-generated stills)
- **Voiceover assets** — sample VO clips, voice-cloning ID, ElevenLabs voice ID
- **Music** — licensed tracks, library access, original score path

**Infer the rest from the URL.** `web_fetch` the homepage. Pull: product category, value-prop, audience signals, existing brand voice, any illustrations or animations on site.

**Optional overrides:**

- Target audience
- Ad duration / platform (TikTok / Reels / Shorts / Meta / YouTube long)
- Production tooling — AI animation (Sora, Veo, Kling, Runway) vs. studio animation (After Effects, Toon Boom) vs. hand-drawn
- Brand tone constraints

## Step 2 — Art style direction

Animation lives or dies on its art style. Pick a primary + alternate from this menu (or invent one):

- **Pixar-warm 3D** — soft volumetric lighting, big-eyed characters, plush textures. Best for emotionally-driven brand stories.
- **Studio-Ghibli cozy** — watercolor backgrounds, hand-painted feel, gentle pacing. Best for wellness, home, food.
- **South Park / cut-out** — flat shapes, intentionally crude, irreverent, fast. Best for comedic disruption.
- **TikTok-doodle / scribble-on-footage** — hand-drawn marker scribbles over screen recordings or stills. Best for explainer ads inside the native feed.
- **2D-vector flat** — clean shapes, brand-color palettes, motion-graphic feel. Best for SaaS, fintech, B2B explainers.
- **Paper-cutout / stop-motion-feel** — layered paper, slight wobble, tactile. Best for kids, family, craft, food.
- **90s Saturday-morning** — bold outlines, cel-shaded, pop colors, "Doug / Recess" energy. Best for nostalgia plays.
- **Comic-book / halftone** — Ben-Day dots, panel transitions, bold lettering. Best for hero-narrative product launches.
- **AI-generated dreamlike (Sora / Veo / Kling)** — surreal, hyperreal, world-bending shots. Best for spectacle openers, scroll-stops, world-of-the-product.
- **Pixel-art / 8-bit** — retro-game-coded, chiptune-friendly. Best for tech, gaming-adjacent, Web3.
- **Whiteboard / sketch-explainer** — hand draws each element on a whiteboard. Best for educational, B2B, info-dense.
- **Anime-stylized** — speed-lines, expressive faces, dramatic lighting. Best for energetic, Gen-Z products.
- **Claymation / Aardman-feel** — sculpted, slightly imperfect, charming. Best for food, family, nostalgic.
- **Mixed-media UGC + animation** — real footage with animated overlays / characters. Best when you have decent live footage but want a stylistic boost.

Write: **"Best guess: [primary]. Alternate: [secondary]. Reason: [1 sentence anchored in product, audience, and production tooling available]."** Commit to a style — half-committed style is no style.

## Step 3 — Character cast

The protagonist is your mascot. The antagonist is often the problem personified. Side characters carry the world.

For each character, write:

- **Role** — protagonist / antagonist / sidekick / narrator / cameo
- **Visual description** — species (human / animal / object / abstract), age, build, wardrobe, distinguishing features. Specific enough that an illustrator could draw it from the brief alone.
- **Personality cue** — adjective + behavior tic. "Anxious — fidgets with collar when stressed." "Smug — always one step ahead, smirk."
- **Voice cue** — VO direction + sample line in their voice
- **Brand-aligned?** yes/no — does this character carry brand colors / a logo touch / mascot continuity? Or is it a one-off?
- **Already designed?** yes/no — character sheet exists, or this is a fresh design brief

**Protagonist tips:**

- Big eyes + simple silhouette = scroll-stop gold. The viewer's eye locks on a face.
- The protagonist should mirror the audience's pain in the first 3s. They struggle with the same thing the viewer does.
- Give them ONE quirk that's animatable across multiple ad variants — a hat that flops, a tail that twitches, a worried eyebrow.

**Antagonist as problem personified:**

- "The Slump" as a gray cloud that hangs over the protagonist's shoulders
- "Imposter Syndrome" as a tiny gremlin on the laptop
- "Tax Anxiety" as a paper monster made of receipts
- The product VANQUISHES the antagonist — that's the payoff.

## Step 4 — Story arc

Animated ads condense narrative tighter than live-action. Pick an arc and spec second-marks.

**Default arcs** (pick one):

- **Hero-solves-problem (classic 5-beat):**
  - 0.0–0.5s — Scroll-stop frame (world + protagonist face)
  - 0.5–3.0s — Establish protagonist + their pain (the antagonist appears)
  - 3.0–10.0s — Pain escalates, a moment of failure
  - 10.0–18.0s — Product appears, transformation begins
  - 18.0–25.0s — Antagonist defeated, protagonist transformed
  - 25.0–30.0s — CTA in the world (protagonist holds product / brand mark)

- **World-of-the-product portal:**
  - 0.0–0.5s — A door / portal / phone screen opens to a stylized world
  - 0.5–3.0s — We tumble in; protagonist appears
  - 3.0–20.0s — Tour the world, each location showing a feature
  - 20.0–30.0s — Exit the portal back to reality holding the product

- **Before→after split-world:**
  - 0.0–0.5s — Split-screen: gray drab world | vibrant color world
  - 0.5–3.0s — Protagonist on the gray side struggling
  - 3.0–18.0s — Discovers the product, crosses to color side
  - 18.0–30.0s — Color-side life, CTA

- **Day-in-the-life (cozy / Ghibli-coded):**
  - 0.0–0.5s — A specific cozy moment in the protagonist's day
  - 0.5–25.0s — Walk through their routine, product woven in
  - 25.0–30.0s — Soft CTA, "your routine, made [better]"

- **Comedic disruption (South Park / cut-out):**
  - 0.0–0.5s — Absurd scroll-stop image
  - 0.5–3.0s — Joke premise lands
  - 3.0–22.0s — Joke escalation, product is the punchline-payoff
  - 22.0–30.0s — Tag joke + CTA

- **Whiteboard / explainer:**
  - 0.0–0.5s — Hand starts drawing the problem
  - 0.5–25.0s — Problem→solution drawn out
  - 25.0–30.0s — Logo lockup + CTA

Write the chosen arc with second-marks tuned to the requested ad duration.

## Step 5 — Voiceover & sound spec

Animation needs sound to feel alive.

- **VO archetype** — narrator omniscient / character-VO first-person / no-VO (text + sound only) / dual-VO (narrator + character). Pick one.
- **Voice cue** — gender, age, energy, accent, sample line. If using ElevenLabs, name the voice ID if known.
- **Music feel** — genre + mood (warm-acoustic / synthwave-uplift / playful-ukulele / cinematic-orchestral / lo-fi-hip-hop / chiptune). Reference a song if helpful.
- **Sound-design beats** — moments that need a specific SFX (whoosh on transitions, pop on text, sting on antagonist appearance, sparkle on product reveal, "ding" on CTA). List 5–10 beats with timecodes.
- **Trending audio?** — if the platform is TikTok/Reels and the style allows, flag whether to lay the animation over a trending audio (huge reach lift, but constrains pacing).

Music & SFX rights: flag if license isn't confirmed.

## Step 6 — Asset readiness QA

Animation production needs more upfront prep than live action. Audit readiness.

**Tiered:**

- **Tier 1 (full ready):** Character sheets, brand colors, brand fonts, logo files, VO samples, music license — all on hand. Production can start.
- **Tier 2 (partial):** Some assets present, some missing. Brief proceeds; gaps listed.
- **Tier 3 (concept-only):** Brand exists but no animation assets. Brief proceeds with a "design brief" sub-section that the scriptwriter / illustrator can hand to an animation tool.

Checklist (PASS / FAIL each):

1. **Logo file** — vector (SVG / AI / EPS) preferred; PNG with transparent background acceptable
2. **Brand colors** — hex codes documented (primary, secondary, accent)
3. **Brand fonts** — license-cleared for video use, files on hand or web-font name
4. **Character refs** — sheets or at minimum 2–3 ref images per main character
5. **Aspect ratio matches platform** — 9:16, 1:1, or 16:9
6. **Voiceover samples** — at least one sample of the chosen voice cue
7. **Music** — track selected and license cleared (or library access confirmed)
8. **Sound effects library** — access confirmed
9. **Animation tool / pipeline** — confirmed (AI tool API key + budget, or studio capacity)
10. **Reference frames / mood board** — at least one image per art-style direction

Any FAIL → flag in `## Asset Gaps`.

## Step 7 — Asset gap check (output, do not block)

Acceptable sources to suggest:

- **Brand-asset upload** — logo, colors, fonts via direct upload
- **AI character generation** — Flux / Nano-Banana / Midjourney for character sheets if user has access
- **AI animation generation** — Sora / Veo / Kling / Runway for finished shots if user has access
- **Voiceover** — ElevenLabs voice clone or library voice ID
- **Music** — Epidemic Sound / Artlist / Soundstripe library access, or commissioned track
- **Reference scrape** — if user shared a reference video URL, `web_fetch` to extract style cues

State only methods the orchestrator actually accepts.

## Step 8 — Hook ranking

Rank 3–5 hooks. For each:

- **Hook name** (from library, or "custom")
- **Scroll-stop frame** — frames 1–15 (≤ 0.5s). For animation, the **art style itself** must read in frame 1. World + face = stop.
- **One-sentence concept** specific to this product + character
- **Why it fits** — art style / character / arc / audience reason
- **Payoff by** — second mark (≤ 3s)
- **Required assets** — character sheet, world reference, VO line, music
- **Risk**

### Animated hook library

1. **Big-eyed protagonist in distress** — character mid-pain, eyes huge, problem visible. Scroll-stop: face filling the frame, antagonist (problem) visible behind.
2. **World-portal open** — a door, phone, book, or window opens to a stylized world. Scroll-stop: portal-effect mid-open, color spilling out.
3. **Split-world before/after** — drab vs. vibrant, protagonist on the drab side. Scroll-stop: split-screen with motion crossing the boundary.
4. **Antagonist personified** — the problem appears as a creature/monster. Scroll-stop: antagonist mid-action, protagonist reacting.
5. **"Once upon a time"** — explicit storybook framing. Scroll-stop: book opening, illustrated page revealing.
6. **Comedic absurdism** — an unexpected animated thing in a normal context. Scroll-stop: the absurd image (e.g. a tiny lawyer-shrimp, a sentient receipt).
7. **Mascot wave / direct address** — character looks at camera and says hi. Scroll-stop: character making eye contact with viewer.
8. **Transformation tease** — protagonist mid-glow-up, halfway between before and after. Scroll-stop: the partial-transformation freeze frame.
9. **Whiteboard problem-draw** — hand draws a recognizable pain. Scroll-stop: hand mid-stroke, half the problem visible.
10. **Pixel-game-style intro** — "PRESS START" / level-select feel. Scroll-stop: pixel art with chiptune cue.
11. **AI-spectacle world-bender** — surreal Sora-style impossible shot. Scroll-stop: the impossible image (gravity bending, materials morphing).
12. **Dual-character dialogue** — two characters with conflicting takes. Scroll-stop: speech bubble + reaction face.
13. **Cute-creature endorsement** — a non-human (animal, alien, blob) loves the product. Scroll-stop: the creature with the product, eyes hearts.
14. **Title-card storybook hook** — "The Tale of [Protagonist]'s [Problem]." Scroll-stop: ornate text card in art style.

**Scroll-stop frame rules:** survives thumbnail crop, art style is unmistakable in frame 1, one focal point (almost always the protagonist's face), high contrast against a feed of live-action, motion preferred (an open door, a falling object, a character mid-blink).

## Step 9 — Enhancement opportunities

List 3–5 ways to upgrade the animation **without inflating the production budget**:

- **Rim lighting / glow** on the protagonist in low-light scenes
- **Camera moves** — slow push-in, parallax layers, rack focus
- **Particle accents** — sparkle on product reveal, dust motes in cozy scenes, debris on antagonist defeat
- **Type-on animation** for any text — never static text in motion graphics
- **Burned-in captions** word-by-word with character-voice color cues
- **Motion-blur** on fast actions
- **Sound design layer** — Foley, mouth-pops, SFX punctuation
- **Music sync** — cut to the beat on key transitions
- **Variant branching** — same body, 3–5 different scroll-stop openers (different art-style tests)
- **Loop-friendly tail** — final frame matches first frame for seamless replay (TikTok rewatch boost)

Do **not** propose:

- Style imitations of trademarked properties (don't say "Pixar" — say "warm 3D cinematic"; don't say "Simpsons" — say "flat 2D adult-cartoon")
- Stolen character designs
- Music without license
- Claims the product can't deliver, even in a "magical" frame
- AI-generated humans presented as real customers

## Output file

Write the brief to:

```
/tmp/outputs/animated-brief-{product-slug}.md
```

### Brief format

```markdown
# Animated Story Creative Brief — {Product Name}

## Product Snapshot

- **Product:** ...
- **Category:** ...
- **Landing page:** {URL}
- **Target audience:** ...
- **Ad duration / platform:** ...
- **Production pipeline:** AI (Sora/Veo/Kling) / studio AE / hybrid

## Hook Concepts (Ranked)

1. **Antagonist personified**
   - Scroll-stop frame: A small anxious office-worker character at her desk, "The Slump" — a gray cloud-monster with droopy eyes — slumped over her shoulders. Warm 2D-vector style, brand-teal accents, soft rim light. Cloud's shadow swallows the desk.
   - Concept: "Meet The Slump. He shows up at 3pm. We sent him packing."
   - Why: 2D-vector style fits SaaS audience; antagonist hooks emotionally; protagonist mirrors WFH viewer.
   - Payoff by: 0:02.5
   - Assets: protagonist sheet (need), Slump-monster design (need), brand teal palette (have), narrator VO (have).
   - Risk: low if both characters get designed; medium if AI animation can hold consistent character across cuts.
2. ...

## Art Style Direction

- **Best guess:** 2D-vector flat with warm rim lighting.
- **Alternate:** Studio-Ghibli cozy watercolor.
- **Reason:** SaaS B2B audience; brand uses clean illustration on site; production budget supports vector but not full-frame painted backgrounds.

## Character Cast

- **Lin** (protagonist) — 30-something working-from-home woman, simple silhouette, big round glasses, oversized hoodie, one strand of hair always falling in her face. Voice: warm, slightly tired, "ugh, again?" Brand-aligned: yes, she'll be the recurring mascot.
- **The Slump** (antagonist) — gray rounded cloud-monster, droopy half-lidded eyes, drags behind Lin. Personality: passive-aggressive, contagious yawns. Voice: low groan, no words.
- **Narrator** — warm female VO, plain-English explainer cadence (ElevenLabs voice "Charlotte" or similar).

## Story Arc

Hero-solves-problem (5-beat, 30s):

- 0.0–0.5s — Scroll-stop: Lin at desk, Slump on shoulders, 3pm clock visible.
- 0.5–3.0s — "Meet The Slump."
- 3.0–10.0s — Slump grows; Lin yawns; coffee spills; productivity meter drops.
- 10.0–18.0s — Lin opens [product]; light spills from screen; Slump shrinks.
- 18.0–25.0s — Lin transformed (color brightens, posture straight); Slump banished.
- 25.0–30.0s — Lin holds laptop with product logo, mascot wave, CTA card.

## Voiceover & Sound Spec

- **VO:** narrator omniscient, warm female, ~140 wpm
- **Music:** uplifting acoustic-electronic, brand-feel, light-and-warm. Reference: brand site bg track.
- **SFX beats:** 0:00 quiet 3pm-clock tick, 0:08 yawn, 0:11 coffee spill, 0:14 chime on product open, 0:17 sparkle on transformation, 0:22 Slump pop-out, 0:27 logo whoosh.

## Asset Readiness

| Asset            | Status | Notes                              |
| ---------------- | ------ | ---------------------------------- |
| Logo file        | PASS   | SVG on hand                        |
| Brand colors     | PASS   | teal #0EA5E9, charcoal #1F2937     |
| Character sheets | FAIL   | Lin + Slump need design pass       |
| VO sample        | PASS   | ElevenLabs Charlotte cleared       |
| Music license    | PASS   | Epidemic Sound subscription active |

## Enhancement Opportunities

- Parallax-layer Lin's desk to add depth.
- Rim-light Lin on the transformation beat.
- Cut to music beat at 0:14 (product open) and 0:22 (Slump banish).
- Loop-friendly tail: final frame mirrors 0:00 minus the Slump.

## Asset Gaps

- Need character sheets for Lin and The Slump (front + 3/4 + expression sheet). Suggest AI generation via Flux or Nano-Banana with brand-color-locked palette, then human pass for consistency.
```

## Handoff to scriptwriter

Pass the brief path to `ads-scriptwriter-skill` (or `ads-fast-skill`). The scriptwriter MUST:

- Use rank #1 hook unless told otherwise
- Open on the **scroll-stop frame** verbatim — frame 1, non-negotiable
- Write to the chosen art style (vocabulary that makes sense in that world)
- Use canonical character descriptions verbatim — voice cues, names, quirks
- Hit the recommended arc beat second-marks within ±10%
- Write VO that fits the spec'd archetype and music feel

## Constraints

- **Scroll-stop in ≤ 0.5 seconds.** Art style + protagonist face read in frame 1.
- **Hook payoff in ≤ 3 seconds.**
- **Be specific.** "Cute character" is not a character — "30-something WFH woman, big round glasses, oversized hoodie, one strand of hair always falling in her face" is.
- **Anchor in the chosen style.** No drift across the spot — if it starts Ghibli, it ends Ghibli.
- **No misleading magic.** Even animated transformations must reflect outcomes the product can deliver.
- **No trademark imitation.** Describe the style by its visual properties, never by a competitor IP name.
- **Rights cleared.** Music, fonts, voice IDs, and reference IP all license-confirmed before production.
- **Output file contains ONLY the brief.**

---

**Usage:** Dispatched by Producer as a forked skill before the scriptwriter, when the chosen ad format is animated/cartoon. Reads brand assets + style references, writes an Animated Story Creative Brief.
