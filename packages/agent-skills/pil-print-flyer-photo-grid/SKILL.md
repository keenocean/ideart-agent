---
name: 'pil-print-flyer-photo-grid'
description: 'Create a print-ready photo-grid flyer from project assets and public facts using first-party visual design generation.'
---

# PIL Print Flyer Photo Grid

Use this for print or digital flyers that combine real photos, public product/service facts, QR/contact blocks, bullet grids, pricing, and branded footer sections.

## Workflow

1. Call `web_fetch` for public pages that contain business facts, product/service copy, social handles, or image references. If a public image URL is needed as an input, call `run_skill`, then `create_file_by_url`.
2. Use `search_project_assets` and `read_project_asset` to inspect uploaded photos, logo files, QR images, and prior assets.
3. Call `run_skill`, then `visual_design_task` to generate the final flyer as a project asset. Keep dimensions, crop rules, typography, photo grid, QR/contact blocks, pricing, and section order explicit in the prompt.
4. QA the returned generated asset for photo fidelity, business-fact accuracy, QR/contact readability, print sizing, and whether any production-critical copy needs manual review.

## Tool Rules

- Call `run_skill` immediately before each concrete tool call.
- Allowed concrete tools for this skill: `create_file_by_url`, `web_fetch`, `search_project_assets`, `read_project_asset`, `visual_design_task`.
- Use project asset ids for uploaded images. Generated flyer outputs from `visual_design_task` are already persisted as project assets.
- Do not use local code, workspace file rendering, direct upload, publication, or artifact registration tools.

## Output

Return the generated flyer `assetId` or `artifactRef`, source assets used, extracted business facts, and print-readiness caveats.
