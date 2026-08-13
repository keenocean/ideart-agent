---
name: 'ads-street-interview-skill'
description: 'Create a canonical Markdown street-interview ad script from researched facts, project references, and first-party document generation.'
---

# Ads Street Interview Skill

Use this for street-interview ad scripts, creator interview scripts, man-on-the-street prompts, testimonial question sets, and short-form ad outlines that need grounded product facts and a polished Markdown script document.

## Workflow

1. Confirm the brand, product or campaign, target audience, interview setting, offer, CTA, and whether the script should feel documentary, comedic, premium, or direct response.
2. Call `run_skill`, then `web_search` for public market, product, or competitor context only when the user asks for research or the claims need outside grounding.
3. Call `run_skill`, then `web_fetch` on selected public pages to extract visible facts, offer details, testimonials, product language, and citation notes. Use only facts from the page or user brief.
4. If the user supplies a public image, document, or media reference URL that must be inspected as a project asset, call `run_skill`, then `create_file_by_url`, and continue with the returned project asset id.
5. Call `run_skill`, then `search_project_assets` to find uploaded brand references, product shots, sample videos, briefs, and prior scripts. Call `run_skill`, then `read_project_asset` for the assets used in the script.
6. Draft the script as a canonical Markdown document: production premise, cold-open hook, interviewer prompts, expected respondent beats, product proof points, b-roll notes, caption hooks, CTA, shot list, claim checklist, and editing notes.
7. Call `run_skill`, then `write_free_doc` with a Markdown filename such as `street_interview_ad_script.md`. Require a client-ready script document with source-fact notes and placeholders for any unverified claim.
8. QA the document for claim accuracy, audience fit, natural spoken phrasing, CTA specificity, and whether any required product or brand reference is missing.

## Tool Rules

- Call `run_skill` immediately before each concrete tool call.
- Allowed concrete tools for this skill: `create_file_by_url`, `web_search`, `web_fetch`, `search_project_assets`, `read_project_asset`, `write_free_doc`.
- Use project asset ids and artifact references for all references and outputs.
- The final Markdown document from `write_free_doc` is the deliverable project artifact.

## Output

Return the script document `assetId` or `artifactRef`, the key product facts used, source page notes when research was used, project asset ids referenced, and any placeholders requiring approval.
