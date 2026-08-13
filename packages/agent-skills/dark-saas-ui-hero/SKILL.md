---
name: 'dark-saas-ui-hero'
description: 'Create a dark SaaS hero media sequence from project assets with first-party still generation, motion generation, optional music, and final composition.'
---

# Dark SaaS UI Hero

Use this for premium dark SaaS hero visuals, dashboard-led product hero loops, website header media, product UI motion snippets, and launch-page demo clips.

## Workflow

1. Confirm the product name, target audience, hero message, aspect ratio, duration, dashboard or product UI project asset ids, brand colors, CTA copy, and whether music is wanted.
2. Call `run_skill`, then `search_project_assets` to find screenshots, logos, brand references, prior product imagery, and style references. Call `run_skill`, then `read_project_asset` for each selected asset before prompting.
3. Build a 3-5 beat plan: dashboard reveal, metric or workflow highlight, product credibility moment, CTA or brand close, and optional abstract transition still.
4. Call `run_skill`, then `visual_design_task` for the still frames, dashboard hero cards, background plates, and product UI compositions. Use project asset ids as references and keep UI text faithful to supplied screenshots.
5. Call `run_skill`, then `video_generation` for the hero motion clips. Motion should be restrained, premium, legible, and safe for a webpage hero crop.
6. Optional music: call `run_skill`, then `music_generation` for a subtle instrumental bed that can sit under a website hero or launch video.
7. Call `run_skill`, then `compose_video` with generated clip asset ids, optional music asset id, exact durations, crop-safe overlays, CTA card if requested, and final aspect ratio. The composed output is automatically persisted as a project asset.
8. QA the result for dashboard fidelity, readable UI text, crop safety, contrast, CTA accuracy, and no unsupported product claims.

## Tool Rules

- Call `run_skill` immediately before each concrete tool call.
- Allowed concrete tools for this skill: `search_project_assets`, `read_project_asset`, `visual_design_task`, `video_generation`, `music_generation`, `compose_video`.
- Use project asset ids and artifact references for every input and output.
- Generated stills, motion clips, music, and final compositions are returned as project assets.

## Output

Return the final `assetId` or `artifactRef`, the hero beat plan, referenced project asset ids, generated still and clip asset ids, optional music asset id, overlay copy, and crop or UI-fidelity caveats.
