---
name: 'ads-meme-skill'
description: 'Use when the ad format is a meme or native-feed remix — image macros, top-text/bottom-text, two-panel reactions, expanding-brain, distracted-boyfriend-style template, screenshot-stitch, fake-text-thread, fake-comment-callout, Twitter/X-screenshot ad, "this isn''t an ad" disruption, ironic native-feed posts. Produces a Meme Creative Brief — ranked meme-format concepts, scroll-stop spec, cultural-reference fit, irony posture, brand-subtlety dial, copyright/staleness risk audit, generation prompts, and asset gaps. Trigger before image generation/copy whenever the brief mentions meme, meme ad, ironic, "this isn''t an ad", template ad, image macro, native disruption, Reddit-style, X/Twitter screenshot, fake DM, or "make it look like a meme". The producer should run this skill first so its output feeds image-gen + copy. For polished single image use ads-static-image-skill; for swipe use ads-carousel-skill; for video use ads-ugc-skill / ads-animated-storymode-skill.'
---

# Ads Meme Skill

Produce a **Meme Creative Brief** — a structured document that gives the image generator and copywriter everything they need to produce a meme ad that lands. The brief leads with **ranked meme-format concepts**, backed by cultural-reference fit, irony posture, brand-subtlety dial, and a copyright/staleness audit.

A meme ad has a different success criterion than every other ad format: **it has to be funny if you didn't know it was an ad.** That's the entire bar. If you stripped the brand out and showed the meme to a friend, would they laugh? If no, the meme fails — no copy or hashtag rescues it.

The product can't be the punchline — the **format is.** The brand slides in sideways. Heavy-handed branding kills the joke; absent branding wastes the spend. The dial between "this is a real meme" and "this is a brand asset" is the whole craft.

This skill runs **before** image generation and copywriting when the chosen format is meme/native-disruption.

## What this skill is responsible for

1. **Rank meme-format concepts** — 3–5 formats tailored to this product, each with template choice, irony posture, brand placement spec.
2. **Audit the cultural reference** — is the format alive? going stale? already over? Is the audience fluent in it?
3. **Set the irony posture** — earnest / deadpan / ironic / post-ironic / sincere-coded-ironic. Drives copy voice.
4. **Set the brand-subtlety dial** — invisible / sideways / signed / explicit. How much the brand shows up.
5. **Audit copyright / IP** — is the template free-to-use, in trademark territory, or a copyrighted-photo trap?
6. **Validate any provided reference assets**.
7. **Write generation / composition prompts** — ready-to-paste for image-gen or template-fill tools.
8. **Flag asset gaps**. Never stall.

## Step 1 — Gather inputs

**Minimum required:** product/business name OR landing-page URL.

The producer should pass:

