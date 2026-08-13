---
name: 'ads-ecommerce-skill'
description: "Use when the product is a physical ecommerce SKU sold DTC or via marketplace — apparel, beauty, supplements, kitchen, home, gadgets, pet, food/bev, accessories. Produces an Ecommerce Creative Brief — ranked hook concepts, scroll-stop frame spec, hero-SKU inventory, shopping-context dimension, footage QA (product hero / unbox / use-in-context / before-after), enhancement opportunities, and asset gaps. Trigger before scriptwriting whenever the brief mentions a physical product, Shopify store, Amazon listing, DTC brand, ecommerce ad, product ad, or \\\"TikTok made me buy it\\\" style content. The producer should run this skill first so its output feeds ads-scriptwriter-skill (or ads-fast-skill). For game products use ads-games-skill; for service businesses use ads-service-skill; for UGC-style creator video use ads-ugc-skill."
---

# Ads Ecommerce Skill

Produce an **Ecommerce Creative Brief** — a structured document that gives the scriptwriter everything they need to write a high-converting ecommerce video ad. The brief leads with **ranked hook concepts and scroll-stop frames**, backed by hero-SKU inventory, shopping-context analysis, footage QA, and enhancement opportunities.

The audience is TikTok-scrollers, Reels-swipers, Shorts-skippers — who are also one tap away from a checkout. The first 0.5 seconds decides if they stop. The first 3 seconds decides if they stay. Ecommerce ads win when the **product itself is the hook** — the thing-you-can-hold visible on screen so fast the viewer feels they already own it.

This skill runs **before** `ads-scriptwriter-skill` (or `ads-fast-skill`) when the product is a physical ecommerce SKU. The scriptwriter inherits the brief and uses it to choose hook + visual direction.

## What this skill is responsible for

1. **Rank hook concepts** — 3–5 hooks tailored to this product, each with scroll-stop frame (≤ 0.5s) and hook payoff (≤ 3s).
2. **Define the scroll-stop frame** — the single visual that arrests the thumb. For ecom this is almost always the product itself in a surprising state.
3. **Identify the shopping context** — is this impulse or considered? gift or self-purchase? problem-solver or aspirational? Drives tone and offer placement.
4. **Hero-SKU inventory** — the specific product variants, colors, packaging, and accessories that can carry the ad.
5. **Validate product footage** — confirm the user has hero-shots, unbox, use-in-context, and (where relevant) before/after.
6. **Flag enhancement opportunities** — visual upgrades to product footage that don't fake claims but make the ad feel premium and native.
7. **Flag asset gaps** — what's missing, what to ask the user for. Never stall.

## Step 1 — Gather inputs

**Minimum required:** a product name OR a product-page URL (Shopify, Amazon, DTC site).

The producer should pass whatever they have:

- **Product name** and/or **PDP URL** (product detail page, Amazon listing, brand site)
- **Offer / promo** — discount, free shipping threshold, bundle, gift-with-purchase
- **Existing footage / images** — `input:video-*` and `input:image-*` IDs or URLs (hero shots, unbox, lifestyle, UGC reviews, before/after)

**Infer the rest from the PDP.** `web_fetch` the page. Pull: product name, category, price, top features, hero images, review count + average rating, top review quotes, shipping promise, return policy, materials/ingredients, size/variant options, brand story.

**Optional overrides** (use if the producer passes them):

- Target audience / ICP
- Ad duration / platform (TikTok / Reels / Shorts / Meta feed / Pinterest)
- Brand tone constraints
- AOV / margin context (cheap impulse buy vs. premium considered purchase changes the playbook)

## Step 2 — Shopping-context dimension

Ecommerce ads succeed by matching **how the viewer would actually buy this**. Pick a primary + alternate from this menu (or invent one):

- **Impulse buy** — under $40, "add to cart in 2 seconds", emotion-driven (ASMR unbox, satisfying demo, "I had to have it")
- **Considered purchase** — $80+ or category-skeptical, leans on proof (reviews, before/after, comparison, founder story)
- **Gift purchase** — bought for someone else, leans on reaction shots, packaging, "perfect gift for \_\_\_"
- **Problem-solver** — bought to fix a specific pain (back pain, frizzy hair, messy desk), leans on relatable problem + receipt
- **Aspirational / lifestyle** — sold by the world it implies, not the spec sheet (luxe, wellness, "main-character" energy)
- **Replenishment / habit** — consumable, buys again on a cadence, leans on routine integration
- **Discovery / "TikTok made me buy it"** — novel category or new mechanic, leans on "wait WHAT does this do" surprise reveal
- **Comparison / dupe** — explicitly "the [premium brand] dupe", leans on side-by-side and price reveal
- **Trend-rider** — riding a viral moment (Stanley cup, Dyson airstrait, etc.) — leans on cultural callout
- **Status / flex** — visible-when-used, social-currency item

Write: **"Best guess: [primary]. Alternate: [secondary]. Reason: [1 sentence anchored in PDP language, price, and category]."**

## Step 3 — Hero-SKU inventory

From the PDP and any provided images, list every shootable subject:

