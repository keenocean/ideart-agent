---
name: 'playstore-ui-anchored-promo'
description: 'Create app-store promo cards from real app screenshots, preserving UI text with first-party visual design generation.'
---

# Play Store UI Anchored Promo

Use this for mobile app listing screenshots, store promo cards, and exact-size feature graphics anchored to real app UI screenshots.

## Workflow

1. Use current project screenshot asset ids. If the user supplies a public screenshot or logo URL, call `run_skill`, then `create_file_by_url`, and continue with the returned asset id.
2. Call `run_skill`, then `read_project_asset` for every screenshot to identify screen purpose and exact visible UI text.
3. Call `run_skill`, then `visual_design_task` for each vertical promo card using the screenshot asset ids as references. Preserve in-screen text verbatim and keep marketing copy minimal.
4. For exact-size feature graphics, include the required size, crop, safe-zone, and layout constraints in the `visual_design_task` prompt. Do not create a separate workspace post-process step.
5. QA the returned generated assets for screenshot fidelity, UI text preservation, aspect ratio, safe zones, and store-policy caveats.

## Tool Rules

- Call `run_skill` immediately before each concrete tool call.
- Allowed concrete tools for this skill: `create_file_by_url`, `read_project_asset`, `visual_design_task`.
- Use project asset ids only. Do not paste raw image URLs into prompts or replies.
- Do not use local code, workspace file rendering, direct upload, publication, or artifact registration tools.

## Output

Return the generated card or feature graphic `assetId` or `artifactRef` values and a short UI-text QA note.
