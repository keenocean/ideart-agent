# UGC Confessional Clip Prompt Guide

Reconstructed reference file. This is not an original creative platform side-file; it was rebuilt from `SKILL.md` contract requirements after exact public-source searches found no usable original.

## Purpose

Compose one Seedance `motion` prompt per 3-slot board. Each board becomes one 9:16 clip with three internal hard cuts.

## Required Structure

```text
Vertical 9:16 UGC ad, authentic phone-native texture. Use the 3-slot storyboard image as the narrative map.

Board role: [arc_role]. Duration: [clip_duration] seconds.

Cut 1 ([SELFIE/TRIPOD], [seconds]):
[5+ micro-beats, one main action, framing, expression, product state].
Hard cut to.

Cut 2 ([SELFIE/TRIPOD], [seconds]):
[5+ micro-beats, different action, different framing, body-part target lock].
Hard cut to.

Cut 3 ([SELFIE/TRIPOD], [seconds]):
[5+ micro-beats, closer/payoff, different framing].

Audio:
{{speak:persona:<character>}}[monologue segment verbatim]{{/speak}}

Quality suffix:
[Pattern B default] performed by an INSANELY hyped creator with explosive screaming energy throughout.
[Calm variants] restrained, deadpan, clinical, refined, or warm according to the brief.

No mirror, no visible phone object, no duplicated product, no extra text, no camera movement in TRIPOD cuts.
```

## POV Cadence

- Default `FULL_ARC`: SELFIE -> TRIPOD -> SELFIE.
- Demo-heavy roles may be TRIPOD -> TRIPOD -> SELFIE.
- Selfie POV means the camera is the phone; never show a phone in hand.

## Product Action Locks

- Perfume: wrist/neck, one spray only.
- Lip product: lips, one clean swipe.
- Cream/serum: fingertip first, then face; no repeated pumping.
- Food/drink: mouth/sip/bite; one product instance.
- App/SaaS: product appears as screen or device UI only if supplied.

## Audio Rules

- K=1 may start with up to three bracketed sounds for hyped briefs, e.g. `[gasp]`.
- Calm briefs skip trailer sounds.
- K>1 starts mid-thought, never with greetings or product reintroductions.
- Avoid forbidden first words: OK, Okay, Alright, So, Um, Well, Wait, Like.
- Forbidden phrases: "I'm obsessed", "game changer", "10/10", "you have to try this", generic sales praise.

## Dialogue Payload

Use one entry:

```json
{
  "speaker": "persona:<character>",
  "text": "<monologue segment verbatim>",
  "voice_id": "<kling_voice_id>",
  "delivery": "hyped, scream-gasp energy"
}
```

Text must match the speak span exactly.