- **Hero SKU** — the primary product, exact variant/color the ad will feature. Why this one (best-seller, most photogenic, on promo).
- **Variants** — colors / sizes / flavors that should appear in a "look at all the options" beat.
- **Packaging** — box, dust bag, branded sleeve, insert card. Packaging is often the unbox moment.
- **Accessories / kit components** — what's in the box. Lay-flat shots are gold.
- **Use-in-context props** — countertop, bathroom shelf, gym bag, desk setup, kitchen, dog, etc. The world the product lives in.
- **Before/after subject** — if applicable: hair before-after, room before-after, skin before-after, dirty surface before-after.

For each, note: **visual description** (so the scriptwriter can stage shots), **already on hand? yes/no** (existing asset vs. needs shoot), **rights status** if it's a creator's clip.

## Step 4 — Footage QA

For every footage / image asset, run the checks below.

**Tiered inspection:**

- **Tier 1 (full probe):** Registered file or downloadable URL. `ffprobe` for video, dimensions for images. Full confidence.
- **Tier 2 (visual-only):** Platform URL (TikTok, IG, Amazon listing video). Inspect via `web_fetch` and thumbnails. Flag as visual-only.
- **Tier 3 (PDP only):** No footage uploaded. PDP hero images and listing video are the only source. Flag everything as "PDP-sourced — confirm rights and currency with user."

Report PASS / FAIL per asset. Priority order:

