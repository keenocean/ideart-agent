# Typography Rules

Reconstruction notice: this file is reconstructed from `SKILL.md`; it is not an original creative platform side file.

## Case 1: Text Is The Deliverable

Examples: ad headline, logo lockup, poster-like card, text-led Pinterest pin.

- Use `model="gpt-image-2"`.
- Quote the exact text.
- Keep copy short: headline plus optional micro-line.
- Include layout constraints: font weight, line breaks, safe margins.
- Verify spelling, accents, punctuation, and no rogue text.

## Case 2: Product Label Text Must Be Preserved

Examples: packshot, closeup, ecommerce product hero with a supplied product reference.

- Use the product reference in `image_urls`.
- Enumerate the label strings that must remain unchanged.
- Add: `Do not redraw, retype, translate, or alter the product label.`
- Avoid asking the model to invent new label copy.

## Case 3: Text Is Not Needed

Examples: lifestyle scene, conceptual splash, restyle.

- Do not reserve artificial blank space for text.
- Do not ask for banners, badges, captions, ratings, or marketplace UI.
- Let the composition be photographic; only the product label may contain text.

## Quality Gate

Reject any output with misspelled text, fake badges, duplicate words, or unreadable product label when label fidelity is required.
