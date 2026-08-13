---
name: 'phone-mockup-page'
description: 'Create phone mockup page visuals from app screenshots, public references, and optional Markdown design specs using first-party project tools.'
---

# Phone Mockup Page

Use this for app landing page phone mockups, mobile product screenshots, app-store presentation frames, website hero device visuals, and phone-based feature section assets.

## Workflow

1. Confirm the app or product name, target page section, device style, aspect ratio, brand colors, exact screen copy, screenshot project asset ids, and whether a separate design specification document is useful.
2. If the user supplies a public app page or marketing page for factual copy, call `run_skill`, then `web_fetch` and extract only visible product facts and copy.
3. If the user supplies a public screenshot, logo, or reference image URL that must become a reusable project reference, call `run_skill`, then `create_file_by_url`, and continue with the returned project asset id.
4. Call `run_skill`, then `search_project_assets` for uploaded app screenshots, logos, brand files, and prior mockups. Call `run_skill`, then `read_project_asset` for each selected screenshot or brand reference.
5. When a design spec will help the user review the layout before image generation, call `run_skill`, then `write_free_doc` with a Markdown filename such as `phone_mockup_page_spec.md`. Include device choices, frame order, screen list, copy, color notes, and acceptance checks.
6. Call `run_skill`, then `visual_design_task` for the phone mockup page asset. The prompt must include device orientation, screen asset ids, layout hierarchy, safe zones, background treatment, exact overlay copy, and brand constraints.
7. QA generated assets for screenshot fidelity, phone geometry, readable text, crop safety, visual hierarchy, and whether exact app UI text stayed intact.

## Tool Rules

- Call `run_skill` immediately before each concrete tool call.
- Allowed concrete tools for this skill: `create_file_by_url`, `web_fetch`, `search_project_assets`, `read_project_asset`, `visual_design_task`, `write_free_doc`.
- Use project asset ids and artifact references for every image, document, and generated output.
- The visual mockup and optional Markdown spec are returned as project artifacts.

## Output

Return the generated mockup `assetId` or `artifactRef`, optional spec document reference, screenshot asset ids used, page copy, and UI-fidelity or crop caveats.
