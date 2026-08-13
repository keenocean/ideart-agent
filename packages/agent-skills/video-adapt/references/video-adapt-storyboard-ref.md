# Video Adapt Storyboard Reference

Status: reconstructed from `SKILL.md`; this is not an original creative platform side file.

This reference defines the data that feeds the Step C.5 storyboard sheet in
`video-adapt`. The storyboard is an internal composition anchor for
`generate_scene_video`, not a user-facing deliverable and not a source-style
recreation.

## Inputs

Use these inputs after Step C.3 or C.alt has produced renderable chunks.

| Input                   | Required | Notes                                                                                                              |
| ----------------------- | -------: | ------------------------------------------------------------------------------------------------------------------ |
| `chunks`                |      yes | Ordered chunk objects with `chunk_index`, `duration_seconds`, `prompt_text`, and referenced `<<image_N>>` markers. |
| `bindings_meta`         |      yes | The C.1b metadata list. It drives legend entries, silhouettes, and reference-budget audit.                         |
| `element_bindings`      |      yes | Map from `<<image_N>>` to generated asset id. Used later at render time.                                           |
| `panel_aspect`          |      yes | Must match the user-selected scene-video aspect ratio: `9:16`, `16:9`, or `1:1`.                                   |
| `style`                 |      yes | `classic` or `sketch`. Mode `off` skips storyboard generation entirely.                                            |
| `storyboard_asset_stem` |      yes | `vadapt-sb-<sha8>`, where the hash is stable for the same source, chunks, bindings, aspect, and style.             |

## Style Modes

| Feature       | `classic`                               | `sketch`                                 |
| ------------- | --------------------------------------- | ---------------------------------------- |
| Background    | Warm beige paper                        | Pure white `#FFFFFF`                     |
| Drawing       | Black ink plus flat colored silhouettes | Semi-transparent grey pencil/ink strokes |
| Legend row    | Present at top, about 10% height        | Omitted                                  |
| Entity badges | Present as numbered ID glyphs           | Omitted                                  |
| Chunk badge   | Black text on white rectangle           | Thin grey text, no filled rectangle      |
| Orphan cells  | Centered `END` card                     | Blank                                    |

The style is hardcoded by mode. Do not adapt it to match the source video's
cinematic, UGC, anime, or commercial look.

## `bindings_meta` Rules

Every non-storyboard reference slot must have an entry:

```json
{
  "slot": "<<image_1>>",
  "label": "main-avatar",
  "kind": "character",
  "subject": "main",
  "shape": "optional silhouette override"
}
```

Allowed `kind` values:

- `character`
- `environment`
- `prop`
- `outfit`
- `composite_outfit`
- `composite_props`
- `composite_environment`
- `storyboard`

Do not include the storyboard slot in the legend. If it is already appended, mark
it with `kind: "storyboard"` or `is_storyboard: true` and ignore it while building
legend cards.

## Legend Construction

For `classic` mode only:

1. Group entries by kind in this order: characters, outfits, environments, props,
   composites.
2. Render one compact ID card per recurring entity.
3. Use the same numeric ID glyph inside storyboard cells whenever that entity
   appears.
4. Keep labels short; prefer `main`, `office`, `guitar`, `red-suit` over prose.

For `sketch` mode:

1. Omit the legend entirely.
2. Rely on repeated silhouette shapes and cell composition for continuity.
3. Never add ID glyphs, arrows, labels, badges, or explanatory text.

## Panel Aspect Layout

| `panel_aspect` | Preferred cell layout                                                          |
| -------------- | ------------------------------------------------------------------------------ |
| `9:16`         | Large preview top; small detail strip below. Cells may be taller and narrower. |
| `16:9`         | Large preview left; detail strip right. Cells may be wider and shorter.        |
| `1:1`          | Large preview top half; detail strip bottom half. Cells trend square.          |

These are inner-cell composition instructions only. The final storyboard sheet
itself remains 2:3 vertical.

## Cell Content

Each chunk cell should show:

- The dominant environment or composite environment panel.
- Characters and props that appear in that chunk, using `bindings_meta` shapes.
- A clear camera-blocking cue: close-up, wide, over-shoulder, macro, tracking, or
  locked tripod.
- The main action beat at the moment the chunk starts.
- Any composite panel reference if the chunk text says `panel I of <<image_N>>`.

Do not draw unreferenced characters, props, outfits, or environments. The sheet is
a composition map for existing `<<image_N>>` slots, not an expansion step.

## Failure Conditions

Abort Step C.5 before rendering scenes if:

- `style` is neither `classic` nor `sketch`.
- `panel_aspect` is missing or differs from the value passed to scene rendering.
- A chunk uses a `<<image_N>>` marker that has no `element_bindings` entry.
- Storyboard generation fails for `classic` or `sketch`.

Do not abort solely because a projected chunk exceeds the reference-image budget.
Instead, rerun the Step A.5 budget planner with `reserve_storyboard_slot=true`,
apply every recommended composite, and rebuild `bindings_meta` before C.5. If the
planner returns `all_within_budget_post: false`, revisit chunking or compaction
before generating the storyboard.
