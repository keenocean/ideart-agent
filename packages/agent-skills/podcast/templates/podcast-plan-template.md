# Podcast Plan Template

Reconstructed template. This is not an original creative platform side-file; it was rebuilt from `SKILL.md` contract requirements after exact public-source searches found no usable original.

## Episode

- Topic:
- Host persona:
- Host voice ID:
- Guest persona:
- Guest voice ID:
- Setting:
- Tone:
- Aspect ratio:
- Total duration:
- Chunk count:
- Final asset ID: `podcast:final:video`

## Episode Spine

[One sentence narrative arc. Do not paste this into Seedance prompts.]

## Assets

- Composite: `podcast:composite`
- Storyboards used:
  - `podcast:storyboard:A`
  - `podcast:storyboard:B`
  - `podcast:storyboard:C`

## Composite Prompt

```text
[verbatim generate_image prompt]
```

## Storyboard Prompts

### Pattern [A/B/C]

```text
[verbatim storyboard prompt]
```

## Chunk Plan

### Chunk 1

- Duration:
- Pattern:
- Speaker:
- Listener:
- Scene number: 0
- Position rule: cold-open

#### Camera-State Dialogue

```text
[on-camera] ...
[voice-over, off-camera] ...
```

#### Seedance Motion Prompt

```text
[verbatim motion prompt]
```

#### Dialogue Payload

Representative schema only; replace with the actual spoken lines for this chunk.

```json
[
  {
    "speaker": "persona:<speaker>",
    "text": "<line text exactly matching a speak span>",
    "voice_id": "<kling_voice_id>",
    "delivery": "<2-6 word delivery cue>"
  }
]
```

#### Generated Assets

- Video: `podcast:chunk:1:video`
- Audio: `podcast:chunk:1:audio`
- Words: `podcast:chunk:1:words`

## Assembly Payload

```json
{
  "output_asset_id": "podcast:final:video",
  "aspect_ratio": "16:9",
  "scenes": [
    {
      "asset_url": "podcast:chunk:1:video",
      "audio_url": "podcast:chunk:1:audio",
      "words_file": "podcast:chunk:1:words"
    }
  ]
}
```

The entry above is a representative schema row, not a complete executed plan.
Repeat it once per chunk in chronological order and replace `1` with each chunk
number.
