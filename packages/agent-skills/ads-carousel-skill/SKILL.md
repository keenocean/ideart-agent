---
name: 'ads-carousel-skill'
description: 'Use when the ad format is a multi-frame swipe carousel — Meta carousel ads (2–10 cards), Instagram carousel posts, LinkedIn document/carousel ads, TikTok image carousel, Pinterest idea pins. Produces a Carousel Creative Brief — cover-card hook concepts, scroll-stop frame spec, per-card sequencing with a job per card, narrative arc, copy-per-card, palette continuity, image-asset QA, generation prompts, and asset gaps. Trigger before scriptwriting/design whenever the brief mentions a carousel, swipe ad, multi-image post, "10 reasons" listicle ad, multi-card creative, or Meta carousel placement. The producer should run this skill first so its output feeds image-gen + copy. For single-image use ads-static-image-skill; for video use ads-ugc-skill / ads-animated-storymode-skill; for meme-format use ads-meme-skill.'
---

# Ads Carousel Skill

Produce a **Carousel Creative Brief** — a structured document that gives the image-gen tool and copywriter everything they need to produce a high-converting multi-card swipe ad. The brief leads with **a ranked cover-card hook + a card-by-card sequence**, where every card has a defined job, copy block, and visual spec.

A carousel is a **deliberate format choice.** It works when video can't (swipe-to-control-pace audiences, info-density that voice-over would slow down) or when one image can't (listicles, before/after-stretched, comparison tables, multi-product hauls). It dies when used as "video that didn't get edited" — random images stitched together.

The cover card has the same job as a video's first frame: stop the thumb. Every subsequent card has its own job — there is no autoplay-rescue.

This skill runs **before** image generation and copywriting. Output feeds image-gen tools (Flux / Nano-Banana / Recraft / Imagen / Midjourney) and the copy module.

## What this skill is responsible for

1. **Rank cover-card hooks** — 3–5 hook concepts for card 1, each with scroll-stop spec.
2. **Choose a narrative arc** — listicle / problem→solution / comparison / steps / before→after-stretched / FAQ / day-in-life. Drives card sequencing.
3. **Sequence the cards** — per-card jobs, copy blocks, visual specs, swipe-rewards.
4. **Lock palette continuity** — color/style/type system that holds across all cards.
5. **Inventory hero subjects** — products, faces, results, type-as-image, infographic data.
6. **Validate image assets** — confirm card-1 hero, supporting images, brand assets are usable.
7. **Spec the per-platform aspect** — 1:1 (Meta default) / 4:5 (IG carousel) / vertical Pinterest / LinkedIn doc.
8. **Write generation prompts** — per-card prompts ready to paste.
9. **Flag asset gaps** — what's missing. Never stall.

## Step 1 — Gather inputs

**Minimum required:** product/business name OR landing-page URL.

The producer should pass:

- **Product / business name** and/or **landing-page URL**
- **Card count target** — 3–10. Default 5. (Meta caps at 10; LinkedIn 10; IG 10; TikTok 35 but 5–8 is the sweet spot)
- **Existing image assets** — `input:image-*` IDs or URLs
- **Brand profile** — colors, fonts, tone
- **Industry profile** — output of game/ecom/service brief if upstream

**Infer the rest from URL.** `web_fetch` the landing page. Pull: value-prop, feature list, hero imagery, top reviews, pricing, audience cues, FAQ if present.

**Optional overrides:**

- Target audience
- Placements (Meta feed / IG / LinkedIn / Pinterest)
- Hard constraints (must include logo on every card, must avoid claim X)
- Image-gen tool

## Step 2 — Narrative arc

Carousels die without an arc. Pick a primary arc + alternate from this menu:

