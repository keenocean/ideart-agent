---
name: 'ads-service-skill'
description: 'Use when the product is a service business — agencies, contractors, lawyers, dentists, med-spas, coaches, consultants, cleaners, lawn care, plumbers, real-estate, financial advisors, fitness trainers, salons, tutoring, home services, B2B services. Produces a Service Creative Brief — ranked hook concepts, scroll-stop frame spec, operator/founder persona, trust posture, result-portrait inventory, footage QA (result B-roll / process / interview / location), enhancement opportunities, and asset gaps. Trigger before scriptwriting whenever the brief mentions a service business, agency, local business, "near me" search intent, lead-gen ad, booking ad, consultation ad, or any non-physical-product offering. The producer should run this skill first so its output feeds ads-scriptwriter-skill (or ads-fast-skill). For physical products use ads-ecommerce-skill; for games use ads-games-skill; for UGC creator format use ads-ugc-skill.'
---

# Ads Service Skill

Produce a **Service Creative Brief** — a structured document that gives the scriptwriter everything they need to write a high-converting service-business ad. The brief leads with **ranked hook concepts and scroll-stop frames**, backed by operator persona, trust posture, result-portrait inventory, footage QA, and enhancement opportunities.

The audience is TikTok-scrollers, Reels-swipers, Shorts-skippers — but service ads carry a heavier lift: there's no product to hold, only a **promise**. The first 0.5 seconds decides if they stop. The first 3 seconds decides if they trust enough to keep watching. Service ads win when the **result is visible in frame 1** — the after, the transformation, the receipt — before any words.

This skill runs **before** `ads-scriptwriter-skill` (or `ads-fast-skill`) when the product is a service. The scriptwriter inherits the brief and uses it to choose hook + visual direction.

## What this skill is responsible for

1. **Rank hook concepts** — 3–5 hooks tailored to this service, each with scroll-stop frame (≤ 0.5s) and hook payoff (≤ 3s).
2. **Define the scroll-stop frame** — usually a result, a transformation, or an authoritative face. Service ads can't open on a product hero; they open on proof.
3. **Pick a trust posture** — authority / friendly-expert / urgent-warning / specialist / hometown — that drives voice and visual treatment.
4. **Build the operator/founder persona** — who fronts the ad, what they look like, what credentials they carry visibly.
5. **Inventory result-portraits** — the visible "afters" the service produces (clean lawn, restored car, fixed pipe, transformed smile, signed contract, weight loss).
6. **Validate footage** — confirm there is at least one result B-roll, one process shot, and either a founder/operator interview or a customer testimonial.
7. **Flag enhancement opportunities** — visual upgrades that don't fabricate outcomes but make the trust read instantly.
8. **Flag asset gaps** — what's missing, what to ask the user for. Never stall.

## Step 1 — Gather inputs

**Minimum required:** a business name OR a service-page URL.

The producer should pass whatever they have:

- **Business name** and/or **website URL** (homepage, services page, GMB profile, Yelp page)
- **Service offering details** — what's sold, price/range if disclosed, lead-magnet (free quote, free consult, free audit)
- **Geo / market** — local (city, neighborhood) vs. national vs. niche-vertical
- **Footage assets** — `input:video-*` IDs or URLs (result B-roll, before/afters, founder interview, customer testimonials, location shots)
- **Credentials** — licenses, certifications, years in business, awards, press

**Infer the rest from the website.** `web_fetch` the homepage and services page. Pull: service categories, geo footprint, "about" copy, team page, testimonial language, case-study results, before/after gallery, pricing transparency, lead-form / booking CTA.

**Optional overrides:**

- Target audience (B2B title / B2C demo)
- Ad duration / platform (Meta lead-gen / TikTok lead-gen / YouTube / Google video)
- Conversion event (form fill, call, booking, DM)
- Brand tone constraints

## Step 2 — Trust posture

Service ads sell a **promise** — the viewer must trust the operator enough to give them money or time. Trust posture is what tone the trust comes through.

Pick a primary + alternate from this menu (or invent one):

