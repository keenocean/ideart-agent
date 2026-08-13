---
name: 'ads-static-image-skill'
description: 'Use when the ad format is a single static image — Meta feed, Instagram feed, Pinterest, Reddit, Google Display, programmatic banners, LinkedIn single-image, X/Twitter image post. Produces a Static Image Creative Brief — ranked composition concepts, scroll-stop frame spec, focal-point + copy hierarchy, color/contrast direction, image-asset QA, per-platform size matrix, generation prompts, and asset gaps. Trigger before scriptwriting/design whenever the brief mentions a static ad, image ad, banner, single-image creative, "make a poster", Meta image post, Pinterest pin, or Display creative. The producer should run this skill first so its output feeds the image-generator (Flux / Nano-Banana / Recraft / Imagen) and copywriter. For video formats use ads-ugc-skill / ads-animated-storymode-skill; for swipe-format use ads-carousel-skill; for meme-format use ads-meme-skill.'
---

# Ads Static Image Skill

Produce a **Static Image Creative Brief** — a structured document that gives the image generator and copywriter everything they need to produce a high-converting single-frame ad. The brief leads with **ranked composition concepts and scroll-stop specs**, backed by focal-point math, copy hierarchy, color/contrast direction, image-asset QA, and per-platform size matrix.

A static ad has **no second chance.** No 3-second window. No payoff to wait for. The viewer either stops on frame 1 or doesn't. The whole job is the composition: **one focal point, one promise, one decision.** A static ad that tries to say two things says nothing.

This skill runs **before** image generation and copywriting. The output feeds image-gen tools (Flux / Nano-Banana / Recraft / Imagen / Midjourney) and the copy module.

## What this skill is responsible for

1. **Rank composition concepts** — 3–5 layouts tailored to this product, each with focal point, copy hierarchy, and color/contrast spec.
2. **Define the scroll-stop** — for static this _is_ the entire ad. The first frame and the only frame.
3. **Lock copy hierarchy** — headline / subhead / CTA / proof — what reads first, second, third.
4. **Pick a color/contrast direction** — the palette and contrast strategy that makes the ad cut through.
5. **Inventory hero subjects** — products, faces, results, type-as-image.
6. **Validate image assets** — confirm hero photography, brand assets, and reference images are usable.
7. **Spec the per-platform size matrix** — 1:1, 4:5, 9:16, 1.91:1 versions with safe zones.
8. **Write generation prompts** — ready-to-paste prompts for the chosen image-gen tool.
9. **Flag asset gaps** — what's missing, what to ask the user for. Never stall.

## Step 1 — Gather inputs

**Minimum required:** a product/business name OR a landing-page URL.

The producer should pass:

- **Product / business name** and/or **landing-page URL**
- **Headline / value-prop** if pre-decided (otherwise infer from page)
- **Offer / promo** — discount, "free X", "starting at Y"
- **Existing image assets** — `input:image-*` IDs or URLs (hero shots, lifestyle, founder photos, before/after, brand assets)
- **Brand profile** — `brand-profile.json` if present (colors, fonts, tone, logo)
- **Industry profile** — if a category-specific brief exists (game-skill / ecom-skill / service-skill output), inherit it for tone and trust signals

**Infer the rest from the URL.** `web_fetch` the homepage / PDP / service page. Pull: headline value-prop, hero imagery style, brand colors visible, top reviews, pricing, audience cues.

**Optional overrides:**

- Target audience
- Placements requested (Meta feed only / Pinterest / Display network)
- Design constraints — must include logo, must avoid claim X, brand-locked palette
- Image-generation tool (Flux / Nano-Banana / Recraft / Imagen / Midjourney)

## Step 2 — Composition strategy

Static ads work by composition logic, not narrative logic. Pick a primary + alternate composition pattern from this menu (or invent one):

- **Hero on color block** — product floats on a bold flat-color background; copy in negative space. Best for impulse ecom + new-product launches.
- **Big-type shock** — copy IS the visual; product/face is small. Best when the headline is the hook ("$24" / "STOP" / "FINALLY").
- **Before/after split** — vertical or horizontal split, transformation visible. Best for service results, beauty, fitness, home.
- **Lifestyle frozen-moment** — a real-world scene, product woven in as the obvious answer. Best for aspirational ecom, premium goods, food/bev.
- **Hand-in-frame demo** — first-person hand holding/using the product. Best for ASMR products, gadgets, beauty applicators.
- **Comparison grid** — 2x2 or before/after-with-third (us vs. them vs. doing nothing). Best for dupe ads, category disruption.
- **Stat / receipt** — a single number takes 60% of the frame. Best for service results, financial outcomes, social-proof flexes.
- **Quote / testimonial card** — a real customer quote in giant type, photo small. Best for trust-driven categories.
- **Founder / face direct** — a person looking at the camera, copy framing them. Best for service, course, personal-brand.
- **Native-platform mimicry** — looks like a Pinterest pin / Reddit post / IG screenshot. Best for "anti-ad" disruption.
- **Maximalist collage** — many items / use-cases / SKUs tiled. Best for variety, "everything you get", launch hauls.
- **Minimalist single-object** — one product, one shadow, one word. Best for premium positioning.
- **Pattern-interrupt absurd** — an unexpected juxtaposition (a salad in a tire, a laptop on the moon). Best for high-attention awareness top-of-funnel.

