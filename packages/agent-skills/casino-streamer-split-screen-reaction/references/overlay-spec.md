# Split-Screen Reaction Overlay Spec

Status: reconstructed from `SKILL.md`; this is not an original creative platform side file.

All coordinates assume a 9:16 vertical frame.

## Zones

| Zone             | Position                     | Use                                |
| ---------------- | ---------------------------- | ---------------------------------- |
| `top_hook`       | `position_y_ratio: 0.06`     | Hook overlay above creator's head. |
| `divider_center` | centered on 50% gold divider | Increment staircase overlays.      |
| `result_area`    | near bottom-screen event     | Result counter pill.               |
| `end_card_cta`   | lower third                  | CTA pill on end card.              |
| `disclaimer`     | bottom 4-6%                  | Responsible-use line.              |

## Timing

| Overlay     | Start | End / Duration | Style                         | Motion             |
| ----------- | ----: | -------------: | ----------------------------- | ------------------ |
| Hook        |  0.2s |           3.0s | punch font, 72px+, white/gold | quick scale-in     |
| Increment 1 |  5.0s |           5.7s | gold/orange text              | upSwipe-in         |
| Increment 2 |  5.7s |           6.3s | brighter gold                 | bounce-in          |
| Increment 3 |  6.3s |           7.0s | orange/white mix              | bounce-in          |
| Peak burst  |  7.0s |           8.0s | largest gold/white            | zoom punch + shake |
| Result pill |  8.0s |          10.5s | dark pill, punch font         | pop-in             |
| CTA pill    | 12.3s |          17.0s | gold pill, black text         | bounce-in          |
| Disclaimer  | 12.0s |          17.0s | small grey sans               | static             |

## Hook Overlay

```json
{
  "text": "ONE TAP COULD\nCHANGE YOUR DAY",
  "zone": "top_hook",
  "position_y_ratio": 0.06,
  "font": "punch display",
  "color": "#FFFFFF",
  "accent_color": "#FFD700",
  "duration": 3.0
}
```

Do not move the hook lower; it will overlap the creator's face.

## Increment Staircase

Use 3-4 steps. Example:

```text
5x -> 15x -> 50x -> 500x
```

The sequence must read as a staircase. Do not skip from tiny to peak in one jump.
Place it at the divider seam so the top reaction and bottom app event feel tied
together.

## Result Counter

The counter is always a text overlay, never baked into the app UI.

```json
{
  "type": "text_pill",
  "background": "#111111",
  "text_color": "#FFD700",
  "font": "punch display",
  "position": "near on-screen result",
  "entrance": "pop-in"
}
```

## End Card

- Logo hero at center/top.
- Review badge as product reference image.
- CTA pill: black text on gold, arrow retained.
- Responsible-use disclaimer at very bottom.
- No VO; `audio_url` is `null`.
