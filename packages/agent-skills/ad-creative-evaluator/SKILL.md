---
name: ad-creative-evaluator
description: Evaluate a video ad with a structured multi-perspective rubric covering hook, message, visuals, audience fit, pacing, CTA, emotional resonance, and sound-off comprehension. Use when a user asks to score, review, diagnose, compare, or improve an ad creative.
---

# Ad Creative Evaluator

Evaluate the supplied ad as evidence, not as a concept brief. Return a scored diagnosis with a short, prioritized revision plan.

## Inputs

Accept a project video asset, a public video URL, or user-provided frames plus transcript. Also use any supplied platform, audience, offer, product context, campaign objective, or performance data. State important missing context instead of inventing it.

If the input is a public URL, materialize it as a project asset before analysis. Never pass an arbitrary URL to media-analysis tools.

## Runtime contract

When this skill is selected but no execution receipt is active, call `run_skill` for `ad-creative-evaluator` once before the first concrete UGCmind tool. Reuse that receipt for the workflow.

Allowed concrete UGCmind tools are `create_file_by_url`, `transcribe_media`,
and `write_free_doc`. Do not substitute an unapproved provider.

Analyze visuals with the host's native video understanding when available. As
a last local-only fallback, run `scripts/extract_video.py` against a video file
the user supplied to that host and inspect the extracted frames; the script
requires Python, `opencv-python`, and Pillow. Never send a private project URL
or signed URL to the script, and never install dependencies without the user's
environment policy allowing it. If neither route is available, complete the
audio and transcript analysis and clearly mark visual scores as unassessed.

## Workflow

1. If needed, call `create_file_by_url` and continue with the returned project asset id.
2. Inspect the video natively or with the local frame extractor. Capture duration, aspect ratio, scene boundaries, first-frame quality, pacing, visual continuity, text density, product visibility, and CTA ending.
3. Call `transcribe_media` for dialogue, voiceover, and caption timing. If the ad has no speech, record that rather than fabricating a transcript.
4. Score the ad against the rubric below using observable evidence and timestamps.
5. Review it through three lenses: performance marketer, creative director, and target consumer.
6. Synthesize the evidence into the report format below.
7. When the user asks for a durable deliverable, call `write_free_doc` with the completed Markdown report. If it returns queued or running, end the turn without resubmitting.

Read these references when more detail is needed:

- `references/rubric.md` for scoring anchors.
- `references/personas.md` for the three review lenses.
- `references/evaluation-template.md` for the expanded report structure.

## Scoring rubric

Score each dimension from 0 to 10:

1. Hook effectiveness: first three seconds create a reason to continue.
2. Message clarity: product, audience, and value are understandable.
3. Visual quality: framing, continuity, legibility, and production support the message.
4. Audience targeting: language, situation, proof, and objections fit the intended viewer.
5. Pacing and structure: scenes advance the argument without dead time or overload.
6. CTA strength: next action is specific, visible, credible, and well timed.
7. Emotional resonance: the creative earns attention, trust, desire, or relief.
8. Sound-off comprehension: the ad remains understandable through visuals and captions.

Calculate a fully assessed overall score as the unweighted arithmetic mean of the eight scores. Do not apply the legacy weights from earlier versions of the rubric. Use 0 only when observable evidence shows that a dimension is entirely absent or unusable; missing evidence is unassessed, not zero. If any dimension is unassessed, report the mean of the assessed dimensions as provisional and name every excluded dimension instead of presenting a comparable overall score. Do not add false precision from estimated business outcomes. If real metrics are supplied, discuss them separately from the creative score.

## Output

Return:

- overall score, or clearly labeled provisional score, and one-sentence verdict;
- an eight-row scorecard with evidence and timestamps;
- the three persona verdicts;
- three strengths worth preserving;
- three highest-leverage fixes, ordered by impact;
- a concrete revised hook, body beat, and CTA;
- uncertainty and missing inputs;
- document `assetId` or `artifactRef` when a report was persisted.

Never claim that a score guarantees media performance. Separate factual defects, strategic judgments, and hypotheses that require an A/B test.
