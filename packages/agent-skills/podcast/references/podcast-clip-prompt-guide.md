# Podcast Clip Prompt Guide

Reconstructed reference file. This is not an original creative platform side-file; it was rebuilt from `SKILL.md` contract requirements after exact public-source searches found no usable original.

## Purpose

Compose the `motion` field for each Seedance podcast chunk. The prompt must describe only the visible and audible content of the current chunk. Keep planning metadata in the plan file.

## Required Anatomy

```text
Podcast studio conversation, 16:9. Use the storyboard start image as the shot map and the composite reference as the exact room/blocking anchor.

The camera stays locked on a tripod for every shot: no camera motion, locked tripod, no zoom, no pan, no push, no pull.

Shot pattern: [A dialog turn / B monologue continuation / C reaction emphasis].

[Time/block description with hard cuts according to the pattern.]

Dialogue and camera-state tags:
[on-camera] {{speaker_token}} {{speak:persona:<speaker>}}<verbatim line>{{/speak}}
[voice-over, off-camera] {{listener_or_speaker_token}} {{speak:persona:<speaker>}}<verbatim line>{{/speak}}
[continuing] {{speak:persona:<speaker>}}<verbatim continuation>{{/speak}}
[silent - mouth stays closed] <describe listening or reaction, no speech>

Natural conversational delivery, understated gestures, calm facial movement, no theatrical reaction.
```

## Camera-State Tags

- `[on-camera]`: the speaking person's mouth may move; wrap the line in `{{speak:persona:id}}`.
- `[voice-over, off-camera]`: speaker audio plays while the listener or wide shot is visible. The visible listener mouth stays closed.
- `[continuing]`: use for mid-thought chunk starts or lines that continue a prior idea.
- `[silent - mouth stays closed]`: no speak span and no dialogue entry.

## Chunk Position Rules

- Chunk 1: cold-open mid-conversation. No greetings, intros, or "welcome".
- Middle chunks: first line extends a previous thought. No fresh hook.
- Final chunk: payoff, one conversational close beat, then only the final chunk gets a silent ~1.5 s tail.

## Dialogue Array Contract

Every `{{speak:persona:X}}text{{/speak}}` span needs one matching `dialogue[]` entry:

```json
{
  "speaker": "persona:X",
  "text": "text",
  "voice_id": "kling_voice_id",
  "delivery": "calm, conversational"
}
```

`text` must match exactly. Do not put `persona:X:voice` in `reference_images`.

## Forbidden Prompt Content

- Planning markers: chunk numbers, total duration, episode spine, beat notes, continuation rules.
- Non-podcast block skeletons: `Style & Mood`, `Narrative Summary`, `Dynamic Description`, `Static Description`.
- Camera motion: push, pull, pan, tilt, zoom, handheld, rack focus.
- Presenter language: "speaks to camera", "addresses the audience".
- Narrator or third speaker.
