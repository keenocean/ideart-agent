# Skills experience topology

## Agent start screen

1. Agent shell and existing sidebar.
2. Centered creation headline.
3. Existing generation workbench.
4. New quick-action pill row: Skills, Video ads, Image ads, Competitor research, Watch tutorial.
5. Existing inspiration gallery.

Interaction model: click-driven. Skills navigates to `/skills`; media pills update the existing generation mode; competitor research seeds the prompt; tutorial opens the existing preview dialog.

## Skills library (`/skills`)

1. Page title and concise explanation.
2. All/Saved tabs with counts.
3. Search control and horizontal category filters.
4. Featured group when the unfiltered All view is active.
5. Responsive card grid for the remaining catalog.

Interaction model: client-side search/filtering over the existing `/api/agent/skills` catalog. Saved state is local to the browser and does not imply server publication or ownership.

## Skill detail (`/skills/$skillName`)

1. Back navigation and skill identity.
2. Large visual cover panel.
3. Summary, category, saved and copy actions.
4. Scrollable, read-only `SKILL.md` source.
5. Compact prompt entry that hands the selected skill to the existing chat handoff.

Interaction model: route-driven detail view. The skill body is fetched on demand from a narrow API endpoint so instructions remain out of the initial client bundle.
