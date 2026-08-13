# Reconstructed CTV Platform Notes

This file is a reconstructed functional reference inferred from `SKILL.md` and public CTV platform/IAB guidance. It is not an original creative platform side file.

## Common-Denominator Specs

- Aspect: 16:9 horizontal.
- Resolution: 1920x1080 minimum; 3840x2160 preferred for premium home-screen inventory.
- Container/codec: MP4 H.264; HEVC only when the platform explicitly accepts it.
- Audio: AAC stereo, 48 kHz, broadcast-normalized around -24 to -16 LUFS depending market/platform.
- Bitrate: target 15 Mbps or higher for HD masters.
- File size: keep under 200 MB unless platform spec says otherwise.
- Durations that scale: 15s, 30s, 60s. Default to 30s for generic CTV.

## Platform-Specific Planning Notes

| Platform                       | Practical notes for the brief                                                                                                          |
| ------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------- |
| Hulu / Disney+                 | Strong fit for 15s/30s linear spots and pause/interactive formats. Use QR in final third; keep safe zone conservative.                 |
| Roku                           | Brand must appear in first 3s. Home-screen placements may need static or lightly animated card layouts with remote cues.               |
| Samsung TV Plus / Samsung Ads  | Plan for living-room and home-screen contexts; consider 4K source and sound-off fallback.                                              |
| YouTube TV                     | Treat as high-quality in-stream video. Avoid mobile "subscribe/tap" language; use spoken URL or QR.                                    |
| Peacock / Paramount+           | Linear spots plus pause-style placements. Keep legal and CTA readable at distance.                                                     |
| Tubi / Pluto                   | AVOD lean-back inventory. Use simple messaging, early brand, and clear final CTA.                                                      |
| Fire TV / Apple TV home screen | Often closer to Type B composed placements than narrative video. Include product card, QR, remote-action cues, and brand-color canvas. |

## Type Selection

- Use Type A linear spot unless user mentions pause ad, home screen, interactive, shoppable, KERV, Innovid, BrightLine, Roku home, Samsung home, or provides static product-card references.
- Use Type B when all key information should remain visible at once.

## Unknown Platform

If the user only says "CTV", use:

```text
Generic CTV common denominator: 16:9, 1920x1080, MP4 H.264, AAC stereo 48 kHz, 15 Mbps target, 30s default, title-safe 3.5% inset, brand in first 3s, QR final 5-10s if performance CTA.
```
