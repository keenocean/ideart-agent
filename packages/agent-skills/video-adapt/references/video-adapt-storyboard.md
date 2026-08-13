# Video Adapt Storyboard Prompt

Status: reconstructed from `SKILL.md`; this is not an original creative platform side file.

Build this nine-layer prompt for Step C.5 when `storyboard_mode` is `classic` or
`sketch`. Skip the entire file when the mode is `off`.

## Render Call

```python
generate_image(
    prompt=storyboard_prompt,
    output_asset_id="vadapt-sb-<sha8>:final",
    aspect_ratio="2:3",
    resolution="2K",
    model="gpt-image-2",
)
```

The generated asset is appended as the last IMAGE MAP / ELEMENT_BINDINGS slot:

```text
<<image_N>> = Video-adapt storyboard sheet (Step C.5, chunked-hierarchical, 2:3 vertical, internal use only)
```

## Prompt Builder

The nine layers below are builder sections. Do not paste the section labels
`Layer 1`, `Layer 2`, etc. into the final image prompt. Assemble the final prompt
as plain instructions so the model has no layer headings or control labels to
render as visible text.

Start the final prompt with:

```text
Create a vertical 2:3 production storyboard sheet for AI video composition. This
is a blocking diagram, not a cinematic frame and not source-style mimicry.
```

## Layer 1 - Sheet Format

Always include:

```text
Vertical 2:3 storyboard sheet, clean production-board layout, ordered left-to-right
and top-to-bottom by chunk index. Use a thin black hairline grid. Each cell is a
composition panel for one generated video chunk. Keep generous margins. Preserve
all cells inside the frame.
```

Add the `panel_aspect` inner-layout instruction:

- `9:16`: `Inside each cell, favor vertical video blocking: large preview area on top, small detail strip at bottom.`
- `16:9`: `Inside each cell, favor horizontal video blocking: large preview area on left, small detail strip on right.`
- `1:1`: `Inside each cell, favor square video blocking: large preview area above, detail strip below.`

## Layer 2 - Style Mode

### Classic

```text
Style mode CLASSIC: warm beige paper background, black ink line art, flat restrained
color fills for recurring entities, simple production-diagram clarity. Add a
top legend row about 10% of sheet height with compact ID cards for recurring
characters, outfits, environments, props, and composites. Add numbered entity
badges inside cells when those entities appear. Use a black CHUNK badge on a
small white rectangle. Fill unused trailing cells with a centered END card.
```

### Sketch

```text
Style mode SKETCH: pure white #FFFFFF background, semi-transparent grey pencil
and ink strokes in #A0A0A0 to #C0C0C0 at about 50% opacity. Keep cell grid lines
thin black for legibility. No colored fills. No legend row. No entity badges. No
ID glyphs. Use the thinnest grey #D0D0D0 to #E8E8E8 for CHUNK badge text with no
background rectangle. Leave unused trailing cells completely blank.
```

## Layer 3 - Chunk Grid

Build one cell per chunk. For each cell, include:

```text
CHUNK <index>: duration <seconds>s
Referenced slots: <slots used in chunk prompt_text>
Dominant action: <one concise action beat from prompt_text>
Camera blocking: <wide / medium / close-up / macro / over-shoulder / tracking / locked>
```

Cells must be ordered by chunk index. Never merge unrelated chunks unless Step D
has already merged a sub-3-second tail chunk.

## Layer 4 - Entity Silhouettes

Use `bindings_meta` as the authority. Suggested shapes:

- `character`: consistent simplified human or creature silhouette; use `shape`
  override when present.
- `environment`: simplified location block, skyline, room, landscape, or split
  panel for `composite_environment`.
- `prop`: simplified object silhouette, large enough to read.
- `outfit`: ghost mannequin or clothing-board silhouette.
- `composite_outfit`: numbered ghost-mannequin panels.
- `composite_props`: numbered shelf panels.
- `composite_environment`: two side-by-side environment panels.

For composite slots, draw the requested panel number if the chunk text says
`panel I of <<image_N>>`; otherwise show the whole composite sheet as a compact
reference block.

## Layer 5 - Cell Composition

For each chunk:

1. Use only the entities named by `<<image_N>>` markers in that chunk.
2. Place the dominant subject on a readable third or in the center depending on
   the chunk's camera grammar.
3. Keep action direction obvious with pose, orientation, or motion arrows in
   classic mode. In sketch mode, use only faint gesture lines, no labels.
4. Show spatial relationship between character, object, and environment.
5. Respect outfit binding: an outfit slot modifies its subject; it is not an
   extra person.

## Layer 6 - Continuity

```text
Repeat the same silhouette design for the same binding across all cells. Keep
outfit boards visually tied to their subject. Keep recurring props at the same
relative scale class. Keep environments distinct by layout, not by labels alone.
```

## Layer 7 - Text Policy

Classic allowed text:

- Legend labels.
- Entity ID glyphs.
- Chunk badges.
- `END` cards in unused cells.

Sketch allowed text:

- Thin grey chunk badge only.

Always forbidden:

- Dialogue, subtitles, marketing headlines, source-video title cards.
- Explanatory paragraphs.
- `SLOT 1`, `SLOT 2`, model prompts, asset IDs, UUIDs.

## Layer 8 - Negative Constraints

```text
Do not create a movie poster, mood board, comic page, photoreal frame sheet, or
advertisement. Do not mimic the source video's lighting or production style.
Do not add extra characters, props, logos, captions, UI, watermarks, QR codes,
or decorative typography. Do not redraw product logos. Do not put any entity in
a cell unless its <<image_N>> marker appears in that chunk.
```

## Layer 9 - Final Quality Lock

```text
Every chunk has exactly one readable cell. The cell grid is complete and not
cropped. The selected style rules are followed exactly. The drawing is a clear
blocking schematic for AI video generation. Reference entities are legible but
simple. The sheet is vertically composed for 2:3 output.
```