Write: **"Best guess: [primary]. Alternate: [secondary]. Reason: [1 sentence anchored in product, audience, and platform]."**

## Step 3 — Focal-point + copy hierarchy

The viewer's eye lands once. Where? Then where second?

**Define three layers:**

1. **Primary focal point** — the ONE thing the eye lands on. Product hero / face / number / headline word. Center 60% of the frame, highest contrast against background.
2. **Secondary read** — what the eye finds next, 0.3 seconds later. Headline if focal is product; product if focal is headline; CTA if both are visual.
3. **Tertiary read** — proof + CTA. Star rating, "as seen in", logo, "Shop now" button. Bottom 20% safe zone.

**Copy hierarchy** — write all four:

- **Headline** — ≤ 7 words, the promise. "I tried a $24 [product] and now [result]" — too long. "Don't buy [category] until you read this." — better.
- **Subhead** — ≤ 12 words, the why. Adds context the headline can't carry alone.
- **Proof** — star rating, customer count, press logos, "Used by 100,000+", credential. One artifact.
- **CTA** — verb-led, ≤ 4 words. "Shop now" / "Get 20% off" / "Book free quote" / "Try it free". Match the conversion event.

**Type rules:**

- Headline must be readable at thumbnail size (~ 320px wide on mobile feed)
- Body never on busy background — solid fill, gradient overlay, or knockout
- Brand font for display, system-safe for body if licensing limits
- Color contrast ≥ 4.5:1 for body, ≥ 3:1 for display

## Step 4 — Color / contrast direction

Pick a **palette strategy** + **contrast posture:**

**Palette strategies:**

- **Brand-locked** — use brand colors verbatim (recognition over disruption)
- **Brand-color + complementary pop** — brand for hero, complementary for callout (best balance)
- **High-contrast monochrome** — black/white only, color reserved for CTA (premium / disruptive)
- **Saturated single-color background** — one bold color filling 70% of the frame
- **Native-feed-mimic** — looks like a screenshot of the platform (anti-ad disruption)
- **Photographic full-bleed** — image fills frame, type knocked out white over dark portion

**Contrast postures:**

- **Loud** — saturated, max-contrast, busy feed-cutter (TikTok organic feel, value brands)
- **Editorial** — magazine-coded, generous white space, premium-quiet
- **Tactile** — texture-rich, paper/fabric/grain backgrounds (food, craft, home)
- **Tech-clean** — gradient, soft shadow, pill-button (SaaS, fintech, B2B)
- **Native-screenshot** — looks like a tweet, comment, search result (disruptive)

Specify the actual colors as hex. "Bright" is not a color — `#FF6B35` is.

## Step 5 — Hero subject inventory

List every shootable / generatable subject the brief might use:

- **Hero product / SKU** — exact variant, packaging state, hero angle (3/4 / front / hand-held)
- **Faces** — founder, customer, model — with descriptors specific enough to generate or shoot
- **Results / before-after** — the transformation visible
- **Type-as-image** — when copy IS the hero (the headline word in 300pt)
- **Receipts / artifacts** — checks, screenshots, ratings, certificates (PII-redacted)
- **Lifestyle props** — what surrounds the hero (mug, plant, laptop, kitchen, gym)
- **Brand assets** — logo, mark, brand-shape, repeating motif

For each: **already on hand?** yes/no, **generation candidate?** yes/no (can be made by image-gen vs. needs real photography).

## Step 6 — Image-asset QA

For every provided image asset, run the checks below.

**Tiered:**

- **Tier 1 (full ready):** Asset is registered or downloadable. Confirm dimensions, color space, file format. Full confidence.
- **Tier 2 (visual-only):** Platform URL, preview thumbnail. Visual inspection only.
- **Tier 3 (none):** No image assets. Brief proceeds with full image-gen prompt strategy.

Checklist (PASS / FAIL each):

