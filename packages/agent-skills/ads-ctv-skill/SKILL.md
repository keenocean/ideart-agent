---
name: 'ads-ctv-skill'
description: 'Use when producing a Connected TV (CTV / OTT / streaming TV) video ad — Hulu, Disney+, Roku, Samsung TV Plus, YouTube TV, Peacock, Paramount+, Pluto, Tubi. Trigger whenever the user mentions CTV, OTT, streaming TV, connected TV, living-room ad, smart TV ad, Hulu/Roku/Disney+ ad, or any ad meant to play on a television rather than a phone. This skill produces a format brief that the scriptwriter, storyboard, and director stages consume before writing.'
---

# Ads CTV Skill — Connected TV Format Brief

CTV is a **television medium**, not a social medium. Viewer is 8-10 feet from a 40-65" screen, leaned back, sound on, remote in hand, cannot click. Treat it like broadcast TV with a QR code — not like a TikTok with a bigger display. This skill produces a format brief that downstream stages (scriptwriter, storyboard, director) read before writing anything.

## Why This Skill Exists

The generic ads-scriptwriter-skill assumes social/mobile craft rules: <1s hook, swipe-up CTA, sound-off-first, burned-in word captions. Applying those to a CTV ad produces something that looks cheap on a 65" OLED and has no way for the viewer to convert. This skill swaps in the correct craft — premium production cues, QR/URL CTAs, sound-on storytelling, broadcast safe zones, TV-reading fonts — so the script, storyboard, and motion stages produce a living-room-ready ad.

## Output

`/tmp/outputs/format-brief-ctv-{product-slug}.md` — a compact brief (target: 500-900 words) containing:

