# DTC Caption Presets

Status: reconstructed from `SKILL.md`; not the original creative platform side file.

Rotate caption presets and fonts across an ad set. Do not let every variant use
the same visual caption language.

| Slot | Caption preset    | Font      | Hook overlay | Best use              |
| ---: | ----------------- | --------- | ------------ | --------------------- |
|    1 | `mint-card`       | `Corben`  | `minimal`    | soft lifestyle / gift |
|    2 | `zoom-punch`      | `Anton`   | `bold`       | loud identity hook    |
|    3 | `editorial-clean` | `Alice`   | `script`     | premium / calm        |
|    4 | `soft-pill`       | `DM Sans` | `clean`      | broad consumer        |

## Rules

- One ad's preset + font must differ from the prior ad.
- Hook overlay is for opening title only.
- CTA scene uses `mute_captions: true`.
- CTA card text goes through `text_overlays`, not live captions.
- Avoid overlay text on scenes with live word captions.

## CTA Card Text Slots

- brand wordmark or badge
- price chip or offer chip
- URL pill
- optional free-shipping or guarantee badge

Keep CTA text short and non-duplicative.
