# AgentQuickActions specification

## Overview

- Target file: `src/components/agent/prompt-launcher.tsx`
- Reference: `docs/design-references/app.creatify.ai/skills-list-desktop-1440.png`
- Interaction model: click-driven

## DOM structure

- Horizontal list below `GenerationWorkbench`.
- Each action is an icon + label pill.
- The row scrolls horizontally on narrow viewports without wrapping the page.

## Visual contract

- Height: 40 px.
- Border: one-pixel theme border.
- Radius: fully rounded.
- Background: transparent; muted theme background on hover.
- Typography: 14 px, medium weight.
- Spacing: 8 px icon/label gap, 16 px horizontal padding, 8 px between pills.

## Actions

- Skills: navigate to `/skills`.
- Video ads: switch existing settings to video mode and focus prompt.
- Image ads: switch existing settings to image mode and focus prompt.
- Competitor research: insert the localized research starter and focus prompt.
- Watch tutorial: open the first existing inspiration preview.

## Responsive behavior

- Desktop: centered single row.
- Mobile: left-aligned horizontal scrolling with hidden scrollbar.
