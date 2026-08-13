---
name: 'ads-games-skill'
description: 'Use when the product is a mobile / desktop / console game or game-like app (puzzle, casual, midcore, RPG, hyper-casual, sim, simulator, app-game). Produces a Game Creative Brief — gameplay-footage QA, mascot/character inventory, listing-page review pull-quotes, mood/dimension candidates, and a ranked list of hook concepts tuned for game ads. Trigger before scriptwriting whenever the brief mentions a game, app store / Play Store / Steam / itch.io listing, gameplay video, or a game studio. The producer should run this skill first so its output feeds ads-scriptwriter-skill (or ads-fast-skill).'
---

# Ads Games Skill

<!-- ✏️ EDITED — rewritten intro to lead with hooks-first philosophy and scroll-stop framing -->

Produce a **Game Creative Brief** — a structured document that gives the caller everything they need to drive a high-converting game ad downstream (scene generation, asset materialization, final assembly). The brief leads with **ranked hook concepts and scroll-stop frames**, backed by mascot inventory, mood analysis, footage QA, and enhancement opportunities.

The audience is TikTok-scrollers, Reels-swipers, Shorts-skippers. The first 0.5 seconds decides if they stop. The first 3 seconds decides if they stay. Everything in this brief serves those two moments.

This skill runs **before any scene production** when the product is a game. The caller inherits the brief and uses it to choose hook + visual direction across whatever downstream tools or skills they have available.

## What this skill is responsible for

<!-- ✏️ EDITED — reordered to match hooks-first brief structure, added scroll-stop -->

1. **Rank hook concepts** — 3–5 hooks tailored to this specific game, each with a defined scroll-stop frame (≤ 0.5s) and hook payoff (≤ 3s). Draws from [references/game-hooks.md](references/game-hooks.md).
2. **Define the scroll-stop frame** — the single frame/moment that arrests the thumb. Every hook must specify this independently from the hook payoff.
3. **Propose a mood / dimension** — what reality does this game pull players into? Primary + alternate, confirmed against listing language and footage tone.
4. **Identify mascots / animatable characters** — characters, pets, monsters, protagonists that can carry the ad.
5. **Validate gameplay footage** — confirm the user provided usable footage; if not, list what's missing so the producer can ask.
6. **Flag enhancement opportunities** — visual upgrades to the gameplay footage that don't change the mechanic but make it look more exciting / immersive.
7. **Flag asset gaps** — what's missing, what to ask the user for. Never stall; always output the brief.

## Step 1 — Gather inputs

**This skill runs in isolation.** It cannot see your conversation, prior tool results, or anything the user said earlier — every input must arrive in the dispatch prompt. If audience / duration / platform / tone aren't already pinned down, the dispatcher should clarify with the user **before** invoking this skill (using `AskUserQuestion` if that tool is available in the dispatcher's mode; otherwise via plain-text reply). The skill itself has no way to ask the user.

**Minimum required from the dispatcher:**

- **Game name** and/or **listing URL** (app store / store-front / studio site)
- **Gameplay footage assets** — `input:video-*` asset IDs or public URLs (if available)

**Strongly preferred (avoid mid-skill stalls — gather these from the user upfront):**

- Target audience
- Ad duration + target platform (TikTok / IG Reels / YouTube Shorts / etc.)
- Brand tone
- Genre (if not obvious from the listing)

**Infer the rest from the listing.** If a listing URL is provided, `web_fetch` it and pull title, genre, platform, screenshots, preview video URLs, top reviews (star + text), described mechanics, age rating, monetization model (free/premium/IAP). If only a game name is given, `web_search` first then `web_fetch` the canonical listing.

If footage assets are registered, call `get_asset` on each to get the URL, then probe (see Step 4).

## Step 2 — Mood / dimension probe

<!-- ✏️ EDITED — moved up from step 5 to step 2 because mood drives hook selection -->