- **Listicle** — "5 reasons to switch to X." Cover = "5 reasons", cards 2–N = one reason each, last = CTA. Best for feature-rich products, B2B, info-dense.
- **Problem → Agitate → Solve → Proof → CTA** — classic 5-card direct response. Best for service, course, supplement.
- **Steps / how-to** — "How I did X in 5 steps." Each card = one step. Best for tutorial-coded products, recipes, fitness, skincare regimens.
- **Comparison** — "Brand A vs. Brand B vs. doing nothing." 2-column grid carried across cards. Best for dupe ads, category disruption.
- **Before / after stretched** — card 1 = before, card 2-3 = process, card 4 = after, card 5 = CTA. Best for transformation services and beauty.
- **FAQ / objection handler** — each card answers one objection ("but isn't it expensive?", "does it actually work?"). Best for high-AOV considered purchases.
- **Day-in-the-life** — chronological cards walk through a routine, product woven in. Best for lifestyle ecom, wellness.
- **Multi-product haul** — same brand, multiple SKUs, one per card. Best for gift guides, bundles, drop-launches.
- **Behind-the-scenes** — supply chain / studio / factory / founder origin across cards. Best for trust-driven premium brands.
- **Storyboard / narrative** — 5–8 card story with characters and an arc. Best when video budget isn't there but story is.
- **Receipt-stack** — card 1 = bold claim, cards 2–N = receipts (testimonials, screenshots, results, press). Best for service results, course outcomes.

Write: **"Best guess: [primary]. Alternate: [secondary]. Reason: [1 sentence anchored in product, audience, and information density]."**

## Step 3 — Card sequencing

This is the core of the brief. Define every card.

**Universal card jobs (must be present somewhere in the sequence):**

- **Card 1 — Cover / Hook.** Stops the thumb. Promises a payoff worth swiping for. Includes a swipe-cue (arrow, "→", finger icon, "swipe to see").
- **Card 2 — Confirm the promise.** First swipe must reward the swipe within 1 second. If card 2 doesn't deliver, viewer bounces.
- **Cards 3 to N–1 — Build / proof / demonstrate.** Each card carries ONE idea.
- **Card N (last) — CTA.** Where to go, what to do, what they get. Offer + button-shape graphic + URL/handle.

**Per-card spec template (write this for every card):**

```
Card {n} — {job}
- Visual: {what's in frame, focal point, palette}
- Copy: {headline ≤ 7w, subhead ≤ 12w if needed}
- Swipe-cue (cards 1 to N-1): {arrow placement / hint}
- Continuity: {what carries from prior card — color, character, type, frame}
```

**Sequencing rules:**

- The first 3 cards make or break the carousel — drop-off after card 3 is huge. Front-load the best moments.
- Each card should be readable as a standalone — viewers may screenshot card 4 to share.
- One idea per card. No card should require reading the previous card to make sense.
- The final card must include the actual CTA verb + destination, not a soft brand-feel close.

## Step 4 — Cover-card hook ranking

Card 1 has the same job as a video's frame 1. Rank 3–5 cover concepts:

For each:

- **Hook name** (from library, or "custom")
- **Scroll-stop spec** — exact visual on card 1: focal point, palette, type, swipe-cue placement
- **Cover headline** — verbatim, ≤ 7 words
- **Why it fits** — narrative arc, audience, brand voice
- **Required assets** — hero, type, brand asset
- **Risk** — what could make it flop

### Carousel cover-card hook library

1. **Numbered listicle** — "5 reasons I switched." Big number on card 1.
2. **Question-promise** — "Why is no one talking about [X]? →" Curiosity opener.
3. **Bold claim + receipt-tease** — "We saved her $47K. Swipe →"
4. **Before-tease** — full-frame "before" state on card 1, viewer swipes to see "after."
5. **Comparison-tease** — "Brand A vs. Brand B → swipe to see who won."
6. **Stat-shock** — single number filling 70% of card 1.
7. **POV-headline** — "POV: you finally found a [product] that…"
8. **Mistake-callout** — "I've been [doing X] wrong for years. Here's what changed →"
9. **Step-promise** — "How I did [outcome] in 5 steps →"
10. **Multi-product tease** — "5 things I bought this month — only one was worth it →"
11. **FAQ-bait** — "The 3 questions every [audience] asks me →"
12. **Anti-ad opener** — "I'm tired of seeing ads for [category]. Here's what I actually use →"

**Cover-card scroll-stop rules:**

- Swipe-cue MUST be visible — arrow, hint dots, "→", finger pointing right. Without it, viewers don't realize there's more.
- Headline placement: center or top-third of card. Bottom is risky (caption-mask zone in Meta feed).
- Native-platform-aware: on IG carousel, the cover sits at full size; on Meta feed it shows with carousel-dots beneath; on LinkedIn document the swipe is a tap-arrow.
- Test card 1 at thumbnail size (320px). If the headline doesn't read, it dies.

## Step 5 — Palette + style continuity