- **Authority** — credentials front and center, lab coat / suit, "I've done 1,200 of these", calm certainty. Best for med, legal, finance, technical B2B.
- **Friendly expert** — knowledgeable but warm, "let me explain this in plain English", coffee-on-desk energy. Best for consultants, coaches, financial planners.
- **Urgent warning** — "if you've been doing X, stop", protective, PSA-coded. Best for tax, legal, insurance, scam-adjacent categories.
- **Specialist** — narrow, deep, "this is the only thing I do", masterclass framing. Best for niche services with premium pricing.
- **Hometown / neighborhood** — local-pride, truck-and-toolbelt, "we've been doing this in [city] since 1998". Best for home services, contractors, local pros.
- **Result-first / receipt-led** — let the after speak, minimal narration. Best when the visual transformation is undeniable (cleaning, landscaping, detailing, dental, hair).
- **Coach / mentor** — eye contact, motivational cadence, "I was where you are". Best for coaches, trainers, therapists.
- **Behind-the-scenes / craftsperson** — process porn, hands-at-work, materials and tools. Best for trades and bespoke work.
- **Friendly insider** — "let me tell you what the industry doesn't want you to know". Best for agencies, brokers, advisors.

Write: **"Best guess: [primary]. Alternate: [secondary]. Reason: [1 sentence anchored in service category, audience, and existing site voice]."**

## Step 3 — Operator / founder persona

Who fronts the ad? In service ads, the human IS the product.

Write 1–2 candidate personas. For each:

- **Persona label** — e.g. "40-year-old male contractor, beard, in branded polo, in front of a finished kitchen", "50-something female estate attorney in office, blazer, books behind her", "30-year-old fitness coach in a gym, mid-set, wireless mic"
- **Visual description** — wardrobe, setting, framing, props that signal credentials (clipboard, license on wall, before/after wall behind, branded vehicle in background)
- **Voice cue** — speech cadence + a sample line in their voice
- **Credentials to surface visibly** — license number on a graphic, "20 years in business" lower-third, awards card, BBB rating, Google star count
- **Already on hand?** yes/no (existing footage of them, or casting brief)

If the founder won't be on camera, surface **alternate human anchors:** the technician, a real customer testimonial, a result-recipient ("the homeowner whose roof we replaced last week").

## Step 4 — Result-portrait inventory

The "after" is the most valuable asset a service ad can have. List every visible result the service produces:

- **Before / after pairs** — what changed visibly (lawn, smile, room, car, body, financials)
- **Process moments** — the work being done (the satisfying clean, the hands-at-work, the legal-pad whiteboard)
- **Receipt artifacts** — final invoice savings, signed agreement, tax refund check, "we got them $X back" lower-third, court ruling, weight on a scale
- **Customer reactions** — recipient's face on the after-reveal (homeowner walking into finished basement, client tearing up at settlement)
- **Location / branded assets** — branded truck, storefront, signed wall, certifications on display

For each, note: visual description, already on hand? yes/no, rights status if it's a customer's likeness (signed release).

## Step 5 — Footage QA

For every footage asset, run the checks below.

**Tiered inspection:**

- **Tier 1 (full probe):** Registered file or downloadable URL. `ffprobe`. Full confidence.
- **Tier 2 (visual-only):** Platform URL. Inspect via `web_fetch` and thumbnails. Flag visual-only.
- **Tier 3 (site only):** No footage uploaded. Site gallery and GMB photos are the only source. Flag everything as "site-sourced — confirm rights and currency."

Report PASS / FAIL per asset. Priority order:

1. **Has at least one usable result-portrait** — before/after, satisfying process, reaction, or receipt. Without this, the ad has no proof.
2. **Aspect ratio matches platform** — 9:16 for TikTok/Reels/Shorts/Meta lead-gen, 16:9 for YouTube/Google.
3. **The "after" is unambiguously better than the "before"** — no judgment-call transformations. If the before/after is debatable, find a clearer pair.
4. **Operator/customer face well-lit & clear** — eyes catch light, intelligible audio, no shadow-faced talking head.
5. **Resolution ≥ 720p** — phone-shot tolerated, but credentials/receipt overlays must be readable.
6. **Authentic context** — looks shot on the job site / in the office, not stock-photoed.
7. **No competitor branding visible**, no other agencies' watermarks, no leaked PII (license plates, addresses, names) on receipts unless cleared.
8. **Customer release on file** if a real client appears — flag if unverified.
9. **No watermarks / capture-tool overlays**.

