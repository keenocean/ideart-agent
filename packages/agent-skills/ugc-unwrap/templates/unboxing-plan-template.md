# UGC Unboxing Plan

Status: reconstructed template from `SKILL.md`; this is not an original creative platform
side file.

## Summary

- Product:
- Character persona:
- Package asset:
- Total duration:
- Board count:
- Aspect ratio:
- Final asset ID: `unboxing:final:video`

## Assumptions

-

## Board Plan

| Board | Arc role                     | Clip duration | POV cadence | Continuity note                           |
| ----: | ---------------------------- | ------------: | ----------- | ----------------------------------------- |
|     1 | `BOARD_1_CANONICAL_UNBOXING` |               |             | packed -> reveal -> focus -> satisfaction |

## Monologue Segmentation

### Board 1

```text
<monologue segment verbatim>
```

## Board Prompts

### Board 1 Image Prompt

```text
<verbatim board image prompt>
```

### Board 1 Seedance Prompt

```text
<verbatim Seedance motion prompt>
```

## Generated Assets

| Board | Board image        | Clip video               | Split audio              | Words file               |
| ----: | ------------------ | ------------------------ | ------------------------ | ------------------------ |
|     1 | `unboxing:board:1` | `unboxing:board:1:video` | `unboxing:board:1:audio` | `unboxing:board:1:words` |

## Assembly

```json
{
  "output_asset_id": "unboxing:final:video",
  "aspect_ratio": "9:16",
  "scenes": [
    {
      "asset_url": "unboxing:board:1:video",
      "audio_url": "unboxing:board:1:audio",
      "words_file": "unboxing:board:1:words"
    }
  ]
}
```

## QA

- Board 1 canonical arc preserved:
- Product hidden in Board 1 slot/cut 1:
- Box not reintroduced after reveal:
- Dialogue text matches `{{speak}}` span:
- Audio split and transcribed:
- Final assembled:
