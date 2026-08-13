# Reconstructed Voice Archetypes

This file is a reconstructed functional reference inferred from `SKILL.md`. It is not an original creative platform side file.

## Single-Persona Default

Use one narrator for the whole ad unless the script explicitly names multiple speakers. Reuse the same `voice_asset_id` and `kling_voice_id` for every scene.

## Picker

| Script tone                                           | Persona direction              | Delivery                              |
| ----------------------------------------------------- | ------------------------------ | ------------------------------------- |
| Empathetic service, family, legal, healthcare         | Middle-aged female, warm       | Calm, reassuring, clear, not breathy  |
| Authoritative finance, B2B, expert                    | Middle-aged male, calm         | Measured, confident, low drama        |
| Hype, DTC, Gen-Z, energy, fitness                     | Younger male or female, bright | Fast but intelligible, upbeat         |
| Conspiratorial, "you've been lied to", problem expose | Younger male, lower register   | Intimate, slightly hushed, controlled |
| Deadpan, dry, comedic                                 | Younger adult, flat affect     | Underplayed, precise timing           |
| Luxury / premium                                      | Adult female or male, refined  | Slow, elegant, restrained             |
| Tech / SaaS explainer                                 | Adult neutral voice            | Crisp, articulate, modern             |

## Prompt Shape For `setup_persona(voice_only=true)`

```text
Voice-only narrator for a [TONE] ad. [AGE/GENDER] voice, [DELIVERY], clear diction, natural ad-read pacing, no character acting beyond the script's tone. Must preserve VO verbatim.
```

## Guardrails

- Do not switch accent, gender, or age mid-ad unless script explicitly marks a speaker change.
- Do not over-act legal, healthcare, finance, or regulated content.
- Never use a child/teen voice for adult products or regulated categories.
- If brand audience is unclear, choose adult neutral warmth over extreme performance.
