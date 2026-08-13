---
name: 'color-spec-sheet'
description: 'Create a Pantone-style color specification sheet from a project image using asset inspection and first-party visual design generation.'
---

# Color Spec Sheet

Use this for color extraction, PMS-style sheets, manufacturing color callouts, character color dossiers, and product colorway specs.

## Workflow

1. Use the uploaded product or character image as a project asset id. If the user supplies a public image URL, call `run_skill`, then `create_file_by_url`, and continue with the returned asset id.
2. Call `run_skill`, then `read_project_asset` to inspect the image and determine color zones, labels, finishes, and layout needs.
3. Call `run_skill`, then `visual_design_task` to generate the color specification sheet as a project asset. The prompt must keep the source image visually faithful while adding swatches, PMS approximations, labels, leader lines, and any companion table requested by the user.
4. QA the returned generated asset for source-image fidelity, color-zone labeling, swatch readability, and whether PMS values should be treated as approximations that need human production review.

## Tool Rules

- Call `run_skill` immediately before each concrete tool call.
- Allowed concrete tools for this skill: `create_file_by_url`, `read_project_asset`, `visual_design_task`.
- Use project asset ids for inputs. Generated sheet outputs from `visual_design_task` are already persisted as project assets.
- Do not use local code, workspace file rendering, direct upload, publication, or artifact registration tools.

## Output

Return the generated sheet `assetId` or `artifactRef`, the detected color zones, PMS approximations, input asset id, and any manual-verification caveats.
