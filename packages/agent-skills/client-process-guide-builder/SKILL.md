---
name: 'client-process-guide-builder'
description: 'Create a client-facing process transparency guide as a canonical Markdown project document using the first-party document generation tool.'
---

# Client Process Guide Builder

Use this for agencies, studios, consultants, and service teams that need a polished customer-facing guide explaining how their work is produced: pipeline explainers, onboarding guides, process transparency documents, behind-the-scenes service documentation, or client-readiness checklists.

The deliverable source of truth is a canonical Markdown project document generated with `write_free_doc`. Do not promise a bundled HTML/PDF package unless the current workspace has an explicit supported export step available outside this skill. If the user needs another format later, treat the Markdown document as the approved source and use the platform's supported export path.

## Workflow

1. Gather only missing inputs in one concise question: agency or studio display name, service or pipeline to document, target client audience, brand accent preference, and any exact claims or specifications that must appear.
2. Draft the guide structure before generation: title, subtitle, provenance note, overview, what the client needs to provide, production stages, production summary, quality controls, output specifications, FAQ, glossary, and close.
3. Call `run_skill`, then `write_free_doc` with a Markdown filename such as `client_process_guide.md`. The task must ask for a client-facing process guide, not an internal SOP.
4. In the document request, require concrete numbers where the brief supports them: stage counts, review windows, file specs, acceptance checks, retry limits, platform dimensions, or handoff timings. If the user did not provide numbers, mark them as placeholders instead of inventing them.
5. Keep the voice confident, plain-language, first-person plural, and specific. Avoid buzzwords and avoid decorative imagery requirements.
6. Include a Report QA / Accuracy Review section near the top with PASS and ENHANCED verdicts, unless the user has explicitly rejected that section after being told why it is useful.
7. Return the generated document `assetId` or `artifactRef`; the document tool persists the project artifact automatically.

## Tool Rules

- Call `run_skill` immediately before `write_free_doc`.
- Allowed concrete tools for this skill: `write_free_doc`.
- Use project asset ids for uploaded briefs, logos, examples, or reference docs when the document task needs them.
- Do not call or mention asset registration tools. Do not invent local filesystem paths or external identifiers.

## Output

Return the project document `assetId` or `artifactRef`, the guide title, the service pipeline covered, and any placeholders that still need client approval.