1. **Has at least one "moment"** — a hero reveal, an unbox, a satisfying use, a before/after cut, a packaging hit. No moment = no hook.
2. **Aspect ratio matches platform** — 9:16 vertical for TikTok/Reels/Shorts, 1:1 for Meta feed, 16:9 for YouTube long. Wrong ratio = hard fail.
3. **Product clearly visible & in focus** — viewer sees what it is in under 1 second. Logo / packaging readable if hero-branded.
4. **Lighting flatters the product** — no harsh shadow obscuring features, no muddy white-balance, color-true to PDP.
5. **Resolution ≥ 1080p** for hero shots; 720p acceptable for UGC-style. Stable framerate (30/60).
6. **No competitor branding visible** — no Amazon box (unless that's the hook), no rival logos in frame.
7. **Authentic context** — if it's a "kitchen counter" shot, the kitchen looks lived-in not staged unless aspirational is the angle.
8. **No watermarks / capture-tool overlays / TikTok save-stamps**.

Fail any of these → flag + propose fix (re-shoot the hero, request raw, work around with B-roll cover or text-card masking).

## Step 5 — Asset gap check (output, do not block)

If footage is missing, **do not stall**. Write the brief and add an **`## Asset Gaps`** section.

Acceptable footage sources to suggest:

- **Direct upload** through chat (`input:video-*` / `input:image-*`)
- **Public URL** — TikTok / IG / Amazon / CDN
- **PDP scrape** — listing images and video pull as `kind="reference"` assets
- **Existing creator content** the brand has rights to (UGC platform, ambassador library)
- **Self-shot phone footage** — phone-on-counter unbox, hand-in-frame use, mirror selfie
- **AI product photography** — flag as path if user has Ideart / Flux / Nano-Banana access

State only methods the orchestrator actually accepts.

## Step 6 — Hook ranking

Rank 3–5 hooks. For each:

- **Hook name** (from library below, or "custom: ...")
- **Scroll-stop frame** — exact visual in frames 1–15 (≤ 0.5s). Works as a still. One focal point. Motion preferred.
- **One-sentence concept** specific to this product
- **Why it fits** — shopping-context / hero-SKU / footage / audience reason
- **Payoff by** — second mark for hook resolution (≤ 3s)
- **Required assets**
- **Risk**

### Ecommerce hook library

1. **Price shock** — "Wait, $X for THIS?" Scroll-stop: product hero + price overlay big in frame.
2. **Unbox ASMR** — slow, satisfying packaging reveal. Scroll-stop: hands sliding the lid off, branded sleeve visible.
3. **"TikTok made me buy it"** — co-sign framing. Scroll-stop: product in hand + screen-recording of the original viral clip in corner.
4. **Before/after reveal** — visible transformation in frame 1. Scroll-stop: split-screen or hard-cut transition.
5. **Problem-and-receipt** — "If your [pain], watch this." Scroll-stop: the pain visualized (frizzy hair, messy desk).
6. **Dupe / comparison** — "[Premium brand] vs. [our product]." Scroll-stop: side-by-side products with price overlays.
7. **Gift reveal** — recipient reaction. Scroll-stop: face mid-gasp, packaging in foreground.
8. **Listicle / "3 reasons"** — "3 reasons I switched to [product]." Scroll-stop: "1." big, product in hand.
9. **Founder story** — "I made this because…" Scroll-stop: founder direct-to-camera + product on counter.
10. **Demo / "look what it does"** — product doing the thing. Scroll-stop: product mid-action close-up.
11. **Trend-rider** — explicit cultural callout. Scroll-stop: trending visual cue (the audio's signature shot).
12. **Routine integration** — product woven into a morning/night/gym routine. Scroll-stop: routine moment with product.
13. **Behind-the-supply-chain** — "Here's how it's made." Scroll-stop: factory / hands / raw materials.
14. **Anti-ad** — "I'm not gonna sell you on this, just look." Scroll-stop: product on a plain surface, presenter shrug.

**Scroll-stop frame rules:** survives thumbnail crop (center 80%), one focal point, high contrast against the feed, motion preferred, product visible and identifiable in frame 1.

## Step 7 — Enhancement opportunities

List 3–5 ways to upgrade the footage **without faking claims**:

- **Speed ramp** on the unbox or product reveal (2x → 0.5x at the moment of payoff).
- **Tight crop** on satisfying details (texture, glide, click, pour).
- **Macro inserts** — extreme close-up of finish, fabric weave, ingredient texture.
- **Price / claim overlays** with motion — number ticks up/down, text-on with snap.
- **Burned-in captions** word-by-word with color-pop on hook words.
- **Native-platform UI mimicry** — TikTok cart sticker, Amazon star-rating overlay, IG sticker fonts.
- **B-roll cover** of talking head with product macros during demo.
- **Sound design** — pop on text-on, whoosh on transitions, ASMR-mic'd product sounds.
- **Color grade** matching platform native look (slightly cool/contrasty for TikTok; clean/airy for IG).
- **Variant branching** — same body, 3–5 different scroll-stops tested.

Do **not** propose:

- Fake reviews or AI-generated testimonials presented as real
- Visual claims the product can't deliver (filtered before/after on skincare without disclosure, etc.)
- Edited results in regulated categories (weight loss, supplements) without required disclaimers
- Music or footage you don't have rights to

## Output file

Write the brief to:

```
/tmp/outputs/ecom-brief-{product-slug}.md
```

### Brief format

```markdown
# Ecommerce Creative Brief — {Product Name}

## Product Snapshot

- **Product:** ...
- **Category:** ...
- **Price / AOV:** ...
- **PDP:** {URL}
- **Offer:** ...
- **Target audience:** ...
- **Ad duration / platform:** ...

## Hook Concepts (Ranked)

1. **Price shock**
   - Scroll-stop frame: Product hero centered, "$24" in giant pop-on text, finger about to tap "Add to Cart" in corner.
   - Concept: "$24 for this?? I expected $80."
   - Why: Shopping context = impulse; PDP under $30; reviews say "expected to cost more."
   - Payoff by: 0:02
   - Assets: hero-shot (have), price overlay (graphic).
   - Risk: low.
2. ...

## Shopping Context

- **Best guess:** Impulse buy.
- **Alternate:** Discovery ("TikTok made me buy it").
- **Reason:** $24 AOV, 4.8★ with 12k reviews, novel mechanic.

## Hero SKU & Inventory

- **Hero SKU:** Sage green, large size — best-seller per PDP, most photogenic on a kitchen counter.
- **Variants:** sage / cream / black.
- **Packaging:** branded box with magnetic flap, tissue wrap.
- **Accessories:** silicone base, cleaning brush.
- **Use-in-context:** kitchen counter, gym bag, office desk.

## Footage QA

| Asset ID      | Inspection | Aspect | Res       | FPS | Duration | Has moment                        | Verdict |
| ------------- | ---------- | ------ | --------- | --- | -------- | --------------------------------- | ------- |
| input:video-1 | full probe | 9:16   | 1080x1920 | 60  | 22s      | yes (unbox at 0:08, pour at 0:14) | PASS    |

## Enhancement Opportunities

- Speed ramp on the pour at 0:14, freeze on the splash for 0.3s.
- Macro insert of lid-twist mechanism.
- ...

## Asset Gaps

- Need 1 use-in-context shot (in-bag at the gym) for hook #5. Please ask user for a 5-second handheld clip.
```

## Handoff to scriptwriter

Pass the brief path to `ads-scriptwriter-skill` (or `ads-fast-skill`). The scriptwriter MUST:

- Use rank #1 hook unless told otherwise
- Open on the **scroll-stop frame** verbatim — frame 1, non-negotiable
- Show the hero SKU within 1 second
- Match the shopping-context tone (impulse ≠ considered)
- Land hook payoff ≤ 3s, ideally ≤ 2s
- Place offer / CTA last, with urgency only if it's real

## Constraints

- **Scroll-stop in ≤ 0.5 seconds.** Product visible in frame 1. One focal point. Motion preferred.
- **Hook payoff in ≤ 3 seconds.**
- **Be specific.** "Show the product" is not a hook — "$24 in giant overlay over a hero shot, finger reaching toward Add-to-Cart" is.
- **Anchor in real footage.** No fabricated reviews, no AI faces presented as users, no claims the product can't deliver.
- **Platform policy aware.** Skincare, supplements, weight-loss, finance categories need claim-discipline and disclaimers.
- **Output file contains ONLY the brief.**

---

**Usage:** Dispatched by Producer as a forked skill before the scriptwriter, when the product is physical ecommerce. Reads PDP + footage assets, writes an Ecommerce Creative Brief.
