# Podcast Composite Prompt Guide

Reconstructed reference file. This is not an original creative platform side-file; it was rebuilt from `SKILL.md` contract requirements after exact public-source searches found no usable original.

## Purpose

Use this guide to write the single `generate_image` prompt that creates `podcast:composite`. The composite is the continuity anchor for every Seedance chunk: blocking, room, lighting, mic geometry, seating order, and 180-degree line.

## Required Prompt Shape

```text
Create a 16:9 cinematic seated podcast-studio composite using the two supplied persona references.

SEATING AND BLOCKING:
- Host from @Image1 sits camera-left.
- Guest from @Image2 sits camera-right.
- Both are seated at the same table, angled inward toward each other.
- Neither person looks into the camera.
- Camera-left person looks slightly off-camera right toward the partner.
- Camera-right person looks slightly off-camera left toward the partner.

ROOM:
[setting as positive description]. Use one coherent location only.

MICROPHONES:
Each person has a plain, unbranded large black studio condenser microphone on a black boom arm in the lower-third foreground. Do not name a mic model.

LIGHTING:
[default cool-neutral studio lighting unless the brief explicitly asks for warmth]. Soft key, mild fill, consistent shadows.

CAMERA:
Locked tripod wide two-shot, straight 180-degree line, no dutch angle, no extreme wide distortion.

NEGATIVE:
No audience, no third person, no presenter gaze, no brand logos, no visible mic model names, no subtitles, no captions, no on-screen text.
```

## Setting Defaults

- Neutral default: lived-in professional studio, dark acoustic panels, shelves, soft practicals, cool-neutral color temperature.
- Warm only on explicit signal: amber lamps, warm wood, golden practicals.
- Outdoor / cafe / home variants are allowed only when the brief says so, and must remain one shared environment for the whole episode.

## Quality Checklist

- Exactly two people.
- Both seated and angled inward.
- Same room and same table for both people.
- Mics visible and unbranded.
- No eyes-to-camera.
- Product, sponsor, or platform branding absent unless it is part of a supplied persona reference and cannot be avoided.
