---
name: 'kannada-bus-poster-dark-gold'
description: 'Create a dark-gold Kannada bus advertisement poster from project assets and public facts using first-party visual design generation.'
---

# Kannada Bus Poster Dark Gold

Use this for premium regional-language bus or travel posters with a dark navy night-travel background, gold headings, route/facilities blocks, bus photo, and booking CTA.

## Workflow

1. Gather brand name, route stops, facilities, phone, address, bus photo, and exact poster copy. If the bus photo is a public URL, call `run_skill`, then `create_file_by_url`; use `web_fetch` only for public pages that need factual extraction.
2. Call `run_skill`, then `read_project_asset` for bus photos, logos, or uploaded copy references that need inspection before prompting.
3. Call `run_skill`, then `visual_design_task` to generate the final poster as a project asset. The prompt must specify dark navy night-travel background, gold headings, Kannada typography, route/facilities blocks, bus photo placement, booking CTA, and any print size or aspect ratio from the brief.
4. QA the returned generated asset for text fidelity, Kannada glyph rendering, CTA accuracy, bus-photo fidelity, and route/facility facts. If exact Kannada text is wrong or unreadable, regenerate through `visual_design_task` with tighter text constraints or ask for approved copy.

## Tool Rules

- Call `run_skill` immediately before each concrete tool call.
- Allowed concrete tools for this skill: `create_file_by_url`, `web_fetch`, `read_project_asset`, `visual_design_task`.
- Use project asset ids or fetched page facts as inputs. Generated poster outputs from `visual_design_task` are already persisted as project assets.
- Do not use local code, workspace file rendering, direct upload, publication, or artifact registration tools.

## Output

Return the generated poster `assetId` or `artifactRef`, source facts used, input asset ids, and any typography or copy-fidelity caveats.