1. **Placement type** — linear in-stream vs interactive/pause/home-screen ad (different craft — see below)
2. Format specs (aspect, resolution, bitrate, file, duration)
3. Viewing-context assumptions (sound, distance, attention mode)
4. Hook rules (first 3-6s, brand-early rule)
5. CTA strategy (QR code placement + spoken reinforcement)
6. Safe zones (3.5% inset + font minimums)
7. Scene budget by duration
8. Narrative structures that work on CTV (and ones that don't)
9. **Overlay Plan — REQUIRED** — specific list of persistent + temporal + dynamic overlays with exact copy and timing. See [references/ctv-overlays.md](references/ctv-overlays.md). **A brief that doesn't list specific overlays produces a social-style ad with a different aspect ratio — not a CTV ad.**
10. QA checklist

## Workflow

1. **Read the product/campaign info** — web_fetch product URLs if provided, inspect product images via get_asset
2. **Pick placement type (A or B)** — linear in-stream spot vs interactive/pause/home-screen. See section above. This is the most important decision; it changes everything downstream.
3. **Confirm the target duration** — default to 30s (Type A) or 10-15s static hold (Type B) if unspecified
4. **Confirm the target streaming platform(s)** — if specified, pull platform-specific specs from [references/ctv-platforms.md](references/ctv-platforms.md). If generic "CTV", use common denominator (15Mbps / 1920x1080 / MP4 H.264).
5. **Pick overlays from the catalog** — read [references/ctv-overlays.md](references/ctv-overlays.md) and select at minimum: one persistent overlay (brand bug), one temporal overlay (lower-third super OR CTA card), and a QR spec if the spot has a URL CTA. Write exact overlay copy — not placeholders.
6. **Write the brief** using the template, filling in product-specific hooks, exact overlay copy, CTA copy suggestions, and narrative structure recommendation.
7. **Save** to `/tmp/outputs/format-brief-ctv-{product-slug}.md`.

**Anti-hallucination rule:** if you don't know an exact piece of copy (e.g. the real price, the real launch date, the real offer code), DO NOT invent one. Leave a `{PRICE}` / `{DATE}` / `{OFFER_CODE}` placeholder and note in the brief that downstream stages must use provided values. Inventing "Starting at $29.99" when the real price is different produces wrong-priced ads — a bigger failure than a generic ad.

## Two CTV Placement Types — Pick First

Before anything else, decide which kind of CTV ad this is. They're produced differently.

### Type A: Linear In-Stream Video Spot (15s / 30s / 60s)

The traditional TV commercial running in a Hulu / Peacock / Paramount+ ad pod. A moving video with narrative beats, VO, music. This is what the rest of this skill's duration / scene / beat guidance describes.

### Type B: Interactive / Pause / Home-Screen Ad (the Best Buy / Gold Peak / Netflix product-card pattern)

A mostly-static or lightly-animated composed frame — think of it as a designed landing page sized for a 65" TV. Runs as:

- **Pause ad** (Hulu, Peacock, Paramount+) — when the viewer pauses content, the entire screen becomes a branded takeover
- **Home-screen ad** (Samsung, Roku, Fire TV, Apple TV) — appears on the streaming device home screen beside content tiles
- **Post-roll / end-card overlay** (via Innovid, KERV, BrightLine) — extends a 30s spot with a branded interactive panel
- **Shoppable pod takeover** — the ad pod becomes a product carousel with per-SKU scan codes

**Visual signature of a Type B ad** (from reference examples):

- **Brand-color full-frame background** (navy for Best Buy, red product card for Netflix, sage green for Gold Peak) — NOT a video with overlays
- **Composed split layout** — product hero image on one side, content/CTA on the other; or centered product with info flanking
- **Display-scale typography** — 100-200px effective headlines (ALL CAPS bold sans), layered multi-line ("ZERO SUGAR / ZERO REASONS NOT TO / TRY")
- **Huge branded QR code** — 25-40% of frame width (not a corner QR), often with the brand logo embedded in the center, paired with a **hand-holding-phone icon** and "**SCAN TO SHOP NOW**" microcopy
- **Big bold offer super** — "Save $500," "20% OFF," "Starting at $29.99" at 90-120px+
- **Explicit legal fine-print bar** — readable ("Offer valid 11/20/22-11/26/22. Terms and conditions apply.")
- **Remote-control UI cues** — **"Scroll for more"** with a **remote icon**, pagination dots, "Press OK to" — these tell the viewer the ad is interactive
- **Decorative brand system elements** — sparkles/stars (Best Buy), leaves/botanicals (Gold Peak), patterned backgrounds
- **Persistent brand bug** in a corner even though the brand is already huge on screen
- **Small embedded video thumbnail** sometimes, surrounded by composed brand frame (Gold Peak)

**Craft rules for Type B:**

- Design it like a landing page, not a commercial. Hierarchy: brand → headline → offer → product → CTA (with QR).
- **Every element lives on screen simultaneously** for the full hold duration (often 10-15s static, or the duration of a pause). No "beats" — it's a single composition.
- **Typography is the medium.** Invest in bold display type with strong hierarchy. Thin or small type fails.
- **The QR is the hero CTA.** Make it 25-40% of frame width, center or prominent-left, with brand logo embedded. Not a discreet corner scan.
- **Copy is SKU-specific and offer-specific.** "Save $500 on Samsung Galaxy Book2 Pro 15.6"" beats "Shop our laptop sale." Specificity is the job.
- **Brand color is the background.** Full-bleed brand color, not a photo. If using a photo, it's a product hero on a clean brand-color plate.
- **Decorative brand elements** (sparkles, leaves, confetti, pattern) make it feel owned rather than generic.

**Type B aspect ratios and resolutions:**

- 16:9 full-frame, 1920×1080 minimum (4K preferred for home-screen placements on modern TVs)
- Some home-screen placements (Samsung, Fire TV) use a wider composed canvas with content-tile cutouts — check vendor spec sheet

**Type B duration:**

- Pause ads: persist until viewer resumes; design for ~5-15s of focused attention
- Home-screen ads: 10-15s looped, or static; often "nudge to scroll/select"
- Post-roll extensions: 10-15s interactive panel after the linear spot ends

**When the user says "CTV ad," default to Type A unless they specifically mention pause ad, home screen, Samsung/Fire TV home, interactive, shoppable, Innovid, KERV, or BrightLine — or the reference examples they show are clearly composed static frames.**

For full overlay catalog (brand bugs, lower-thirds, CTA cards, QR specs, DCO patterns, legal bars, remote-UI cues), read [references/ctv-overlays.md](references/ctv-overlays.md). **The Overlay Plan section of the brief is REQUIRED — not optional.**

## CTV Format Specs

Standard baseline accepted by essentially all CTV inventory:

| Spec         | Value                                                                                                                                      |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------ |
| Aspect ratio | 16:9 (horizontal)                                                                                                                          |
| Resolution   | 1920×1080 minimum; 3840×2160 (4K) increasingly expected for premium placements                                                             |
| Container    | MP4                                                                                                                                        |
| Codec        | H.264 (H.265/HEVC on newer platforms)                                                                                                      |
| Audio        | AAC stereo, -24 LUFS to -16 LUFS (broadcast-normalized), 48 kHz                                                                            |
| Frame rate   | 23.976, 29.97, or 30 fps. Match content — don't mix                                                                                        |
| Bitrate      | ≥15 Mbps (high-def); some platforms accept 10 Mbps                                                                                         |
| File size    | ≤200 MB (often ≤150 MB recommended)                                                                                                        |
| Duration     | **15s / 30s / 60s** are the only durations that scale. Some platforms accept 6s / 10s / 90s / 120s but avoid unless specifically requested |

For platform-specific overrides (Hulu, Roku, Samsung, YouTube TV), see [references/ctv-platforms.md](references/ctv-platforms.md).

## Viewing Context — Core Assumptions

These assumptions flip many craft rules from the social-ads playbook.

- **Sound is ON.** Write for audio. VO, dialogue, and music are the spine of the ad — not burned-in captions.
- **Viewer is 8-10 feet away.** Text must be legible at distance. Tiny UI-style captions are invisible on TV.
- **Viewer is leaned back, passive.** They can't scroll past. Attention is more relaxed but also less forgiving of "hacky" YouTube-shorts energy — viewers expect TV production quality.
- **Viewer cannot click.** Every CTA must be completable without touching the TV. QR code, spoken brand name, memorable URL, or retarget-via-IP are the options.
- **Ad pod is forced view.** Unlike pre-roll skippable, the viewer watches the full 15/30/60s. Don't cram a 30s narrative into 5 seconds — use the time.
- **Sound-off fallback for some inventory (e.g. Samsung Ambient, bar/gym placements).** Make sure the ad still reads visually with sound off, but design primary for sound on.

## Hook Rules — First 3-6 Seconds

- **Brand must appear in the first 3 seconds.** This is Roku's explicit rule and a widely-adopted IAB guideline. Logo on screen or brand name spoken within 3s.
- **Don't use social-media pattern-break tricks** (glitch effects, fake "wait…", TikTok hand-in-frame, fake-iPhone-ui). They signal low production on a big screen.
- **Do use**: strong opening visual, confident cinematic push-in, human face with emotion, a clear problem moment. Treat the hook like the opening shot of a film, not the first frame of a meme.
- **Attention concentrates in the first 3-6s.** The product (or its outcome) should be visible by second 6 in a 30s spot, earlier in 15s.

## CTA Strategy — Since There's No Click

CTV CTAs are the hardest craft shift for performance marketers. You cannot use "Swipe up," "Tap the link," or any mobile-UI metaphor. Options:

1. **QR code** (preferred for performance CTV).
   - Place during final 5-10 seconds of the spot.
   - Must remain on screen ≥5 seconds (viewers need to pick up their phone, open the camera, aim).
   - Position: bottom-right corner or centered lower third. Bold white-on-dark contrast.
   - Branded QR (colors matching logo) is fine on modern platforms.
   - Pair with a spoken cue: _"Scan to save 20% — link in our description."_
   - Offer something scan-worthy (discount, limited drop, free trial). Generic "visit us" earns sub-0.5% scan rates; time-limited discounts can hit 2%+.

2. **Spoken URL / brand name repetition.**
   - Short, memorable domain (brand.com, product.com).
   - Say it twice. Display in large on-screen text during final 3-5s, well within safe zone.
   - Font: sans-serif, ≥90px on 1920×1080.

3. **Retargeting via IP / household.**
   - Not a visible CTA but a real lever: the household that watched the spot can be hit on mobile/desktop the same day. Brief the performance team — this affects how dense the CTA needs to be in-spot.

Avoid: "Swipe up," "Link in bio," "Tap to shop," "Click below," phone-UI overlays.

## Safe Zones & Typography

CTV screens still have edge cropping on older TVs and platform-UI overlays on newer ones. Keep everything important inside the safe zone.

| Layer                                  | 1920×1080 Inset | Distance from edge          |
| -------------------------------------- | --------------- | --------------------------- |
| Action-safe (all visual content)       | ~5%             | 96px L/R, 54px T/B          |
| **Title-safe (text, logos, QR, CTAs)** | **~3.5%**       | **67px L/R, 38px T/B**      |
| Avoid bottom 8% if possible            | —               | platform chrome can overlay |

Typography:

- **Body text**: minimum 60-70px on 1920×1080 (60-70px = ~1.1" tall at 65" screen)
- **Headlines**: 90-120px
- **Phone numbers, URLs, legal**: ≥60px, on screen ≥3 seconds so the viewer can read + act
- **Contrast**: ≥4.5:1 for all text. TVs vary — a light-gray-on-white disclaimer that passes on your monitor disappears on a dim TV
- **Typeface**: sans-serif for legibility at distance. Reserve display serifs for brand hero shots only

Captions/subtitles are optional on CTV — they're commonly generated by the TV's accessibility layer. Don't burn in TikTok-style word-highlight captions; they look amateur on CTV.

## Scene Budget by Duration

| Duration | Scenes     | Rhythm                                                             |
| -------- | ---------- | ------------------------------------------------------------------ |
| **15s**  | 3-4 scenes | Hook (3s) → demo/transformation (8s) → CTA+QR (4s)                 |
| **30s**  | 4-6 scenes | Hook (3-5s) → setup (5s) → demo (10s) → proof (5s) → CTA+QR (5-7s) |
| **60s**  | 6-9 scenes | Full three-act arc with breathing room. Hold on emotion longer.    |

Don't over-cut. CTV rewards held shots — 3-5 second beats feel cinematic; 0.5-1 second TikTok cuts feel cheap.

## Narrative Structures That Work on CTV

**Strong fit:**

- **Storytelling / Mini-Narrative** — 30s and 60s shine here. Character, problem, product, resolution.
- **Problem-Solution** — classic TV ad arc. Pain → product → resolution.
- **Lifestyle / Aspirational** — the product inside a polished world. Luxury, auto, CPG.
- **Before-After** — works if the "after" is visually dramatic. Good for beauty, fitness, home.

**Weak fit (use with caution):**

- **UGC-Style / creator-in-frame** — reads as out-of-place on a premium streaming service. Exception: intentionally-authentic brands (DTC, Gen-Z skincare) — but still upgrade production values.
- **Demo / How-To** — works if the demo is visually rich; avoid screen-cap tutorials, which look bad at 65".
- **Comparison** — fine for 30s+. Avoid the "Brand X vs competitor" tone that feels scrappy.

## Speech & Sound

- **~70-90% of CTV beats should have speech.** VO is the workhorse. Silent beats are a deliberate cinematic choice, not the default.
- **Music is load-bearing.** Budget for licensed music or a professional stinger. A royalty-free track that sounds fine on mobile exposes itself on good TV speakers.
- **Normalize to broadcast loudness standards** (-24 LUFS integrated for US CALM Act, -23 LUFS for EU R128). If the ad is 6dB louder than program audio, it gets clipped by the platform and the viewer remembers the brand as "the one that shouted."

## QA Checklist (before delivery)

The director/review stages must verify:

**All CTV spots:**

- [ ] **Overlay Plan applied** — brand bug persistent; at least one temporal super; QR or CTA card in final third
- [ ] **Specific overlay copy** (not "a pricing super" — actual price or `{PRICE}` placeholder)
- [ ] Persistent brand bug visible throughout (top-right or bottom-right, ~4-6% frame width)
- [ ] All text inside 3.5% title-safe zone
- [ ] Body text ≥60px, headlines ≥90px on 1920×1080
- [ ] No "swipe up," "tap the link," "link in bio," or mobile-UI language
- [ ] Audio mixed to broadcast loudness (~-24 LUFS integrated)
- [ ] MP4 H.264, ≥15 Mbps, ≤200MB, 1920×1080 min

**Type A — Linear spot specific:**

- [ ] Brand logo or spoken brand name within first 3 seconds
- [ ] Product (or its outcome) visible by second 6 (in 30s) or second 3 (in 15s)
- [ ] QR code visible ≥5 seconds in final third (if using QR)
- [ ] Audio-off fallback acceptable (key message readable without sound)
- [ ] No scene cut shorter than ~0.8s (except intentional style)
- [ ] 15/30/60s duration exactly (not 14.8s, not 31s)

**Type B — Interactive/pause/home-screen specific:**

- [ ] Brand-color full-bleed background (not a raw photo/video full frame)
- [ ] Composed split layout (product + info + CTA regions defined)
- [ ] Display headline at 100-200px effective, ALL CAPS bold sans-serif
- [ ] QR is 25-40% of frame width, centered or prominent-left, brand logo embedded
- [ ] "SCAN TO SHOP NOW" (or equivalent) with hand-holding-phone icon next to QR
- [ ] Specific offer super ("Save $X", "X% off", "Starting at $X") at ≥90px
- [ ] Legal fine-print bar readable (≥18px on 1920×1080, dark translucent band)
- [ ] Remote-control UI cue present ("Press OK", "Scroll for more" + remote icon, pagination dots) if the placement is interactive
- [ ] Decorative brand-system elements (sparkles, botanicals, patterns) present where brand guide supports

## How Downstream Stages Consume This Brief

The Producer should pass the brief file path to every downstream skill:

- **ads-scriptwriter-skill** reads the brief and picks a narrative structure + hook from the CTV-friendly list. Writes broadcast-loud VO, plans CTA as QR+spoken.
- **ads-storyboard-skill** reads the brief and respects safe zones, font sizing, scene budget. Composes wide/cinematic framing (not selfie-ratio).
- **ads-motion-skill** reads the brief and chooses confident, held camera motion. No TikTok-style handheld jitter unless intentional.
- **ads-director-skill** reads the brief and renders 16:9, generates QR code overlay for final scenes, renders at 1920×1080 or higher.

## Detailed Resources

📖 [references/ctv-overlays.md](references/ctv-overlays.md) — **Read this before writing the Overlay Plan.** Full catalog: brand bugs, lower-third supers, CTA cards, QR specs, DCO patterns (local store / weather / countdown / price), legal bars, tune-in supers, shoppable hotspots, remote-UI cues.

📖 [references/ctv-platforms.md](references/ctv-platforms.md) — Per-platform specs (Hulu/Disney+, Roku, Samsung, YouTube TV, Peacock, Paramount+, Tubi, Pluto)

📖 [templates/ctv-format-brief-template.md](templates/ctv-format-brief-template.md) — Output format for the brief (includes the required Overlay Plan section)

## Output File Naming

`/tmp/outputs/format-brief-ctv-{product-slug}.md`

---

**Usage**: Dispatched by the Producer **before** the scriptwriter when the user's prompt mentions CTV / OTT / streaming TV / a specific CTV platform. The brief becomes the input alongside the product info for scriptwriter, storyboard, and director.