A carousel that breaks visual continuity card-to-card reads as broken. Lock:

- **Palette** — exact hex codes used across all cards. Pick 3 colors (1 dominant, 1 secondary, 1 accent).
- **Type system** — display font + body font + sizes. Same on every card.
- **Layout grid** — where the headline lives, where the hero lives, where the swipe-cue lives. Consistent placement = legibility.
- **Edge treatment** — bleed-out, framed, padded. Same per card.
- **Card-N variation rule** — the only card that breaks the pattern is the CTA card (card N), where the CTA needs to dominate. Even then, palette holds.

Specify the actual values. "Consistent palette" is not a spec — `#FF6B6B / #1F2937 / #FFFFFF, headline Inter Bold 72pt, body Inter Regular 36pt` is.

## Step 6 — Hero subject inventory

List every shootable / generatable subject:

- **Card 1 hero** — what's on the cover
- **Per-card heroes** — one subject per card, listed by card number
- **Continuity character / object** — anything that carries across cards (a character pose-shifting, a product photographed from different angles, a hand showing different gestures)
- **Type-as-image** — when the headline IS the visual on certain cards
- **Brand assets** — logo placement (footer? corner? not at all?)

For each: **already on hand?** yes/no, **generation candidate?** yes/no.

## Step 7 — Image-asset QA

**Tiered:** Tier 1 (full ready) / Tier 2 (visual-only) / Tier 3 (none — full image-gen path).

Checklist per asset:

1. **Resolution** — 1080×1080 minimum for 1:1, 1080×1350 for 4:5
2. **Color space** — sRGB
3. **Aspect consistency** — all source assets crop cleanly to the chosen carousel aspect
4. **Subject in focus & well-lit**
5. **Palette compatibility** — does the asset's color palette fit the carousel's palette, or will it clash?
6. **Negative space for type** — at least one third of frame open
7. **No competitor branding**, no watermarks
8. **Rights cleared**

Fail any → flag + fix (re-export, regenerate, swap card).

## Step 8 — Asset gap check (output, do not block)

Acceptable sources:

- Direct upload (`input:image-*`)
- Public URL
- PDP / site scrape for hero shots
- Brand-asset upload
- AI image generation per-card (Flux / Nano-Banana / Recraft / Imagen / Midjourney)
- Stock if license-cleared
- Existing carousel templates (Canva / Figma) re-skinned

## Step 9 — Generation prompts (per card)

For each card, write a prompt block ready to paste into the chosen image-gen tool. Include subject, composition, palette (hex), style, negative-space allocation, aspect ratio, negative prompt.

If multiple cards share a hero (same product, same character), include a **continuity instruction** — "match the product / character / style from card 1 exactly" — so the model holds consistency.

For tools that support reference-image conditioning (Nano-Banana, Flux with ip-adapter, Midjourney --cref), write the prompt to leverage that.

## Output file

Write the brief to:

```
/tmp/outputs/carousel-brief-{product-slug}.md
```

### Brief format

