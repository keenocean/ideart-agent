---
name: static-ad-concept-generator
description: Generate grounded static advertising concepts with angles, headlines, visual direction, CTA, audience fit, and platform variants. Use for ad ideation, creative briefs, campaign angles, social ad concepts, display concepts, or producing a selected static creative.
---

# Static Ad Concept Generator

Develop a varied concept set before producing an image. Favor distinct strategic angles over superficial headline swaps.

## Inputs and defaults

Accept a product URL or brief, target audience, platform, objective, offer, brand constraints, and desired concept count. Default to six concepts across at least four different angles. If a URL is supplied, use it as evidence rather than treating the page copy as automatically approved ad copy.

## Runtime contract

When selected without an active execution receipt, call `run_skill` for `static-ad-concept-generator` once before the first concrete UGCmind tool. Allowed tools are `web_search`, `web_fetch`, `create_file_by_url`, `visual_design_task`, and `write_free_doc`.

## Workflow

1. If a product URL is provided, call `web_fetch` on the exact page.
2. Build a claims allowlist containing only user-provided or page-supported facts. Keep unsupported prices, statistics, certifications, health outcomes, comparisons, scarcity, and guarantees out of the concept or mark them as approval placeholders.
3. Define the audience tension, desired after-state, primary objection, proof available, platform, and action.
4. Before stating exact dimensions, duration, card count, text limits, safe zones, or supported placements, use `web_search` to locate current official platform documentation and `web_fetch` to inspect the official page. If verification is unavailable, label those values as working assumptions rather than claiming platform compliance.
5. Generate distinct concepts. Each must include angle, headline, support line, visual direction, CTA, audience, platform placement, and claim notes.
6. Use a mix of problem/solution, transformation, mechanism, demonstration, social proof, comparison, objection handling, identity, curiosity, and offer-led angles as evidence permits.
7. Rank the concepts by strategic diversity and evidence strength. Recommend an initial test set that changes one major variable at a time.
8. If the user asks to produce a chosen image, materialize any direct public product image with `create_file_by_url`, then call `visual_design_task` with the approved concept and project asset id. Do not pass the product page itself as an image.
9. If a durable brief is requested, call `write_free_doc`. End the turn after a queued or running response; do not submit duplicates.

Read `references/format-patterns.md` for durable layout and adaptation patterns. It is not a source of current platform specifications.

## Concept format

For each concept, return:

```text
Concept: [short name]
Angle: [why the audience should care]
Headline: [scroll-stopping claim or idea]
Support: [one clarifying line]
Visual: [composition, subject, product placement, proof device]
CTA: [specific next action]
Audience: [who and which tension]
Placement: [platform, aspect ratio, safe-zone notes]
Claim notes: [source, placeholder, or approval needed]
Test variable: [hook, visual, proof, offer, or CTA]
```

## Production rules

- One dominant idea per creative.
- The product or outcome must be legible at feed speed.
- Copy hierarchy should survive mobile viewing and platform safe zones.
- Keep legal qualifiers visible when a claim requires them.
- Never fake reviews, ratings, customer counts, awards, urgency, or before/after results.
- Do not generate all concepts by merely changing colors or synonyms.

Return the concept table first, then the recommended first three tests, claim risks, and any generated `assetId` or document `artifactRef`.
