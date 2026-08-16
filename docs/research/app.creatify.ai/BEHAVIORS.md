# Creatify Skills reference behaviors

Source pages inspected on 2026-08-16:

- `https://app.creatify.ai/creative-agent`
- `https://app.creatify.ai/creative-agent/skills`

## Interaction sweep

- The Agent start screen exposes Skills as a pill below the prompt surface, not as a control inside the composer toolbar.
- The companion pills switch the creative mode or launch a focused workflow: video ads, image ads, competitor research, and tutorial.
- The Skills library uses client-side search, horizontal category filters, and card groups.
- A skill card is click-driven. Activating a card opens a large detail surface with media/cover art on the left and metadata plus the `SKILL.md` body on the right.
- The detail surface has saved/favorite and copy actions. Its final action is a compact “Create with this skill” prompt.
- Cards use a subtle hover lift/brightness transition; category and saved controls remain independently clickable.
- Desktop cards render in three columns. At 390 px the reference keeps its fixed app rail and overflows the card canvas; UGC Mind should preserve the same visual hierarchy but use a single fluid column instead of reproducing that overflow defect.
- Reduced-motion users should not receive animated cover movement.

## Responsive contract for UGC Mind

- Desktop (`>= 1280px`): three-column skill grid and a two-column detail layout.
- Tablet (`768–1279px`): two-column grid; detail content stacks.
- Mobile (`< 768px`): one-column grid, horizontally scrollable filters, stacked detail content, and no horizontal page overflow.