```markdown
# Carousel Creative Brief — {Product Name}

## Product Snapshot

- **Product:** ...
- **Category:** ...
- **Landing page:** {URL}
- **Offer:** ...
- **Target audience:** ...
- **Placements:** Meta carousel (1:1)
- **Card count:** 5

## Narrative Arc

- **Best guess:** Numbered listicle ("5 reasons").
- **Alternate:** Problem → Solve.
- **Reason:** Product has 5 distinct features that each merit a card; B2B audience tolerates info-density.

## Cover-Card Hook (Ranked)

1. **Numbered listicle**
   - Scroll-stop: Card 1 — solid coral-pink (#FF6B6B) background, "5" in 480pt black sans dead-center, beneath in 56pt: "reasons I switched to [Product]." Bottom-right: subtle "→" arrow + tiny "swipe" label. Logo small bottom-left.
   - Cover headline: "5 reasons I switched."
   - Why: Listicle arc; numbered hooks dominate Meta carousels; cover is type-only so card 2 hero feels like a swipe-reward.
   - Required assets: brand colors (have), logo (have), no photography needed for cover.
   - Risk: low.
2. ...

## Card Sequence

### Card 1 — Cover / Hook

- Visual: Coral-pink fill, "5" in 480pt black centered, "reasons I switched" 56pt below, → arrow bottom-right, logo small bottom-left.
- Copy: "5 reasons I switched."
- Swipe-cue: → arrow, bottom-right.
- Continuity: establishes coral + black + Inter Bold type system.

### Card 2 — Reason 1: "It actually works"

- Visual: Hero product 3/4 angle on coral background (palette continuity), white "1" in corner, headline "It actually works" top.
- Copy: "1 — It actually works."
- Subhead: "94% of users report results in 30 days."
- Swipe-cue: → arrow.
- Continuity: same palette, hero product first appears here = swipe-reward.

### Card 3 — Reason 2: "Half the price of the leader"

- Visual: Side-by-side comparison, two products with price overlays, ours $24 vs. competitor $89.
- Copy: "2 — Half the price."
- Subhead: "$24 vs. $89."
- Swipe-cue: → arrow.

### Card 4 — Reason 3 + Reason 4 + Reason 5 (compressed for example)

- ...

### Card 5 — CTA

- Visual: Hero product on coral, large "Shop now" button graphic, URL, code "SAVE20" in callout.
- Copy: "Get yours."
- Subhead: "Code SAVE20 — 20% off your first order."
- CTA: "Shop the bottle"
- Continuity: full palette closure, logo prominent.

## Palette / Style Continuity

- **Palette:** #FF6B6B coral / #1F2937 charcoal / #FFFFFF white
- **Type:** Inter Bold display 72–480pt, Inter Regular body 36pt
- **Layout grid:** headline top-third, hero center, swipe-cue + brand bottom band
- **Edge treatment:** flat fill bleed-out
- **Card-N variation:** card 5 swaps swipe-cue for CTA button graphic

## Hero Subject Inventory

- **Card 1:** type-as-image, no photography
- **Card 2 hero:** sage-green water bottle 3/4 angle (have, input:image-2)
- **Card 3 hero:** product comparison side-by-side (need composite)
- **Card 4:** chart / receipt — generate
- **Card 5:** product hero + CTA button graphic (have product, need button graphic)

## Image-Asset QA

| Asset         | Resolution | Color space | Notes                     | Verdict |
| ------------- | ---------- | ----------- | ------------------------- | ------- |
| input:image-2 | 4000×4000  | sRGB        | sharp, palette-compatible | PASS    |

## Generation Prompts (per card)

**Card 3 — comparison composite:**

> "Side-by-side product comparison: left side a sage-green 32oz insulated water bottle, right side a generic chrome thermos, both centered on a flat coral-pink (#FF6B6B) background, soft contact shadows, eye-level 3/4 angle, leave top 25% clear for headline copy. Aspect ratio 1:1. Match the product photography from the reference image. No text in image, no other objects, no extra branding."

## Asset Gaps

- Need a clean 1:1 crop of the product comparison; suggest generating with Nano-Banana using input:image-2 as ip-adapter reference.
- CTA button graphic — generate or pull from brand library.
```

## Handoff to image generator + copywriter

The producer's next moves:

1. Generate / collect all per-card heroes following the prompt blocks
2. Pass the **per-card copy** to the copywriter or paste-into-design
3. Composite type over each card per the layout grid
4. Verify continuity across cards (palette, type, hero style)
5. Export all cards at the spec'd aspect, in correct sequence

The image generator MUST:

- Hold visual continuity across cards (same palette, same hero treatment, same style)
- Honor per-card negative-space allocations
- Use reference conditioning where possible to keep characters/products consistent

The copywriter MUST:

- Write all cards as a sequence, not in isolation — the rhythm matters
- Make every card readable as a standalone (no required pre-context)
- Front-load the strongest content in cards 1–3

## Constraints

- **Card 1 ends in a swipe-cue.** No exceptions.
- **One idea per card.** Multi-idea cards split the eye and lose the read.
- **Front-load quality.** Drop-off cliff is between card 3 and card 4. Best content cards 1–3.
- **Standalone-readable.** Any single card should make sense screenshotted alone.
- **CTA on card N is concrete.** Verb + destination + offer if any. Not a brand-feel close.
- **Palette continuity.** No card "borrows" colors that break the system.
- **Anchor in real claims.** No fabricated reviews, AI-faces-as-real-customers, undeliverable promises.
- **Output file contains ONLY the brief.**

---

**Usage:** Dispatched by Producer as a forked skill before image generation + copy. Reads landing page + image assets, writes a Carousel Creative Brief.