Games are escapes. The ad has to telegraph the destination dimension in the first 0.5 seconds visually and confirm it in the first 3 seconds narratively.

Pick a **primary mood** + **alternate mood** from this menu (or invent one if nothing fits):

- **Cozy escape** — warm, soft, tactile, low-stakes (cozy sims, farming, decorating)
- **Power fantasy** — domination, scale, growth, "I am unstoppable" (idle RPG, 4X, builders)
- **Frantic chaos** — speed, near-fails, chain reactions (hyper-casual, runners, action)
- **Meditative flow** — minimal, satisfying, hypnotic (puzzle, color, ASMR-like)
- **Dark mystery** — atmospheric, secretive, eerie (horror, narrative, detective)
- **Strategic clarity** — calm-under-pressure, optimization, mastery (strategy, deckbuilders)
- **Social play** — friends, banter, competition, shared moments (party games, multiplayer)
- **Childlike wonder** — bright, weird, joyful, surreal (creative sandboxes, mascot platformers)

<!-- 🆕 NEW — two new mood options -->

- **Rage bait / fail state** — intentional frustration, "who plays like this??", cringe-watch compulsion (puzzle, physics, trivia, any game with an obvious right answer)
- **Flex / mastery porn** — look how good I am, speed runs, perfect clears, "level 999" energy (skill-based action, rhythm, platformers, competitive)

In the brief, write: **"Best guess: [primary]. Alternate: [secondary]. Reason: [1 sentence anchored in listing language / footage tone]."** Add an `## Asset Gaps` line if the listing/footage is too thin to commit — let the producer ask.

## Step 3 — Mascot / character inventory

From the listing screenshots, footage, and game description, list every animatable subject:

- Player-controlled character(s)
- Pets / companions / sidekicks
- Enemies that have personality (cute monsters, boss creatures)
- Background creatures the camera could pan to
- Brand mascot if the studio has one

For each, note: **name (if any)**, **visual description** (so the caller can reference it canonically across all generated assets), **personality cue** (cute / menacing / goofy / heroic), **already on the listing? yes/no** (existing brand-recognition vs. invented for the ad).

<!-- ✏️ EDITED — updated hook references to include new hooks -->

Animatable mascots are gold for hooks 1 (Save the Creature) and 6 (Cute Mascot Bait) in [references/game-hooks.md](references/game-hooks.md). Surface them prominently.

## Step 4 — Footage QA

<!-- ✏️ EDITED — added tiered inspection approach and aspect ratio priority -->

For every footage asset, run the [references/footage-checklist.md](references/footage-checklist.md) checks.

**Tiered inspection:**

- **Tier 1 (full probe):** Asset is a registered file or downloadable URL. Run `ffprobe` for resolution/fps/duration, extract thumbnail for visual inspection. Full confidence.
- **Tier 2 (visual-only):** Asset is a platform URL (YouTube, TikTok) that can't be probed directly. Inspect via listing thumbnails, screenshots, or `web_fetch` of the page. Check what you can see; flag confidence as "visual inspection only — confirm with raw file."
- **Tier 3 (listing assets only):** No footage uploaded. App Store / Play Store / Steam preview videos and screenshots are your only source. Flag everything as "listing-sourced — user should confirm these represent current gameplay."

Report PASS / FAIL per asset and per check. Priority order:

