---
name: 'ugc-showcase'
description: 'Create product-first UGC showcase videos where the product carries the story, with generated boards, generated clips, per-scene audio extraction, captions, and final assembly.'
---

# UGC Showcase

Use this for product demos, how-it-works videos, appliance/tool/device demos, before-after product stories, or faceless product voiceover ads.

## Media Segment Workflow

1. Use current project asset ids for all supplied media and references. If the user supplies a public media URL, call `run_skill`, then `create_file_by_url`, and continue only with the returned asset id.
2. Call `run_skill`, then `visual_design_task` to prepare board, storyboard, or keyframe assets when the brief requires generated stills.
3. Call `run_skill`, then `video_generation` for each scene or board clip; the generated output is already a project asset.
4. For every generated clip that needs frame-aligned speech or captions, call `run_skill`, then `extract_audio` once for that one clip with a single output. Repeat this per scene. Do not describe one call as producing multiple files.
5. Call `run_skill`, then `transcribe_media` on each extracted audio asset to get timed words or caption segments for that same scene.
6. Call `run_skill`, then `compose_video` with one scene per generated clip, using scene asset ids, per-scene audio asset ids, and caption artifacts from transcription. Add overlays or caption settings only when they are part of the brief.
7. Return the final `assetId` or `artifactRef`; generated and composed outputs are already persisted by their tools.

## Tool Rules

- Call `run_skill` immediately before each concrete tool call.
- Allowed concrete tools for this skill: `create_file_by_url`, `read_project_asset`, `visual_design_task`, `video_generation`, `extract_audio`, `transcribe_media`, `compose_video`.
- Use project asset ids only. Public URLs must first become project assets through `create_file_by_url`.
- Persona, character, product, and voice constraints must come from project assets or user-supplied text in the current request.

## Output

Return the final `assetId` or `artifactRef`, the generated scene asset ids, the extracted audio assets, caption artifacts, and any QA caveats.
