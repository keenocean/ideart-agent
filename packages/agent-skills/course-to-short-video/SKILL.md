---
name: 'course-to-short-video'
description: 'Turn a course or lesson video project asset into a short 9:16 highlight clip with transcript-aware trims, captions, optional music, and an end card.'
---

# Course to Short Video

Turn a full course or lesson media asset into a short vertical highlight clip for social sharing. Use this when the user supplies a current project video or audio asset id and asks for a concise clip, highlight, teaser, reel, or short.

The workflow is asset-first. Use current project asset ids only. If the user gives a public media URL, call `run_skill`, then `create_file_by_url` to bring it into the project before any media analysis. Do not pass public URLs into media generation, transcription, extraction, or composition tools.

## Inputs

- Source course video or audio project asset id: required.
- Course title, instructor name, brand line, or end-card wording: optional. If the end-card text matters and the source metadata is not clear, ask the user for those exact words before rendering.
- Target length: default 20-30 seconds.
- Aspect ratio: default 9:16.
- Caption preference, music preference, or end-card preference: optional.

## Workflow

1. Confirm the source is a project asset id. For a public media URL, call `run_skill`, then `create_file_by_url`, and continue only with the returned asset id.
2. Call `run_skill`, then `analyze_video` for structural facts: duration, aspect ratio, scene boundaries, quiet sections, frame samples, and quality constraints.
3. Call `run_skill`, then `transcribe_media` on the same source asset. Use timed words and segments to identify complete thoughts.
4. Choose the short-video hook with model reasoning from the transcript and structural facts. Prefer complete ideas with clear emotional, educational, or surprising value. Avoid clipping mid-sentence unless the user explicitly asks for a montage.
5. Build a scene plan from one source asset:
   - Use multiple `compose_video` scenes with trim start/end timestamps for video highlights.
   - Use `extract_audio` only when a separate narration, sound bite, or music-free audio asset is needed.
   - Keep scene durations, transitions, caption behavior, and overlay copy explicit.
6. Optional music: call `run_skill`, then `music_generation` for a light background bed matching the hook and total duration. Keep music lower than speech.
7. Call `run_skill`, then `compose_video`:
   - output aspect ratio 9:16;
   - source scenes trimmed from the project asset id;
   - per-scene or global captions from transcript timing;
   - optional hook overlay, lower-third, music bed, and end card;
   - final output is automatically persisted as a project asset by the tool.
8. QA before replying: final duration, 9:16 framing, complete thought at the close, readable captions, no important face/text cropped, speech intelligible over music, and end-card wording exact.

## Tool Rules

- Call `run_skill` immediately before each concrete tool call.
- Allowed concrete tools for this skill: `create_file_by_url`, `analyze_video`, `transcribe_media`, `extract_audio`, `music_generation`, `compose_video`.
- Use project asset ids throughout. Tool outputs that return an `assetId` or `artifactRef` are already project artifacts.
- Do not introduce unverified course or instructor names. Ask when exact public-facing wording is missing.

## Output

Reply with the final project asset id or artifact reference, the selected source timestamp range, the hook rationale, and any QA caveats that remain.