1. **Has at least one "moment"** — this is the most important check. No moment = no hook = no ad.
2. **Aspect ratio matches target platform** — vertical 9:16 for TikTok/Reels/Shorts, horizontal 16:9 for YouTube, square 1:1 for legacy IG feed. Wrong ratio is a hard fail for the target placement.
3. Resolution ≥ 720p (vertical preferred for TikTok/Reels/Shorts; horizontal acceptable for YouTube long)
4. Stable framerate (30 / 60 fps; no judder)
5. UI text readable (game HUD, score, buttons not blurred or compressed to mush)
6. No watermarks, capture-tool overlays, or recording-app borders
7. Shows actual gameplay (not just menu / cutscene unless that's the hook)

Fail any one of these → flag in the brief + propose a fix (re-record, ask for raw footage, or work around with creative framing).

## Step 5 — Asset gap check (output, do not block)

If gameplay footage is missing or unusable, **do not stall**. Write the brief with what you have and add an **`## Asset Gaps`** section that tells the caller exactly what to ask the user for. The caller is responsible for the user-facing question — using `AskUserQuestion` if it's available in their mode, otherwise via plain-text reply. Your job is to specify what's missing, not to ask.

Acceptable footage sources to suggest:

- **Direct upload** through the chat (becomes an `input:video-*` asset)
- **Public video URL** — YouTube/Vimeo/TikTok/CDN link the system can download
- **App Store / Play Store / Steam listing URL** — preview videos and screenshots scrape automatically as `kind="reference"` assets
- **Existing registered asset** — reference an asset already in the registry by ID
- **Screen recording** — if the user has the game installed, a 30–60s screen capture covers most ad needs

State only the methods the orchestrator actually accepts. Do not promise live screen sharing, file-system access, or anything the producer can't fulfill.

## Step 6 — Hook ranking

<!-- ✏️ EDITED — added scroll-stop frame requirement, tightened timing spec -->

Read [references/game-hooks.md](references/game-hooks.md). Rank the 3–5 hooks most likely to work for this game given mood, mascots, footage moments, and target audience. For each:

- **Hook name** (from the library, or "custom: ...")
- **Scroll-stop frame** — describe the exact visual that appears in frames 1–15 (first 0.5s). This is the thumb-arrester. It must work as a still image with no context. What does the viewer see before they even know what they're looking at?
- **One-sentence concept** specific to this game (not generic)
- **Why it fits** — mood / mascot / footage / audience reason
- **Payoff by** — second mark for the hook resolution (must be ≤ 3s)
- **Required assets** — what footage / mascot / overlay is needed
- **Risk** — what could make it flop (e.g. "needs near-fail footage we don't have yet")

Always prefer hooks anchored in **specific footage moments** the game actually contains over generic templates.

**Scroll-stop frame rules:**

- Must survive a thumbnail crop (safe zone: center 80% of frame)
- One focal point, not two. The eye needs exactly one place to land.
- High contrast against a feed of talking heads and food videos. What makes this frame look _unlike_ everything around it?
- Motion in frame 1 beats a static open. A falling object, a swiping finger, a crumbling tile.
- If the game has a mascot with big eyes, that's almost always your scroll-stop frame. Faces stop thumbs.

## Step 7 — Enhancement opportunities

List 3–5 ways to upgrade the gameplay footage **without changing the mechanic**:

- Tighter zoom on key moments (combos, near-wins)
- Speed ramps on satisfying chains
- Particle/glow accents on score events
- Slow-mo on a level-clear payoff
- UI cleanup (hide HUD elements that don't carry meaning)
- Color grade matching the ad's mood
- UGC-style reactor/commentator overlay on gameplay footage
- Stylized intro card or transition visual matching the ad mood
- Variant branching: test 3–5 different openers against the same gameplay body

Do **not** propose:

- Fake gameplay that doesn't exist
- Mechanics that aren't in the game
- Win states the player can't actually achieve
- Anything that would make the ad misleading per platform policy

## Output file

Write the brief to:

```
/tmp/outputs/game-brief-{game-slug}.md
```

### Brief format

<!-- ✏️ EDITED — restructured to hooks-first order, added scroll-stop frame -->

```markdown
# Game Creative Brief — {Game Name}

## Game Snapshot

- **Platform:** ...
- **Genre:** ...
- **Listing:** {URL}
- **Target audience:** (inferred from listing; override if producer specified)
- **Ad duration / platform:** (inferred; override if producer specified)

## Hook Concepts (Ranked)

1. **Save the Mascot**
   - Scroll-stop frame: Pip mid-fall, eyes wide, tile crumbling beneath — big eyes centered in frame, high contrast against dark background.
   - Concept: Pip is about to fall off the screen edge; player taps to swap tiles and saves him; CTA.
   - Why: Cozy escape mood + strong mascot + we have a near-fall clip at 0:31.
   - Payoff by: 0:02.5
   - Assets needed: existing Pip animation + near-fall clip (input:video-1 at 0:31).
   - Risk: low.
2. ...

## Mood / Dimension

- **Best guess:** Cozy escape.
- **Alternate:** Meditative flow.
- **Reason:** Listing copy emphasizes "unwind", "sip your coffee while you play"; footage uses pastel palette and slow chord pads.

## Mascots & Characters

- **Pip** — small green slime, bouncy, on listing as the icon. Personality: goofy, eager. → strong hook candidate for #1, #6.
- ...

## Footage QA

| Asset ID      | Inspection | Aspect | Res       | FPS | Duration | Has moment                             | Verdict |
| ------------- | ---------- | ------ | --------- | --- | -------- | -------------------------------------- | ------- |
| input:video-1 | full probe | 9:16   | 1080x1920 | 60  | 47s      | yes (near-fall at 0:31, combo at 0:23) | PASS    |

(Notes / fixes per failed check.)

## Enhancement Opportunities

- Tighter crop on the combo at 0:23 — cut from 4s to 2s with a speed ramp on the clear.
- ...

## Asset Gaps

- Need 1 near-fail clip (life lost at level boundary) for hook #3 — please ask the user for a screen recording of a failed attempt at harder levels.
```

## Brief usage

The brief is written to `/tmp/outputs/game-brief-{game-slug}.md` and also surfaced inline in this skill's final response, so the caller has it in working memory without re-reading. It is the caller's reference document for everything downstream — scene generation, asset materialization, final assembly. Whoever consumes it MUST:

- Use the recommended hook (rank #1 unless the user explicitly asks for another)
- Open the ad on the **scroll-stop frame** described in the hook — frame 1, non-negotiable
- Use canonical mascot descriptions verbatim across all generated assets
- Match the mood in beat tone, pacing, and caption-style selection
- Land the hook payoff within the first beat (≤ 3s, ideally ≤ 2s)

The brief is mode-agnostic — it does not assume any particular downstream skill, scriptwriting step, or composition style.

## Constraints

<!-- ✏️ EDITED — split hook timing into scroll-stop + payoff, tightened payoff to 3s -->

- **Scroll-stop in ≤ 0.5 seconds.** Frame 1 must arrest the thumb. It works as a still image with zero context. One focal point, high contrast, motion preferred.
- **Hook payoff in ≤ 3 seconds.** The full hook setup + resolution. The viewer now understands the premise and wants to see more. 4 seconds is too late; the swipe already happened.
- **Be specific.** "Use a cute mascot" is not a hook — "Pip the slime is teetering on a tile, one tap saves him" is.
- **Anchor in real footage.** Every hook must be producible from assets the user has or can record. Flag gaps; don't invent footage.
- **No misleading gameplay.** Visual enhancements only — never depict mechanics or wins the game can't actually deliver.
- **Output file contains ONLY the brief.** No frontmatter, no skill self-reference, no "next steps" notes.

## Detailed Resources

- 📖 [references/game-hooks.md](references/game-hooks.md) — 15+ hook patterns with when-to-use, scroll-stop specs, example beats, risk notes
- 📖 [references/footage-checklist.md](references/footage-checklist.md) — Per-check criteria with tiered inspection (full probe / visual-only / listing-only)

---

**Usage:** Dispatched as a forked skill before scene production for game ads. Reads listing URL + footage assets, writes a Game Creative Brief that the caller inherits and uses for downstream production.
