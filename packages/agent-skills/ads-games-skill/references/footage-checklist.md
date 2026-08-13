# Gameplay Footage Checklist

Status: reconstructed from `SKILL.md`; this is not an original creative platform side file.

Use this checklist for every gameplay asset before ranking hooks.

## Inspection Tiers

| Tier | Source                                 | Required handling                                                                             |
| ---- | -------------------------------------- | --------------------------------------------------------------------------------------------- |
| 1    | Registered asset or downloadable URL   | Run `ffprobe`, extract thumbnail(s), inspect full confidence.                                 |
| 2    | Platform URL not directly downloadable | Inspect page, screenshots, thumbnails, and preview metadata. Flag visual-only confidence.     |
| 3    | Listing assets only                    | Use App Store / Play Store / Steam screenshots and previews. Flag listing-sourced confidence. |

## Checks

### 1. Has a Moment

The asset must contain at least one hookable moment: near-fail, combo, reveal,
boss, mascot reaction, level clear, wrong choice, or visible progression.

- PASS: timestamped moment exists.
- FAIL: only menu, idle UI, loading screen, or generic movement.

### 2. Aspect Ratio

Target-platform match is high priority:

- TikTok / Reels / Shorts: `9:16`.
- YouTube horizontal: `16:9`.
- Legacy feed: `1:1`.

Wrong ratio is a hard fail for placement unless a crop plan preserves the focal
point.

### 3. Resolution

- PASS: 720p or higher.
- WARN: 540p-719p.
- FAIL: below 540p or severe compression.

### 4. Framerate

- PASS: stable 30 or 60 fps.
- WARN: variable but visually acceptable.
- FAIL: judder, dropped frames, or screen-record lag that obscures mechanics.

### 5. UI Readability

HUD, score, buttons, and tutorial prompts must be readable at phone size when
they matter to the hook.

### 6. Capture Cleanliness

Fail if present:

- Capture-app frame or controls.
- Watermark not intended for the ad.
- Recording notification.
- Black borders that waste frame area.
- Mouse cursor where touch UI is implied.

### 7. Actual Gameplay

PASS only if the asset shows playable mechanics or a truthful in-game event.
Menus, store pages, cinematics, and cutscenes can support mood but cannot carry a
gameplay hook unless the downstream ad intentionally opens on a non-gameplay
cinematic.

## Report Table

```markdown
| Asset ID      | Inspection | Aspect | Res       | FPS | Duration | Has moment             | Verdict |
| ------------- | ---------- | ------ | --------- | --- | -------: | ---------------------- | ------- |
| input:video-1 | full probe | 9:16   | 1080x1920 | 60  |      47s | yes, near-fail at 0:31 | PASS    |
```

## Fix Suggestions

- Re-record vertical footage for vertical placement.
- Upload raw file instead of compressed platform URL.
- Capture 30-60s including one fail, one near-win, and one payoff.
- Crop/zoom only if the focal point stays inside the center 80%.
- Use listing screenshots only as backup mood references.
