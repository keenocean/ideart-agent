# SkillDetail specification

## Overview

- Target file: `src/routes/(agent)/skills/$skillName.tsx`
- Screenshot: `docs/design-references/app.creatify.ai/skill-detail-desktop-1440.png`
- Interaction model: route + click-driven

## Extracted reference values

- Modal reference inset: 48 px on desktop.
- Surface radius: 12 px.
- Surface border: `1px solid rgba(255,255,255,0.08)`.
- Surface background: `rgb(19, 20, 20)`.
- Surface shadow: `2px 4px 12px rgba(0,0,0,0.14)`.
- Reference height: viewport minus 96 px.
- Layout: large visual area and narrower information rail.

UGC Mind implements this as a routable detail page inside the authenticated Agent shell so refresh, back navigation, and localized URLs remain reliable.

## Detail content

- Back link, title, summary, category and generated keyword tags.
- Save and copy controls.
- Large cover visualization using the same deterministic tone as the catalog card.
- Read-only `SKILL.md` area with its own scroll container.
- Compact prompt form with the skill command chip and submit button.

## Behaviors

- Copy writes the full skill instructions and reports success/failure with a toast.
- Save persists locally and updates the catalog Saved count.
- Submit uses the existing initial-turn handoff with the current skill name; no duplicate chat or generation API is introduced.
- Unknown skill names render an explicit not-found state with a return link.

## Responsive behavior

- Desktop: visual and detail columns share the viewport.
- Tablet/mobile: columns stack; the instruction and prompt areas remain fully usable without fixed positioning.
