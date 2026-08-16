# SkillsCatalog specification

## Overview

- Target files: `src/components/agent/skills-page.tsx`, `src/components/agent/skill-card.tsx`
- Screenshot: `docs/design-references/app.creatify.ai/skills-list-desktop-1440.png`
- Interaction model: click-driven

## Extracted reference values

- Page background: `rgb(19, 20, 20)`.
- Body font: General Sans, 14 px / 21 px, weight 400.
- Reference content width: 1024 px.
- Page heading: 20 px / 26 px, weight 540.
- Card radius: 12 px.
- Card reference size at 1440 px: approximately 331 × 220 px.
- Card grid: three equal columns with 16 px gaps.
- Card cover: color gradient plus an 8 px radial-dot overlay.

UGC Mind maps these values to existing theme tokens and system typography instead of changing the global product theme.

## Card content

- Top-left category badge.
- Top-right saved toggle.
- Centered skill title.
- Bottom gradient with a short summary and direct link affordance.

## States

- Default: themed gradient cover and low-contrast dot texture.
- Hover/focus: card rises 2 px, cover brightens, summary becomes more prominent.
- Saved: star icon is filled and remains visible.
- Empty search/saved view: calm bordered empty state with reset action.

## Responsive behavior

- Desktop: three columns.
- Tablet: two columns.
- Mobile: one column and a minimum 220 px card height.
