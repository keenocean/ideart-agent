---
name: 'ads-script-to-video-skill'
description: 'Use this skill whenever the user pastes a pre-written ad script — especially a structured one with explicit Time / Visual / VO (or Audio) / On-screen-Text columns, scene rows, or numbered beats. The creative work is already done; the job is faithful execution. Trigger eagerly on any pasted script-shaped block (timed table, scene list, shotlist, "0:00–0:08 …" timeline, or a Visual + Voiceover two-column layout). Follow the script verbatim — do not invent new beats, do not rewrite VO, do not reord'
---

# Script-to-Video Pipeline

The user has done the creative work. Your job is **fidelity**, not invention. Treat the pasted script as the source of truth and translate it — column by column — into the asset graph.

## When to trigger this skill

Trigger as soon as the user's message contains any of:

- A timed table with Time / Visual / Audio (or VO) columns.
- A numbered scene list: `Scene 1: …`, `Scene 2: …`.
- A timeline format: `0:00–0:08 …`, `[00:08] …`.
- A two-column Visual + Voiceover block.
- An explicit duration target plus per-beat content (`"30-second ad: hook → problem → solution → CTA"` with content under each beat).
- The user explicitly says "here's the script" / "produce this script" / "make this ad".

If the message contains a script-shaped block, this skill wins over any open-ended creative-direction skill. Do not run a creative discovery pass — the script _is_ the brief.

If the message is just a vague request ("make me a legal ad", "do a 30s spot for X"), this skill does **not** apply — fall back to the creative skills.

## Hard rules (do-not-regress)

1. **Verbatim VO.** Voiceover lines go to the directors exactly as written. Do not paraphrase, "polish", or smooth the script's voice. The only edit allowed is _trimming_ if a beat overruns its time budget — see Rule 4.
2. **No new scenes.** Number of scenes in the output ≤ number of scenes in the script. Never add a beat the script didn't contain.
3. **No reordering.** Scenes ship in script order.
4. **Words-per-second budget.** Target 2.0–2.8 w/s of VO per scene. Hard floor 1.5 w/s (too sparse → dead air). Hard ceiling 3.0 w/s (too dense → unintelligible). If a scene's VO is over budget for its allotted seconds, trim _words_, not _meaning_.
5. **On-screen text comes from the script.** If the script has an "On-screen Text" / "Text Overlay" / "Graphic" column, those strings are the `text_overlays` for that scene — verbatim, in the script's order, at the script's beats. Do not invent extra captions.
6. **Music cues come from the script.** If the script names a music feel (`"soft tense piano transitioning to warm hopeful major key"`), pass that into `music_generate` directly. Do not substitute a generic vibe.
7. **One persona per ad** unless the script explicitly calls for multiple speakers. Reuse the same `voice_asset_id` + `kling_voice_id` across every scene.
8. **End card = muted captions.** The final scene (logo / phone / URL / CTA card) must use `mute_captions=true` in assembly and bake phone/website/CTA as text overlays instead. Auto-captions on an end card look amateur.

## Step 1 — Duration cap check (ask ONCE, then commit)

The free-trial session has a system-prompt duration cap (read it from the current system prompt; do not hardcode a number — it changes). If the script's total runtime exceeds the cap:

> Your script is N seconds, but this session is capped at M seconds. Two options:
> **(A)** I produce a condensed version that fits — picking the strongest beats (hook, solution, CTA) and trimming the middle.
> **(B)** Upgrade your plan and I'll make the full-length version.
> Which would you like?

Wait for the user's pick. Ask this **once**. If they pick (A), continue with the condensed plan. If they pick (B), stop and wait for the upgrade signal.

If the script already fits the cap, skip this step entirely and start producing.

### Condensing a long script into a short cut

When the user picks (A):

- Keep the **hook** (scene 1 of the script — the opening visual + opening VO line).
- Keep the **resolution / product-reveal** beat (whichever scene names the product or shows the "after").
- Keep the **CTA / end card** (last scene with phone/URL/CTA).
- Drop or merge middle beats (problem-agitation, social-proof, testimonial) — pick at most one.
- Aim for **~8–12 seconds per scene** in the condensed version. Three scenes × 10s = 30s. Two scenes × 6s = 12s.
- Re-budget VO words per Rule 4.

See `references/condensing-rules.md` for the full decision table.

## Step 2 — Brand info gathering (parallel with persona/music)

Before dispatching directors, you need a brand-info block to hand off: `brand`, `product_1_title`, `product_1_description`.

