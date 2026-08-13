# Motion Design Cases

## MDCM: Classic Motion Design

Default entry. Generate a 4-up moodboard first, ask the user to pick or combine a direction, then expand the selected foundation image into a 6-panel storyboard. Stage B must include the selected Stage A asset id in `image_urls`.

## MDH: High Motion Reel

Use for kinetic brand reels, sport, music, fashion drops, energy, launches, and dramatic concept reels. Master camera is hyperkinetic. Every shot needs a peak-action moment, explicit named move, and strong transition medium.

## MDT: Typography Reel

Type is the subject. Letters, words, layout planes, ink, paper, grids, and typographic scale perform the action. Do not treat typography as text printed on photographed objects. Keep camera supportive: drift lock-on, planar slide, layer peel, match-frame type motion.

## MDI: Infographic Reel

Use for data, metrics, systems, process, and chart-build motion. Numbers and chart states are headline-tier content. Sub-labels must be large or removed. Internal choreography carries the motion: radial bloom, modular card sweep, bar-build, timeline reveal, network simplification.

## Product Reel / MDC8

Use only with an actual product asset. Build the product character sheet, then a 9-shot storyboard. Photographic cinematic is permitted here, but product identity must stay locked.

## Common Anti-patterns

- Photoreal cinematic register in non-product modes.
- Same scene repeated with new text.
- Tiny decorative metadata in frame.
- Generic particles, cyan circuitry, gold network webs, or amber smoke defaults.
- Storyboard generated without required `image_urls` foundation.

## MDCM Anti-patterns — Stage B Text-only Shortcut

This failure happens when the agent treats the user's Stage A moodboard choice as a text preference instead of a visual foundation. The repair is mechanical: include the chosen moodboard asset id in `image_urls`, state that all six panels expand that image's subject/material/style world, and reject any Stage B storyboard call with empty `image_urls`.
