---
name: video-ad-recreate
description: Reverse-engineer a reference video ad into a reusable creative template and produce an original ad that preserves strategy without copying protected expression. Use for ad breakdowns, hook and pacing analysis, storyboards, competitor creative analysis, or recreating an ad format for another product.
---

# Video Ad Recreate

Separate the reference ad's reusable strategy from its protected expression, brand identity, and personal likeness. Produce an original creative, not a frame-for-frame clone.

## Runtime contract

When selected without an active execution receipt, call `run_skill` for `video-ad-recreate` once before the first concrete UGCmind tool. Allowed tools are `create_file_by_url`, `transcribe_media`, `write_free_doc`, `prepare_reference_asset`, `visual_design_task`, `video_generation`, and `music_generation`.

For a locally attached reference, use native video understanding or run
`scripts/extract_frames.py` locally and inspect the resulting frames. The
script requires Python, `opencv-python`, and Pillow. Never pass a private
project URL or signed URL into the local fallback. If visual inspection is not
available, deliver a transcript-led analysis and label unverified visual
details instead of inventing them.

## Stage 1: Deconstruct the reference

1. Materialize a public reference URL with `create_file_by_url`; otherwise use the supplied project video asset.
2. Inspect the reference natively or with the local frame extractor for duration, aspect ratio, scenes, shot sizes, product visibility, transitions, pacing, text treatment, and visual quality.
3. Call `transcribe_media` for spoken copy and caption timing.
4. Classify the format using `references/ad-formats.md` and the opening using `references/hook-types.md`.
5. Map every scene: timestamp, visual, audio, on-screen text, camera, purpose, and transition.
6. Extract the reusable strategy: hook mechanism, script pattern, proof order, pacing curve, visual grammar, and CTA role.
7. Identify elements that must not be copied: exact wording, distinctive scenes, copyrighted music, logos, trade dress, personal likeness, proprietary footage, and unsupported claims.

When requested, persist the analysis with `write_free_doc` using `references/output-template.md`. End the turn after a queued or running response.

## Stage 2: Design the original adaptation

Ground the new product from user-supplied facts or project assets. Create a substitution map:

- original hook function → new original hook;
- original problem/proof structure → product-specific evidence;
- original scene purpose → newly staged scene;
- original pacing → comparable energy with different timing and visuals;
- original CTA role → approved new CTA.

Do not reproduce a recognizable sequence of exact frames. Do not impersonate the reference presenter. Use authorized project assets only.

## Stage 3: Produce

1. Call `prepare_reference_asset` for approved product or character assets when consistency constraints are useful.
2. Use `visual_design_task` for a controlled first frame or composited reference when required.
3. Call `video_generation` for one complete original clip when possible. If the adaptation requires multiple clips, generate only the minimum required set.
4. Use `music_generation` only for original music when audio is not already generated and music materially helps.
5. Return a precise edit decision list for any multi-clip assembly, captions,
   overlays, and audio. Do not claim that a final composite exists unless the
   host independently performed and verified that edit.
6. If any generation or composition returns queued or running, end the turn without submitting duplicates.

## Output

Return:

- reference-ad overview and reusable template;
- scene and transcript breakdown;
- copied-versus-original boundary decisions;
- new product substitution map and storyboard;
- claim and rights risks;
- production task state;
- plan document, video `assetId`, or `artifactRef` when available.

If the user requests analysis only, stop after Stage 1. If the product evidence or usage rights are insufficient, deliver the plan and list what is needed before production.