Fail any → flag + propose fix (re-shoot, request from operator, blur PII, swap to a different result).

## Step 6 — Asset gap check (output, do not block)

If footage is missing, do not stall. Add `## Asset Gaps`.

Acceptable footage sources to suggest:

- **Direct upload** through chat
- **Public URL** — TikTok / YouTube / Vimeo / GMB video / CDN
- **Site / GMB scrape** — gallery photos, before/afters, team headshots
- **Self-shot phone footage** by the operator — a 60-second walk-through of a recent job
- **Customer testimonial recorded over Zoom / phone** — even mid-tier video works for service trust
- **Stock B-roll** as cover — flag specifically what would be acceptable (generic interior shots, hands-typing, city skyline) and what would not (faking results)
- **Existing case-study deck** — extract before/after pairs

## Step 7 — Hook ranking

Rank 3–5 hooks. For each:

- **Hook name** (from library, or "custom")
- **Scroll-stop frame** — frames 1–15 (≤ 0.5s). Service ads typically open on the after, the credential, or the operator face.
- **One-sentence concept** specific to this service
- **Why it fits** — trust posture / persona / result / audience reason
- **Payoff by** — second mark (≤ 3s)
- **Required assets**
- **Risk**

### Service hook library

1. **Result-first / receipt** — "We got him $47,000 back." Scroll-stop: receipt or check, dollar figure huge.
2. **Before/after reveal** — visible transformation in frame 1. Scroll-stop: hard-cut or split-screen.
3. **Specialist credential** — "I've done 4,200 of these." Scroll-stop: operator + lower-third with the number.
4. **PSA / urgent warning** — "If you signed [contract], stop." Scroll-stop: caution-coded text overlay over operator face.
5. **Day-in-the-life of the operator** — "Come with me on a service call." Scroll-stop: operator opening branded truck door, tools visible.
6. **Mistake confession** — "I see homeowners do this every week and it costs them thousands." Scroll-stop: operator on jobsite pointing at the mistake.
7. **Local callout** — "[City] homeowners — read this." Scroll-stop: city-skyline or neighborhood B-roll + text.
8. **Customer reaction** — recipient walking into the finished result. Scroll-stop: face mid-gasp.
9. **Process porn** — satisfying close-up of the work being done. Scroll-stop: hands at work, macro.
10. **Insider secret** — "Here's what [industry] won't tell you." Scroll-stop: operator direct-to-camera, "leaning in" body language.
11. **Free-audit / free-quote** — "I'll review yours for free if you send it." Scroll-stop: operator holding up a marked-up document.
12. **Comparison / trap** — "Hiring [competitor type]? Read this first." Scroll-stop: side-by-side or contrast graphic.
13. **Founder origin** — "I started this company because…" Scroll-stop: founder on jobsite or in office, direct address.
14. **Stat / category-shock** — "97% of [category target] are [doing X wrong]." Scroll-stop: stat huge on screen.

**Scroll-stop frame rules:** survives thumbnail crop, one focal point, the result/receipt/face is unambiguous, motion preferred, credentials visible if they're the trust anchor.

## Step 7 — Enhancement opportunities

List 3–5 ways to upgrade footage **without fabricating outcomes**:

- **Lower-third overlays** — credential cards, year-founded, license number, BBB rating, Google star count
- **Burned-in captions** word-by-word, color-pop on hook + result words
- **Receipt / document on-screen** with redactions blurred (PII)
- **Before/after split-screen** with clear labels
- **Process montage** — speed-ramped cuts of the work being done
- **Map / geo overlay** for local services
- **Trust-bar overlay** — "Licensed • Insured • 20 yrs"
- **Customer-quote text card** with name + photo (with release)
- **Native-platform UI mimicry** — Google review stars, TikTok-comment overlays, IG sticker fonts

Do **not** propose:

- Fake testimonials, AI-generated faces presented as real clients
- Result claims the service can't reliably deliver
- Edited results in regulated categories (legal "we'll win your case" guarantees, medical outcome promises, financial return guarantees)
- Stock B-roll presented as the operator's actual work
- Competitor disparagement that crosses into defamation

