# Grade Recipes

Reconstruction notice: this file is reconstructed from `SKILL.md`; it is not an original creative platform side file.

The grade is punchy youth-sports hype: clamped highlights, saturated team colors, lifted hero visibility, and no crushed faces/uniforms. The filter order is fixed by `SKILL.md`: `colorlevels` first, then `eq=saturation`, then `colorbalance`, then `vignette`.

## Base Chain

Use this as a starting point and tune after sampling post-crop frames:

```text
colorlevels=rimin=0.00:gimin=0.00:bimin=0.00:rimax=1.00:gimax=1.00:bimax=1.00:
  romin=0.04:gomin=0.04:bomin=0.04:romax=0.74:gomax=0.74:bomax=0.74,
eq=saturation=1.45,
colorbalance=rs=0.10:gs=-0.02:bs=-0.12:rm=0.05:bm=-0.07,
vignette=PI/7
```

## Exposure Tuning

| Source condition               | Adjustment                                                                                                      |
| ------------------------------ | --------------------------------------------------------------------------------------------------------------- |
| Bright midday / blown uniforms | Lower `romax/gomax/bomax` toward `0.65-0.72`; keep `eq=saturation` around `1.25-1.35`.                          |
| Evening / indoor but exposed   | Raise `romax/gomax/bomax` toward `0.82-0.88`; keep the same filter order.                                       |
| Underexposed phone video       | Raise `romin/gomin/bomin` only slightly (`0.02-0.03`) and use `eq=saturation=1.15-1.25`; avoid crushing blacks. |
| Overcast gray                  | Use `eq=saturation=1.30-1.45`; warm with `colorbalance` mid/shadow channels after saturation.                   |

Never add contrast-push or curve-preset filters before `colorlevels`. If sharpening is needed, apply it after this grade chain and verify it does not make compression noise more visible.

## Verification

Extract a still frame after crop and grade. If the still is blown out, clipped, or loses the player, adjust before rendering the reel.
