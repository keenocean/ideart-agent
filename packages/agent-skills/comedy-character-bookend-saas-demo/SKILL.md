---
name: 'comedy-character-bookend-saas-demo'
description: 'Create a long-form comedy-character SaaS demo spot with generated character scenes, dashboard stills, narration, music, and final composition.'
---

# Comedy Character Bookend SaaS Demo

Use this for a broad comedy character opening and closing a credible SaaS or prosumer software demo reel.

## Workflow

1. Confirm the product, dashboard screenshots, logo, brand colors, narrator voice direction, CTA, and which gag is acceptable for the brand. If a public logo or screenshot URL is supplied, call `run_skill`, then `create_file_by_url`.
2. Call `run_skill`, then `search_project_assets` to find dashboard screenshots, logo assets, and any product references. Call `run_skill`, then `read_project_asset` for the assets used in the demo.
3. Call `run_skill`, then `visual_design_task` for brand cards, demo stills, or character keyframes that are needed before motion.
4. Call `run_skill`, then `video_generation` for the opening character scene, closing payoff scene, and any motion inserts. Generated videos are already project assets.
5. Call `run_skill`, then `speech_generation` for narration, and optionally `music_generation` for a low-volume bed.
6. Call `run_skill`, then `compose_video` with generated videos, dashboard still scenes, narration/music assets, overlays, CTA card, and final aspect ratio.

## Tool Rules

- Call `run_skill` immediately before each concrete tool call.
- Allowed concrete tools for this skill: `create_file_by_url`, `search_project_assets`, `read_project_asset`, `visual_design_task`, `video_generation`, `speech_generation`, `music_generation`, `compose_video`.
- Use project asset ids only. Generated speech, music, images, videos, and compositions are already project artifacts.

## Output

Return the final `assetId` or `artifactRef`, the generated scene asset ids, narration/music assets, and any brand-safety caveats.