## Output file

Write the brief to:

```
/tmp/outputs/service-brief-{business-slug}.md
```

### Brief format

```markdown
# Service Creative Brief — {Business Name}

## Service Snapshot

- **Business:** ...
- **Category:** ...
- **Geo / market:** ...
- **Site:** {URL}
- **Offer / lead magnet:** ...
- **Conversion event:** form fill / call / booking / DM
- **Target audience:** ...
- **Ad duration / platform:** ...

## Hook Concepts (Ranked)

1. **Result-first**
   - Scroll-stop frame: "$47,000" huge on screen, IRS letter blurred behind, operator's hand entering frame holding the check.
   - Concept: "We got Maria $47K back from the IRS — here's how."
   - Why: Authority trust posture; we have the (release-cleared) Maria case study; receipt is unambiguous.
   - Payoff by: 0:02
   - Assets: receipt photo (have, redact PII) + operator B-roll + Maria release-on-file (have).
   - Risk: low.
2. ...

## Trust Posture

- **Best guess:** Authority.
- **Alternate:** PSA / urgent warning.
- **Reason:** Tax-resolution category; site copy emphasizes credentials and case-volume; audience is debt-stressed.

## Operator / Founder Persona

- **Primary:** 50s male enrolled-agent in office, dress shirt, IRS reference book on shelf, license plaque visible behind. Voice: measured, plain-English, "let me explain how this actually works." Already on hand: yes (input:video-3).
- **Alternate:** Female case-manager in same office — softer trust, "I'll walk you through this personally."

## Result-Portrait Inventory

- **Before/after:** IRS letters demanding $94K → settlement letter for $47K.
- **Receipts:** 4 case examples with PII redacted, releases on file.
- **Customer reactions:** Maria post-settlement, signed release.
- **Branded assets:** office wall, license plaque, BBB rating graphic.

## Footage QA

| Asset ID      | Inspection | Aspect | Res       | FPS | Duration | Has moment                                              | Verdict |
| ------------- | ---------- | ------ | --------- | --- | -------- | ------------------------------------------------------- | ------- |
| input:video-3 | full probe | 9:16   | 1080x1920 | 30  | 64s      | yes (operator close-up at 0:12, Maria reaction at 0:41) | PASS    |

## Enhancement Opportunities

- Lower-third with "Enrolled Agent • 22 yrs • A+ BBB" through hook.
- Receipt overlay during result-reveal beat with $47K animated count-up.
- ...

## Asset Gaps

- Need 1 city-skyline or neighborhood B-roll for local-callout hook variant. Please ask user for an exterior office shot or local landmark clip.
```

## Handoff to scriptwriter

Pass the brief path to `ads-scriptwriter-skill` (or `ads-fast-skill`). The scriptwriter MUST:

- Use rank #1 hook unless told otherwise
- Open on the **scroll-stop frame** verbatim — frame 1, non-negotiable
- Surface credentials within the first beat (lower-third, named license, year-founded)
- Match the chosen trust posture in voice and pacing
- Land hook payoff ≤ 3s
- Place the lead-magnet CTA explicitly with friction-free instruction ("comment WORD", "tap the form", "DM the word X")

## Constraints

- **Scroll-stop in ≤ 0.5 seconds.** Result, receipt, or authoritative face in frame 1.
- **Hook payoff in ≤ 3 seconds.**
- **Be specific.** "Show our results" is not a hook — "$47,000 huge on screen, IRS letter behind, operator's hand entering frame with the check" is.
- **Anchor in real outcomes with releases.** No fabricated cases, no AI-generated client faces, no stock B-roll passed off as the operator's work.
- **Category compliance.** Legal, medical, financial, weight-loss, and "earnings claims" categories have specific platform rules — flag the category and required disclaimers in the brief if applicable.
- **PII discipline.** Redact addresses, license plates, account numbers, full names without releases.
- **Output file contains ONLY the brief.**

---

**Usage:** Dispatched by Producer as a forked skill before the scriptwriter, when the product is a service business. Reads site + footage assets, writes a Service Creative Brief.
