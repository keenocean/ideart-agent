# Director Payload Template

Reconstruction notice: this file is reconstructed from `SKILL.md`; it is not an original creative platform side file.

Use this skeleton for each of the four scene payloads.

```json
{
  "scene_id": "scene_01_origin",
  "duration_seconds": 6,
  "aspect_ratio": "9:16",
  "backend": "seedance",
  "speech_status": "silence",
  "mute_captions": true,
  "hook_overlay": null,
  "text_overlays": [],
  "style_direction": "Layered paper-cutout documentary explainer scene on textured cream paper. Hand-cut grayscale photo scraps, dusty navy paper shapes, soft black ink annotations, tape shadows, halftone texture, subtle paper grain. Typography exists only as fixed in-scene cut-newsprint labels. Exactly one coral-red accent appears at the scene climax.",
  "visual_prompt": "<static composition with all labels quoted verbatim>",
  "motion_prompt": "Locked top-down paper-on-desk shot for 6 seconds: 0-1s static establishing frame, 1-4s paper elements pop in one-by-one with 12fps stutter, 4-5s the single coral-red accent lands, 5-6s subtle paper flutter and hold. Camera remains locked-off or uses only a very slow 4-5% truck/zoom, always flat to the desk plane. All text labels remain locked as fixed paper elements throughout, no morphing, no duplication, no text animation. Quote labels exactly: \"<LABEL_1>\", \"<LABEL_2>\". No post-production captions or overlays.",
  "audio": {
    "voiceover": null,
    "audio_url": null,
    "sfx": ["paper slide", "soft tick"]
  }
}
```

## Assembly Rules

- `mute_captions: true` everywhere.
- Use `backend: "seedance"`, `aspect_ratio: "9:16"`, `duration_seconds: 6`, and `speech_status: "silence"` for each scene.
- No hook overlay and no text overlays.
- Do not add a separate end card.
- Keep camera locked-off or limited to a slow 4-5% truck/zoom; the paper scene carries the idea.
- Generate one separate full-length music bed outside the scene payloads; scene audio stays silent.