1. **Resolution** — minimum 1080×1080 for 1:1, 1080×1350 for 4:5, 1080×1920 for 9:16, 1200×628 for 1.91:1. Higher always better; can downsize, can't upsize.
2. **Color space** — sRGB for digital. Flag CMYK or P3 (will shift on platform compression).
3. **File format** — PNG with alpha for assets, JPG for photographic, AVIF/WebP only if platform supports.
4. **Subject in focus** — sharp at 100% crop on the focal area.
5. **Negative space** — at least 30% of frame open enough to hold copy without conflict.
6. **No competitor branding** — no rival logos, no Amazon boxes (unless intentional).
7. **No watermarks / stock-photo signatures**.
8. **Lighting** — flatters subject, no harsh blown-highlights, no muddy shadows obscuring product detail.
9. **Aspect ratio** — note the native ratio; flag if cropping to target placement loses critical content.
10. **Rights cleared** — model release if recognizable face, license confirmed if stock or creator-supplied.

Fail any → flag + propose fix (re-export, re-shoot, ask for raw, generate replacement with image-gen).

## Step 7 — Asset gap check (output, do not block)

Acceptable sources to suggest:

- **Direct upload** — `input:image-*`
- **Public URL** — PDP / Pinterest / IG / CDN
- **PDP scrape** — listing images pull as `kind="reference"` assets
- **Brand-asset upload** — logo, brand colors, brand fonts
- **AI image generation** — Flux / Nano-Banana / Recraft / Imagen / Midjourney for hero product, lifestyle, characters, abstract backgrounds
- **Stock library** — Unsplash / Pexels / Adobe Stock if license confirmed; flag stock-feel risk

State only methods the orchestrator actually accepts.

## Step 8 — Composition concept ranking

Rank 3–5 composition concepts. For each:

- **Composition name** (from menu, or "custom")
- **Scroll-stop spec** — the entire visual described in detail. What's in the center. What's in the corners. What color dominates. What word is biggest. (Generation-ready.)
- **One-sentence concept** specific to this product
- **Copy block** — headline + subhead + proof + CTA, written
- **Why it fits** — composition / palette / hero / audience reason
- **Required assets** — which hero images, which type, which logo
- **Risk** — what could make it flop (illegible at thumbnail, message-product mismatch, claim risk)

Always prefer concepts where the focal point and the headline reinforce the same idea — never one saying X and the other saying Y.

**Scroll-stop rules for static:**

- Test at thumbnail size (320px square). If the focal point + headline don't read at that size, the ad fails on mobile feed.
- Center 80% safe zone — platforms crop edges differently across placements.
- Headline word-count ≤ 7 for feed; ≤ 5 for Display banners.
- One face, one product, one number — pick at most TWO of these in frame.

## Step 9 — Per-platform size matrix

For each concept, list the sizes the producer will need:

| Placement                | Aspect     | Pixels               | Safe zone                                       | Notes                   |
| ------------------------ | ---------- | -------------------- | ----------------------------------------------- | ----------------------- |
| Meta feed (1:1)          | 1:1        | 1080×1080            | center 80%                                      | most universal          |
| Meta / IG feed (4:5)     | 4:5        | 1080×1350            | center 80% top, bottom 20% reserved for caption | best feed real estate   |
| Meta / IG Stories (9:16) | 9:16       | 1080×1920            | top 250px, bottom 250px reserved for UI         | leave room              |
| Pinterest pin            | 2:3        | 1000×1500            | center 80%                                      | tall preferred          |
| Reddit                   | 1:1 or 4:3 | 1080×1080 / 1200×900 | full                                            | minimal type works      |
| LinkedIn single-image    | 1.91:1     | 1200×627             | full                                            | professional tone       |
| Display 300×250          | —          | 300×250              | full                                            | type ≤ 4 words          |
| Display 728×90           | —          | 728×90               | full                                            | type ≤ 5 words          |
| Display 160×600          | —          | 160×600              | full                                            | very narrow, hero-heavy |

Pick only the sizes the producer specified. Don't generate every variant by default.

## Step 10 — Generation prompts

For each ranked concept, write a ready-to-paste prompt for the chosen image-gen tool. Include:

- **Subject** — described visually with specifics ("30-something woman, tired smile, holding a sage-green water bottle")
- **Composition** — framing, focal-point placement ("centered, 3/4 angle, eye-level")
- **Style** — photographic / illustrated / 3D-render / flat-vector
- **Lighting** — direction, quality, color temperature
- **Palette** — hex codes or named palette
- **Negative-space spec** — "leave top 30% clear for headline copy"
- **Aspect ratio** — explicit
- **Negative prompt** — what to exclude (no text-in-image unless intentional, no extra hands, no logos other than brand)

