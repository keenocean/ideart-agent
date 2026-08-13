# Reconstructed Persona Prompt Guide

This file is a reconstructed functional reference inferred from `SKILL.md`. It is not an original creative platform side file.

## Persona Locking Goal

The protagonist must remain recognizable across every episode and every scene. Lock identity through repeated physical anchors, not through vague style words.

## Required Persona Fields

- Name and series role.
- Age: early 20s minimum; never younger.
- Face shape and build.
- Hair color, cut, and behavior.
- Eye color and expression.
- Skin tone / complexion.
- Distinctive mark or accessory that appears in every frame.
- Clothing silhouette and materials.
- World-specific environment particle or motif.
- Emotional baseline: sadness, restraint, quiet dread.
- Voice asset ID: `persona:[name]:voice`.

## Character Prompt Formula

```text
A young [man/woman/person] in [their] early 20s with [skin tone] cool-toned [complexion], [face shape], slim lean build, [hair description] falling across the forehead in an undone way, [eye color] deep-set eyes that carry a weight of sadness, thin face with defined cheekbones, high model facial features. [Distinctive detail] clearly visible in every frame. [They wear] [dark fantasy clothing description in dark tones]. [They stand] in [world setting] at night — [architecture/environment], glowing ethereal [motif] floating in the cold air, dramatic moody shadows, deep indigo and black sky with faint silver [light source] filtering through.
```

## Scene Prompt Addendum

Append this to every scene prompt:

```text
melancholic contemplative mood, epic movie quality, ultra detailed. Chiaroscuro lighting, deep indigo and obsidian black palette, cold silver rim light, shallow depth of field, 85mm anamorphic feel. No warm golden tones, no orange, no yellow, no bright saturated colors, no cheerful atmosphere.
```

## Distinctive Detail Examples

- small faint scar beneath the left eye
- silver thread tied around one wrist
- cracked porcelain mask hanging at the collar
- pale crescent mark on the cheekbone
- single black-glass earring
- ink-black birthmark on the throat

Use exactly one primary detail and repeat it in every scene.

## Narration Rules

- 8-13 words per 5-second scene.
- Terse literary lines.
- Use ellipsis for a deliberate pause.
- Avoid resolving the episode.
- Keep the voice as internal monologue, not direct address.

## Continuity Checklist

- [ ] Age says early 20s.
- [ ] Distinctive mark appears in every scene prompt.
- [ ] Sad/weight-of-sadness expression appears in close and medium shots.
- [ ] Outfit silhouette stays consistent.
- [ ] Palette excludes warm tones every time.
- [ ] Voice asset ID is unchanged.
- [ ] Final beat is unresolved.

## Episode Output Skeleton

```markdown
## Series Persona

- Protagonist:
- Voice asset:
- Distinctive detail:
- Locked outfit:
- World motif:

## Episode Beat Table

| Scene | Beat                   | Duration | Narration line | Shot type   | Persona prompt requirements |
| ----- | ---------------------- | -------: | -------------- | ----------- | --------------------------- |
| 1     | Establish / world rule |       5s | 8-13 words     | wide/medium | include distinctive detail  |

...
| 12 | Cliffhanger freeze | 5s | 8-13 words | close/title/black | unresolved |

## Music / Captions

- Music: dark orchestral, instrumental only, no lyrics.
- Caption preset: `editorial-clean` or `outlined-text`.
- Title card: `[SERIES NAME] — [SUBTITLE] / EP 01 — [Episode Title]`.
```

Do not add a hard CTA. The unresolved serial ending is the return mechanic.
