# Mirror Try-On Director Prompt Fragments

Status: reconstructed from `SKILL.md`; not the original creative platform side file.

## Persona Base Outfit

Neutral base outfit distinct from every uploaded outfit: warm-brown trousers,
simple black tank, minimal jewelry, natural makeup, hair consistent with persona
reference. The base outfit should not compete with the try-on garments.

## Hanger-To-Wearing Pattern

```text
Start already mid-action in a mirror selfie. The creator stands in front of a
full-length mirror, holding the outfit on a hanger near her shoulder, phone
visible in hand, head tilted slightly down toward the mirror.
[Hard cut]
On the music beat, she is now wearing the outfit in the same mirror position.
Tiny confident pose shift, one hip angle, product visible head-to-toe.
```

## Multi-Outfit Beat Pattern

```text
Outfit 1 hanger reveal. [Hard cut] Outfit 1 wearing beat.
[Hard cut] Outfit 2 hanger reveal. [Hard cut] Outfit 2 wearing beat.
[Hard cut] Outfit 3 hanger reveal. [Hard cut] Outfit 3 wearing beat.
```

## Silent Motion Rules

- no voice-over
- `mute_captions: true` on every scene
- one static hook overlay only
- no baked-in prices, logos, outfit numbers, or labels
- end on the final wearing beat
- if an uploaded garment is top-only or bottom-only, pair it with another upload
  or a neutral garment in prose so every wearing beat is a complete outfit
