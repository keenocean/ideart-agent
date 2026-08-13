# TTS Phonetics for Pharma Parody

Status: reconstructed from `SKILL.md`; this is not an original creative platform side file.

Use phonetic respelling before generating TTS. Generate and approve TTS before
rendering video.

## Rules

- Spell out all numbers: `two thousand and forty-one`, not `2,041`.
- Mark unusual stress with caps: `ho-moh-jeh-NAY-ih-tee`.
- Prefer readable actor input over dictionary precision.
- Add comma pauses after major clinical clauses.
- Keep disclaimer copy dense but pronounceable; use assembly `playback_rate` for
  speed instead of speeding the source audio file.

## Starter Library

| Word            | TTS helper                |
| --------------- | ------------------------- |
| homogeneity     | `ho-moh-jeh-NAY-ih-tee`   |
| flaccid         | `FLASS-id`                |
| synergy         | `SIN-er-jee`              |
| organizational  | `or-guh-nuh-ZAY-shuh-nul` |
| compliance      | `kum-PLY-ens`             |
| procurement     | `proh-KYOOR-ment`         |
| fiduciary       | `fih-DOO-shee-air-ee`     |
| paradigm        | `PAIR-uh-dime`            |
| efficacy        | `EFF-ih-kuh-see`          |
| placebo         | `pluh-SEE-boh`            |
| contraindicated | `kon-truh-IN-duh-kay-ted` |
| chronic         | `KRAH-nik`                |
| deficiency      | `dee-FISH-en-see`         |
| executive       | `ig-ZEK-yuh-tiv`          |
| stakeholders    | `STAKE-hohl-ders`         |
| governance      | `GUH-ver-nens`            |

## Disorder Naming

Pattern:

```text
<Dignified multi-syllable disorder name> (<three-letter acronym>)
```

Examples:

- `Chronic Synergy Deficiency (CSD)`
- `Acute Alignment Avoidance (AAA)`
- `Executive Consensus Fragility (ECF)`
- `Organizational Momentum Suppression (OMS)`

The VO must spell out the full name before using the acronym.

## Number Phrases

Use full words:

- `nine-year double-blind study`
- `two thousand and forty-one executives`
- `seventy-three percent`
- `one point seven five times`

## Disclaimer Delivery

Write the disclaimer as pronounceable legal-speak:

```text
Side effects may include spontaneous alignment, excessive stakeholder clarity,
reduced meeting duration, and mild-to-severe brand confidence.
```

Then render with scene-level playback rate near `1.75x`. Do not bake the speed
into the TTS file.