- **Product / business name** and/or **landing-page URL**
- **Audience signals** — platform-fluency cues (Gen-Z, Reddit, FinTwit, B2B-LinkedIn-ironic, Beauty-TikTok, etc.). Memes are tribal — wrong tribe = dead meme.
- **Existing brand voice / DNA** — does the brand have an irony license already? (Wendy's-coded vs. Bank-of-America-coded changes everything.)
- **Reference inspiration** — if user provided a meme they want to riff on, capture it
- **Industry profile** — output of game/ecom/service brief if upstream

**Infer the rest from URL.** `web_fetch` site + their existing organic social if findable. The brand's existing ironic capacity matters — a brand that's never cracked a joke can't suddenly land a post-ironic Drake meme.

**Optional overrides:**

- Target placement (Meta feed / IG / X / Reddit / TikTok-image-post / LinkedIn-with-irony-license)
- Hard constraints — no profanity, no political content, no specific competitor mentions
- Brand-irony-license — explicit yes/no/limited

## Step 2 — Cultural reference audit

The first question for any meme: **is this template alive, going stale, or dead?**

For each candidate template, write:

- **Template name** + visible recognition (e.g. "Drake approving / disapproving", "expanding brain", "distracted boyfriend", "two buttons", "anakin / padme four-panel", "Galaxy Brain", "Pikachu shocked face", "fake X/Twitter screenshot", "Reddit AITA post", "fake iMessage thread")
- **Status** — _fresh_ (last 3 months, audience just learning it) / _peak_ (universally recognized, low risk) / _staling_ (everyone's done it, riskier) / _dead_ (cringe to use straight, only viable if subverted)
- **Audience fluency** — does the target audience even know this template? Boomer audiences don't read expanding-brain; Gen-Z doesn't recognize "I can has cheezburger."
- **Copyright / IP status** — is the original image free-to-use, copyrighted-photo (Distracted Boyfriend has been licensed and fought over), or a trademarked character (Spider-Man pointing — Marvel IP, do not touch)
- **Format flexibility** — can the joke fit this template, or are you forcing a square peg?

**Templates that are reliably safe (free-to-use, well-recognized, format-flexible):**

- Drake approving / disapproving (two-panel reaction)
- Expanding brain (4-panel escalation)
- Two buttons (forced choice)
- Distracted boyfriend (cheating-attention) — _was_ a stock photo; check current license status before using
- Anakin / Padme 4-panel (escalating realization)
- Galaxy Brain (similar to expanding brain)
- "Is this a pigeon?" misidentification template
- Stonks / Not Stonks
- Bell curve IQ ("midwits")

**Templates with high IP risk — propose generic alternatives:**

- Any character from films/TV (Spider-Man pointing, Pikachu shocked, SpongeBob)
- Famous-people screenshots without fair-use clearance
- Copyrighted photographs as macros

**Native-disruption formats (no IP risk, often higher upside):**

- Fake X/Twitter screenshot (write your own "tweet")
- Fake iMessage / SMS thread
- Fake Reddit post / comment thread
- Fake LinkedIn post
- Fake search-engine results page
- Fake Notes-app screenshot
- Fake "delete this" reply
- Native-feed-clone post (looks like an organic IG / TikTok post)

Native-disruption almost always beats trademark-risky templates.

Write: **"Best guess: [template]. Status: [fresh/peak/staling/dead]. Risk: [low/med/high]. Reason: [1 sentence anchored in audience and brand]."**

## Step 3 — Irony posture

Memes have a tone dial. Pick:

- **Earnest** — the meme format is used straight, no winking. Best when the audience is meme-fluent but the brand isn't ironic-licensed.
- **Deadpan** — straight-faced delivery of an absurd premise. Comedy timing without telling you it's a joke.
- **Ironic** — clearly performing a meme, brand acknowledges the format. Peak Meta voice, ~2018-2021.
- **Post-ironic** — the meme is so dead it's funny again, layered self-awareness. Risky — only works for brands with real comedy reps.
- **Sincere-coded-ironic** — looks like sincere advice / heartfelt post but is actually selling something. Best for "this isn't an ad" disruption.
- **Self-deprecating** — brand makes fun of itself. Highest trust earner when authentic.

**Irony posture × brand-irony-license check:**

- Brand has irony license (Wendy's, Duolingo, Steak-umm, Aviation Gin) → all postures available
- Brand is professional / institutional (banks, healthcare, B2B SaaS) → earnest or deadpan only; ironic without earned reps reads desperate
- Brand is new / unknown → earnest, deadpan, or sincere-coded; can't post-iron without context

## Step 4 — Brand-subtlety dial

How visible is the brand in the meme? Pick a position:

- **Invisible (0%)** — meme is brand-free; only the caption/handle reveals it's an ad. Highest organic-feel; zero-recall risk.
- **Signed (10–20%)** — small logo / wordmark in a corner; meme-first, brand-second.
- **Sideways (30%)** — product or brand element appears in the meme as a casual prop, not the punchline. The joke would still work without it.
- **Integrated (50%)** — meme structurally references the product (the product replaces a panel character).
- **Explicit (70%+)** — meme is clearly about the product. Often kills the joke.

**Rule of thumb:** the funnier the meme, the more invisible the brand can be (the meme carries recall). The weaker the joke, the more visible the brand has to be (and the worse the ad). Strong joke + invisible brand > weak joke + loud brand.

**The "would this be funny without the brand?" test** — if the answer is no, the meme isn't done.

## Step 5 — Meme-format concept ranking

Rank 3–5 concepts. For each:

- **Template / format** (from menu, or "custom")
- **Concept** — write the actual joke. Verbatim copy on the meme. The whole thing.
- **Scroll-stop spec** — what the viewer sees in the thumbnail before they read. Template recognizability is the stop; the punchline is the stay.
- **Irony posture** — chosen tone
- **Brand-subtlety dial position** — chosen %
- **Why it fits** — audience / cultural moment / product mechanic / brand voice
- **Copyright / staleness risk** — flag explicitly
- **Required assets** — template image, custom photography, brand logo
- **Risk** — what could make it flop (joke doesn't land, audience doesn't know template, brand reads as desperate, stale format)

### Meme-format hook library

1. **Drake two-panel** — disapprove (boring alternative) / approve (your product). Earnest or deadpan; sideways brand.
2. **Expanding brain 4-panel** — escalating realizations, last panel = product use case. Ironic; sideways or integrated.
3. **Two buttons** — character sweating between two terrible choices, your product is the secret third option below.
4. **Bell curve / midwit** — both ends agree, midwit overcomplicates. Best for "obvious good thing" products.
5. **Fake X/Twitter screenshot** — write your own "viral tweet" promoting the product organically. High craft, high upside.
6. **Fake iMessage thread** — text exchange between two friends discussing the product. Sincere-coded-ironic.
7. **Fake Reddit post / comment** — "I tried [product] for 30 days and…" written as an organic Reddit post.
8. **Fake LinkedIn post** — earnest oversharing parody, "I just hit my Q3 numbers thanks to [product]." Best for B2B with irony-license.
9. **Anakin / Padme 4-panel** — escalating realization the partner doesn't share. Ironic.
10. **POV-meme** — "POV: you finally [product benefit]." Sincere or ironic.
11. **"Tag yourself"** — multi-quadrant identity-meme matching personality types to product features.
12. **Anti-ad meta** — "I'm not gonna show you another ad. Here's an actually useful tip" → tip is the product.
13. **Stonks / not stonks** — financial up/down. Best for fintech, savings products, ROI claims.
14. **Native-feed-clone** — looks like an organic post/screenshot/note in the platform's UI.
15. **Misidentification ("is this a pigeon?")** — wrong-label confusion, last panel = correct identification (your product).
16. **Galaxy brain / cosmic enlightenment** — escalating cosmic stakes for a tiny insight that ends in your product.
17. **Fake search-results page** — "How do I [pain]?" → top result is your product.
18. **"Delete this" reply meme** — earnest oversharing punchline.
19. **Self-roast** — brand makes fun of itself. Authenticity earner.
20. **Comment-stitch / quote-tweet roast** — respond to a real (or invented) bad take with a brand-flex.

**Scroll-stop rules for memes:**

- Template must be recognizable at thumbnail size — squinting-to-identify kills it
- Top text or first panel must hint at the joke before the swipe/click
- Native-disruption formats: must look pixel-accurate to the platform UI they're mimicking — wrong fonts/spacing reads as fake immediately
- One-glance comprehension — meme that needs 5 seconds to "get" is dead

## Step 6 — IP / copyright / staleness audit

For the chosen concept, write a one-line risk assessment:

- **Template IP status:** [free-to-use / licensed-photo / trademarked / questionable] → [proceed / replace template / get cleared / abandon]
- **Cultural staleness:** [fresh / peak / staling / dead] → [proceed / proceed-with-subversion / abandon]
- **Audience fluency:** [confident / probably-fluent / risky / unknown] → [proceed / test small / abandon]
- **Brand-fit:** [matches voice / stretches voice / off-brand] → [proceed / soften / abandon]
- **Platform policy:** [safe / flag-risk-X / known violation] → [proceed / edit / abandon]

If two or more are red, propose a different concept.

## Step 7 — Asset readiness QA

**Tiered:** Tier 1 (full ready) / Tier 2 (visual-only ref) / Tier 3 (none — full image-gen path).

Checklist:

1. **Template asset** — do you have the base image (or fake-UI mockup) at sufficient resolution?
2. **Custom photography** — if the meme requires the product/face appearing in a panel, is it on-hand?
3. **Brand assets** — logo / wordmark for signing, in vector
4. **Native-UI accuracy** — for fake-screenshot formats: correct font (San Francisco for iMessage, Helvetica/Inter for X, IBM Plex Sans for Reddit), correct spacing, correct UI chrome
5. **Aspect ratio** — meme native is 1:1 for most platforms; X-screenshot memes look better as 4:5 to fit feed
6. **Resolution** — 1080×1080 minimum for image macros, 1200×675 for X-screenshot fakes
7. **Rights cleared** on any human face appearing
8. **No watermarks** from meme-generators or stock libraries

Fail any → flag + fix (regenerate, remake at higher res, swap template).

## Step 8 — Asset gap check (output, do not block)

Acceptable sources:

- Direct upload (`input:image-*`) — provide template + custom assets
- Public URL — meme template repositories (KnowYourMeme, Imgflip), platform UI screenshots
- AI image generation — Flux / Nano-Banana for custom panels; for native-UI mocks, prefer a UI mockup tool (Figma) over image-gen
- Brand-asset upload
- Existing brand meme history if the brand has run memes before

State only methods the orchestrator accepts.

## Step 9 — Generation / composition prompts

For each ranked concept, write the build instructions:

**For template-based memes (Drake, expanding brain, etc.):**

```
Template: {name}
Source image: {URL or input:image-*}
Panel 1 text: "{verbatim copy}"
Panel 2 text: "{verbatim copy}"
Font: Impact (classic) or Arial Black, white with black stroke, top-and-bottom-text style
Brand placement: {invisible / corner-logo / signed-handle in caption}
Output: 1080×1080 PNG
```

**For native-disruption (fake X tweet, fake iMessage, fake Reddit):**

```
Format: {fake X tweet | fake iMessage | fake Reddit post | fake LinkedIn post | fake Notes app}
UI accuracy: pixel-perfect mock — use Figma template or UI-mockup tool
Profile / handle: "{display name}" / "@{handle}" — write a believable account that fits the joke
Body copy: "{verbatim post text}"
Replies / engagement: {if including, write each reply verbatim}
Brand placement: {invisible / handle-only / integrated as a casual mention}
Output: 1080×1080 or 1200×675 PNG
```

**For AI-generated custom memes:**

```
Tool: Flux / Nano-Banana / Recraft
Subject: {described visually}
Composition: {framing, focal point}
Style: {photographic / illustrated / cursed-AI-look / etc.}
Caption / overlay: composite separately — do not let image-gen render text
Aspect ratio: 1:1
Negative prompt: no extra text, no logos beyond brand, no extra hands, no warped faces
```

## Output file

Write the brief to:

```
/tmp/outputs/meme-brief-{product-slug}.md
```

### Brief format

```markdown
# Meme Creative Brief — {Product Name}

## Product Snapshot

- **Product:** ...
- **Category:** ...
- **Landing page:** {URL}
- **Target audience:** ...
- **Platform:** ...
- **Brand-irony-license:** earned / limited / none

## Cultural Reference Audit

- **Template chosen:** Fake X/Twitter screenshot.
- **Status:** peak.
- **Audience fluency:** confident (target = 25–35 X-fluent FinTwit).
- **IP risk:** low (writing original "tweet").
- **Reason:** native to platform; X-screenshot memes are evergreen.

## Irony Posture

- **Chosen:** Sincere-coded-ironic.
- **Reason:** brand has limited irony license; safer than ironic; lets the "tweet" do the work.

## Brand-Subtlety Dial

- **Chosen:** Sideways (30%).
- **Placement:** "tweet" handle is the brand's actual X handle; product mentioned casually in the body.

## Concepts (Ranked)

1. **Fake X tweet — sincere-coded oversharing**
   - Concept: Tweet text — "btw if you've been waiting to switch to [Product] just do it. did the math, would've saved $340 last year. genuinely annoyed at myself."
   - Scroll-stop: pixel-accurate X tweet, 1.2K likes, 89 RTs visible, brand handle as poster.
   - Format: vertical fake-tweet screenshot, 1200×900.
   - Irony: sincere-coded-ironic.
   - Brand subtlety: 30% (handle + casual product mention).
   - Why: FinTwit audience clones this format daily; sincere-coded reads native; "did the math" voice fits brand.
   - IP risk: low.
   - Required assets: brand X-handle profile pic + correct UI mock.
   - Risk: medium — must pixel-match X UI exactly or it reads as fake.
2. ...

## IP / Copyright / Staleness Audit

- Template IP: free-to-use (original tweet).
- Staleness: peak — fake-X-screenshot ads still working as of {current quarter}.
- Audience fluency: confident.
- Brand-fit: matches casual-numerate voice.
- Platform policy: safe (no impersonation, brand using its own handle).

## Asset Readiness QA

| Asset               | Notes                             | Verdict    |
| ------------------- | --------------------------------- | ---------- |
| Brand X profile pic | have, 400×400                     | PASS       |
| X UI mock template  | need — use Figma X tweet template | FAIL → fix |
| Brand logo          | have                              | PASS       |

## Generation / Composition Prompts

**Build:**

- Open Figma / Sketch X-tweet template (latest UI — verify against current X.com)
- Profile pic: brand 400×400 avatar
- Display name: "[Brand]"
- Handle: "@[brand_handle]"
- Body: "btw if you've been waiting to switch to [Product] just do it. did the math, would've saved $340 last year. genuinely annoyed at myself."
- Engagement: 1.2K likes, 89 RTs, 14 replies (numbers chosen to look organic — 4-digit likes, low-RT-ratio reads real)
- Time: "2h" — recent enough to feel live
- Export 1200×900 PNG, sRGB.

## Asset Gaps

- Need current X UI mock template (X has redesigned multiple times — verify 2026 UI is what we replicate, not 2022).
```

## Handoff to image generator + composer

The producer's next moves:

1. Build the meme per the composition prompt — most native-disruption formats are better built in Figma / Sketch than image-gen
2. For traditional template memes, composite text over the template at the spec'd font/style
3. Verify the meme would land if the brand were stripped out — the "is this funny without the brand?" test
4. QA pixel-accuracy on native-UI mocks against current platform UI
5. Export at correct platform aspect

The composer MUST:

- Match platform UI pixel-perfect for native-disruption formats (wrong font = caught immediately)
- Honor the brand-subtlety dial position — don't over-brand if spec says invisible
- Preserve verbatim copy — meme copy is the joke; rewriting kills timing

## Constraints

- **The "funny without the brand" test.** If the joke doesn't land brand-stripped, the meme isn't done.
- **Native-UI accuracy.** Fake-screenshot formats are unforgiving — wrong font, wrong spacing, wrong UI chrome = audience clocks it as fake immediately.
- **Stale = abandon.** A dead template can't be saved by good copy. Replace.
- **IP discipline.** No trademarked characters as templates without clearance. No copyrighted photos as macros without license.
- **Brand-irony-license honesty.** A brand without irony reps shouldn't post-ironic. Match the dial to the brand's actual reputation.
- **Platform policy.** Some platforms restrict impersonation, fake-news-style screenshots, fake-celebrity tweets. Brands must use their own accounts.
- **One-glance comprehension.** Meme that needs explanation is dead.
- **Don't punch down.** No memes whose joke depends on mocking marginalized groups.
- **Output file contains ONLY the brief.**

---

**Usage:** Dispatched by Producer as a forked skill before image-gen + composition. Reads landing page + cultural-fluency cues + brand-irony-license, writes a Meme Creative Brief.