Use the syntax of the chosen tool (Flux, Midjourney, Nano-Banana). If unknown, write a tool-agnostic prompt.

## Output file

Write the brief to:

```
/tmp/outputs/static-brief-{product-slug}.md
```

### Brief format

```markdown
# Static Image Creative Brief — {Product Name}

## Product Snapshot

- **Product:** ...
- **Category:** ...
- **Landing page:** {URL}
- **Offer:** ...
- **Target audience:** ...
- **Placements requested:** Meta feed (1:1, 4:5), Pinterest

## Composition Concepts (Ranked)

1. **Hero on color block**
   - Scroll-stop: Sage-green 32oz water bottle, perfectly centered, 3/4 angle, against a flat coral-pink background (#FF6B6B), soft contact shadow. Top-left: "$24" in 240pt black sans. Bottom-right: 4.9★ + "12,000+ reviews" small. Logo bottom-center.
   - Headline: "$24. The bottle that ate the internet."
   - Subhead: "12,000+ reviews. Free shipping over $40."
   - Proof: 4.9★
   - CTA: "Shop the bottle"
   - Why: Impulse shopping context; hero SKU is photogenic; price-shock works at this AOV; high-contrast palette cuts through feed.
   - Required assets: hero shot 3/4 angle (have, input:image-2) + brand logo (have).
   - Risk: low.
2. ...

## Focal-Point + Copy Hierarchy

- **Primary focal:** Product hero, dead-center, 60% of frame.
- **Secondary read:** "$24" top-left, 240pt black.
- **Tertiary read:** 4.9★ + review count + logo bottom band.

## Color / Contrast Direction

- **Palette:** Coral-pink #FF6B6B background, sage-green product, charcoal #1F2937 type, white #FFFFFF for proof band.
- **Posture:** Loud (saturated, max-contrast, feed-cutter).

## Hero Subject Inventory

- **Hero SKU:** sage-green 32oz, magnetic-flip lid, on-hand.
- **Brand assets:** logo SVG, brand colors documented.

## Image-Asset QA

| Asset         | Resolution | Color space | Subject focus | Negative space | Verdict |
| ------------- | ---------- | ----------- | ------------- | -------------- | ------- |
| input:image-2 | 4000×4000  | sRGB        | sharp         | 50% open       | PASS    |

## Per-Platform Size Matrix

| Placement | Aspect | Pixels    |
| --------- | ------ | --------- |
| Meta feed | 1:1    | 1080×1080 |
| Meta feed | 4:5    | 1080×1350 |
| Pinterest | 2:3    | 1000×1500 |

## Generation Prompts (if regenerating hero)

**Flux / Nano-Banana:**

> "Studio product photography of a sage green 32oz insulated water bottle with magnetic flip lid, centered 3/4 angle, eye-level, on a flat coral-pink (#FF6B6B) background, soft natural contact shadow beneath, no reflection, hyperreal product detail, sharp focus on the bottle, leave top 30% clear for headline copy. Aspect ratio 1:1. No text in image, no other objects, no extra branding."

## Asset Gaps

- Need 4:5 vertical crop of hero shot for IG-feed placement. Suggest re-crop from input:image-2 or regenerate at 4:5.
```

## Handoff to image generator + copywriter

The producer's next moves:

1. Pass the **generation prompt** to the chosen image-gen tool (Flux / Nano-Banana / Recraft / Imagen).
2. Pass the **copy block** to the copywriter or paste-into-design.
3. Composite type over the generated/provided image at the spec'd hierarchy.
4. Export per-platform sizes from the matrix.

The image generator MUST:

- Match the focal-point spec — the hero lands where specified
- Honor the negative-space allocation — type area stays clear
- Hit the palette hex codes exactly
- Generate at or above target resolution

The copywriter MUST:

- Stay within the headline / subhead / CTA word counts
- Preserve the headline-focal-point alignment (don't say something the image doesn't show)

## Constraints

- **One focal point.** Two focal points = no focal point.
- **Thumbnail test.** If it doesn't read at 320px, it doesn't ship.
- **Center 80% safe zone.** Edges crop differently per placement.
- **Headline ≤ 7 words.** Subhead ≤ 12. CTA ≤ 4.
- **Anchor in real claims.** No fabricated reviews, no AI-generated faces presented as real customers, no claims the product can't deliver.
- **Platform policy aware.** Meta restricts text-overlay percentage on Reels-feed-crossover, weight-loss / before-after rules apply to skincare and fitness, financial-claims discipline.
- **Output file contains ONLY the brief.**

---

**Usage:** Dispatched by Producer as a forked skill before image generation + copy. Reads landing page + image assets, writes a Static Image Creative Brief.
