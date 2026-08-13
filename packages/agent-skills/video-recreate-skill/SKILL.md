---
name: 'video-recreate-skill'
description: 'Analyze an authorized reference video project asset and build a first-party recreation plan plus generated assets, scene videos, captions, music, and final composition.'
---

# Video Recreation Workflow

Analyze an authorized reference video and create a new video that follows its structure, pacing, caption rhythm, and production approach without copying protected brand identity, impersonating real people, or making a frame-for-frame duplicate. Use this when the user supplies a current project reference video asset id and asks to recreate, remake, make a similar ad, write the plan, generate the scenes, or assemble the final.

This skill supports single-stage requests. If the user asks for only the plan, only deliver the plan. If the user asks for later stages, verify the required project assets and plan details first.

## Inputs

- Reference video project asset id: required.
- Product, brand, offer, audience, or replacement subject: optional, but required before generating a subject-swapped final.
- Product images, character references, style references, voice references, or scene assets: optional project asset ids.
- Public media or product URL: optional. Call `run_skill`, then `create_file_by_url` for media that must become a project asset before use.

## Stage 1: Analyze and Plan

1. Confirm a reference video project asset id is present. For a public video URL, call `run_skill`, then `create_file_by_url`; continue only with the returned project asset id.
2. Call `run_skill`, then `analyze_video` for structural facts: duration, aspect ratio, scene cuts, frame samples, silence, pacing, and technical constraints.
3. Call `run_skill`, then `transcribe_media` for timed speech and caption-ready segments.
4. Write a markdown plan with:
   - reference summary: duration, aspect ratio, scene count, average scene length, caption style, audio style, CTA pattern;
   - what should change: new product, new subject, new brand-safe wording, and user overrides;
   - scene-by-scene plan: duration, visual intent, motion, dialogue or voiceover, overlays, caption behavior, audio notes;
   - required references: character, product, style, voice, background, and scene assets;
   - safety check: no deceptive impersonation, no protected brand mimicry unless the user owns it, and no exact frame-by-frame duplication.
5. Call `run_skill`, then `write_free_doc` with `file_name="video-recreation-plan.md"` to persist the plan as a project artifact.
6. Stop after returning the plan artifact if the user requested a plan-only workflow.

## Stage 2: Prepare References

1. For each supplied or generated reference asset, call `run_skill`, then `prepare_reference_asset` with the correct type: character, product, style, scene, or reference.
2. Preserve user-supplied identity, product, and brand constraints as references. If required references are missing, ask once before generation.

## Stage 3: Generate Replacement Assets

1. Call `run_skill`, then `visual_design_task` for keyframes, product stills, backgrounds, props, title cards, or start frames.
2. Use prepared references when available. Keep prompts faithful to the plan while creating an original, authorized result.
3. QA each generated still against the plan and user references before generating motion.

## Stage 4: Generate Scene Videos

1. Call `run_skill`, then `video_generation` for each planned scene.
2. Each scene prompt should include: scene number, duration, aspect ratio, prepared references, motion beats, dialogue or voiceover timing, camera movement, and what must not change.
3. Do not bake captions or final overlays into scene video prompts unless the user explicitly wants in-image text. Final text belongs in `compose_video`.

## Stage 5: Music, Captions, and Assembly

1. Optional music: call `run_skill`, then `music_generation` for a background bed matching the plan duration and mood.
2. Call `run_skill`, then `compose_video` with generated scene asset ids, transcript-derived captions or planned captions, per-scene overlays, hook overlay, CTA card, music bed, and output aspect ratio.
3. The composed output is automatically persisted as a project asset by `compose_video`.

## Tool Rules

- Call `run_skill` immediately before each concrete tool call.
- Allowed concrete tools for this skill: `create_file_by_url`, `analyze_video`, `transcribe_media`, `write_free_doc`, `prepare_reference_asset`, `visual_design_task`, `video_generation`, `music_generation`, `compose_video`.
- Use project asset ids throughout. Do not pass public URLs into analysis, transcription, generation, reference preparation, or composition tools.
- Do not claim exact recreation. Describe the output as an authorized, original video following the reference structure.

## Output

For plan-only requests, return the markdown plan. For production requests, return the final project asset id or artifact reference, the generated scene asset ids, the reference constraints used, and the QA notes.