- **User gave a URL.** One `web_fetch` call. Pull brand name, product/service name, one-sentence description.
- **User gave only a product/brand name.** One `web_search` to find the official site, then one `web_fetch` on the top result.
- **User gave no brand at all** (rare — the script is self-contained). Use the brand name as written in the script and skip fetching.

Do not over-research. One fetch is enough — you need a clean 1–2 sentence handoff, not a market analysis.

## Step 3 — Persona + music in parallel

In the _same turn_ (single tool batch), fire:

1. **`setup_persona(voice_only=true)`** — one narrator. Pick gender/age from script tone:
   - Empathetic / service / family / legal / healthcare → middle-aged female, warm.
   - Authoritative / finance / B2B / "expert" → middle-aged male, calm.
   - Hype / DTC / Gen-Z / energy / fitness → younger (M or F), bright.
   - Conspiratorial / "you've been lied to" → younger male, low-register.
   - Deadpan / dry / comedic → younger, flat affect.
     See `references/voice-archetypes.md` for the picker.
2. **`music_generate`** — prompt = the script's music cue verbatim if present, plus the total duration and the structural pivot point (e.g. `"tense piano transitioning to warm hopeful major key, pivot at 10s, 30s total"`).

Both calls in one turn. Wait for both to resolve before Step 4.

## Step 4 — Dispatch every scene director in parallel

In the next turn, fire **all** `director` calls in one batch — one per scene. Each director payload:

- `vo_text`: the script's VO column verbatim (post-trim if condensing).
- `visual_description`: the script's Visual column verbatim, prefixed with style anchors (cinematic vs UGC, palette, camera grammar) derived from script tone — see `references/style-anchors.md`.
- `motion_prompt`: a short timestamped beat-list pulled from the visual column (e.g. `"0–2s: hands resting on table. 2–5s: slow push-in on face. 5–8s: cut to document on table."`).
- `voice_asset_id` + `kling_voice_id`: from Step 3, **identical across all scenes**.
- `brand`, `product_1_title`, `product_1_description`: from Step 2.
- `duration`: the scene's allotted seconds.

Do **not** dispatch scenes serially. They are independent. Parallel batch is mandatory.

## Step 5 — Assembly

One `assemble_video` call. Per-scene config:

- `text_overlays`: the strings from the script's On-screen Text column for that scene, in script order, timed to the scene window.
- `mute_captions`: `false` for VO scenes, `true` for the end card.
- `caption_preset`: match script tone:
  - Legal / professional / B2B → `editorial-clean` with `Alice` serif.
  - DTC / lifestyle / wellness → `editorial-soft` with a humanist sans.
  - Hype / energy / TikTok → `kinetic-bold` with a heavy sans.
  - Tech / SaaS → `mono-modern`.
    See `references/style-anchors.md`.
- `music_volume`: `0.12` under VO. Bump to `0.25` on end card if VO ends before the card.
- `aspect_ratio`:
  - Default `16:9` for legal/professional/B2B/explainer.
  - `9:16` if script mentions TikTok / Reels / Shorts / social-first / vertical.
  - `1:1` if script mentions feed / Instagram-feed.

## Step 6 — Deliver, then ask

Post the final video link. Then in the same message ask: _"want to save this workflow as a reusable skill?"_ — this is the producer's standard sign-off.

## What "fidelity" actually means in practice

| Script says                                                       | You ship                                                                                                       |
| ----------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| "Upbeat acoustic guitar, slow pan across a tidy kitchen counter." | Music prompt = "upbeat acoustic guitar". Motion = "slow pan across a tidy kitchen counter".                    |
| VO: "Mornings just got a whole lot easier."                       | VO text = `"Mornings just got a whole lot easier."` exactly. Not "Start your day the easy way."                |
| On-screen text at 0:23: "Get 20% off — code SAVE20"               | `text_overlays` for the end-card scene contains `{text: "Get 20% off — code SAVE20", t_start: 23, t_end: 30}`. |
| "Warm hopeful major key from 0:10"                                | `music_generate` prompt names the pivot at 10s.                                                                |

Anything the script doesn't specify — exact camera lens, exact wardrobe color, exact font weight — is yours to fill, but stay in the **tone bucket** the script implies.

## Anti-patterns

- Treating the script as a "prompt" and writing your own ad inspired by it.
- Adding a "punchier" hook because the original opening feels slow.
- Adding social-proof / testimonial beats the script didn't include.
- Switching personas mid-ad without the script asking for it.
- Letting auto-captions overlap a baked end-card.
- Producing the full-length version when the user picked the condensed option (or vice versa).
- Running directors serially.
- Calling `web_fetch` more than once on the same domain.
