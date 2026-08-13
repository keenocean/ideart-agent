# UGC Plan Template

Reconstructed template. This is not an original creative platform side-file; it was rebuilt from `SKILL.md` contract requirements after exact public-source searches found no usable original.

## Campaign

- Product present:
- Product asset:
- Character persona:
- Voice ID:
- Total duration:
- Board count:
- Tone signal:
- Aspect ratio: `9:16`
- Final asset ID: `ugc:final:video`

## Arc Roles

[HOOK / MAIN / CLOSER sequence]

## Monologue Segmentation

### Board 1

- Arc role:
- Clip duration:
- POV cadence:
- Framing cadence:
- Monologue segment:

## Board Prompts

### Board 1

```text
[verbatim board prompt]
```

## Seedance Prompts

### Board 1

```text
[verbatim motion prompt]
```

## Dialogue Payloads

Representative schema only; replace with one entry per board.

```json
[
  {
    "speaker": "persona:<character>",
    "text": "<monologue_segment verbatim>",
    "voice_id": "<kling_voice_id>",
    "delivery": "<2-6 word delivery cue>"
  }
]
```

## Generated Assets

- Board image: `ugc:board:1`
- Video: `ugc:board:1:video`
- Audio: `ugc:board:1:audio`
- Words: `ugc:board:1:words`

## Assembly Payload

Representative schema only; replace the example object with one required entry per generated board before execution.

```json
{
  "output_asset_id": "ugc:final:video",
  "aspect_ratio": "9:16",
  "scenes": [
    {
      "asset_url": "ugc:board:1:video",
      "audio_url": "ugc:board:1:audio",
      "words_file": "ugc:board:1:words"
    }
  ]
}
```
