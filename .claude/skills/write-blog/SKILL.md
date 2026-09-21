---
name: write-blog
description: "Draft a high-quality, SEO-targeted long-form article (blog post / guide) with AI the right way: research the SERP, collect product-specific material, feed it all to the model, self-score the draft, then strip machine tells. Use when the user asks to write, draft, rewrite, or improve a blog post, article, guide, how-to, comparison, or listicle for a public page — '写一篇博客/文章/guide', 'write a post about…', 'draft an article targeting <keyword>', 'this reads like AI, fix it'. This skill owns the writing; hand routing, listing, sitemap, and indexing decisions to /marketing-seo."
argument-hint: "<target keyword or topic> [--slug <slug>] [--type how-to|what-is|list|vs|question]"
user-invocable: true
---

# Write Blog — $ARGUMENTS

Produce one publishable article for one core keyword. The article must read as
if written by someone who has actually used the product, and must pass the
quantitative bar below before it is handed off.

The governing principle, from the team SOP in `docs/让 AI 写出高质量blog文章.md`:

> **Prompts cannot rescue mediocre AI writing. Quality is decided by material
> (what you feed the model), the model, and editorial judgement. The prompt is
> seasoning.**

So most of this skill's work happens *before* any prose is generated. An empty
prompt produces an empty article. Never skip straight to drafting.

## Required reading

1. `docs/让 AI 写出高质量blog文章.md` — the full 10-section SOP this skill implements.
2. `docs/seo-blog-instruct-doc.md` — article types, structure, link rules, schema, and the 20-point self-check in section 九.
3. [references/machine-tells.md](references/machine-tells.md) — the six machine-tell patterns and how to remove each.
4. [assets/draft-prompt.md](assets/draft-prompt.md) — the feed-and-score prompt template used in Step 3.

## Hard limits (do not negotiate these with yourself)

| Metric | Requirement |
| --- | --- |
| Core keyword | Exactly one per article. One article per keyword. |
| Keyword difficulty | Prefer KD < 40 with verified search volume. Do not target KD ≥ 60 with a new article. |
| Body length (English) | **800 words minimum, 800–3000 words.** Under 800 is thin and does not ship. Over 3000 means the page is carrying more than one topic: split it. Within that range, follow the per-type table in `docs/seo-blog-instruct-doc.md` section 4.4. |
| Keyword density | 3%–5% of body text is the nominal band. The practical pass/fail test, from the SOP, is that the core keyword sits in the **top 3 of the 2-word density table** (what the AITDK extension shows). `pnpm guides:check-quality` measures both. |
| Keyword placement | In Title, H1, the first 100 words, the first H2, the last H2 section, the Description, and at least one image alt. |
| Title | ≤ 60 characters, keyword first, brand last. |
| Description | 150–160 characters, keyword once, states what the reader gets. |
| H1 | Exactly one, contains the full keyword, phrased consistently with Title but not a copy. |
| Headings | H2s use long-tail variants or the questions users actually type. At least two levels (H2 + H3); a single flat level is no skeleton. |
| Outbound references | 8 or more real, checkable sources. Never fabricate a citation or a DOI. |
| Images | 1–2, keyword-bearing filename and alt, explicit width/height. |
| Internal links | Keyword anchor text, one-way blog → tool page, the tool page is the article's destination. |
| Paragraphs | No paragraph over 4–5 lines. Vary paragraph length deliberately. |
| Vocabulary | Plain words a five-year-old could follow. No officialese, no translated-sounding phrasing. |
| Product-only material | At least two concrete details only this product/team could supply (a measurement, a screenshot, a real failure, a number from our own data). |

## Workflow

### Step 0 — Decide whether this article should exist (human-owned decision, but you do the legwork)

Answer three questions and write the answers down before anything else:

1. **What is the core keyword?** No keyword, no article. If the user gave a topic rather than a keyword, derive 2–3 candidate keywords and check them: real search volume, KD in range, not an invented zero-volume term. If you cannot verify volume from available tools, say so explicitly and pick the candidate with the strongest evidence rather than inventing numbers.
2. **What does the searcher want?** Decide the article type from intent: how-to, what-is, best/top list, X vs Y, or question answer. These are the only five allowed types. No company news, no product updates, no keyword-less posts.
3. **Where does this article send the reader?** Name the tool/product page that is the internal-link destination and the one CTA.

Also check the existing site: search `product/marketing/guides/` and `docs/marketing-pages-seo-map.md` for the keyword. If a page already owns it, this is an update, not a new article. Do not create a second page for a keyword that has one.

### Step 1 — Collect the three kinds of material the model cannot invent

Assemble a material file in the scratchpad before drafting. It must contain:

**① SERP breakdown.** Search the core keyword and read the current top 10 (use web tools when available; otherwise ask the user to paste the top results). For each result record: its angle, what it covers, what it gets wrong or leaves out, and whether it is beatable. Then write the gap statement in one sentence: "Everyone covers A and B; nobody covers C." C is the article's reason to exist. Specific gap types to look for:

- Stale answers (old data, old UI, old pricing) → we supply the current version.
- Prose-only pages with no operable steps → we supply steps and screenshots.
- Incomplete H2 coverage, a common sub-question missing → we write that sub-question as a full section.

**② Real user scenarios.** Pull from the product, not imagination: where users get stuck, what they search, how they resolved it. In this repo, sources include the tool pages under `product/catalog/`, existing guides, report copy in `product/messages/en.json`, and anything the user tells you. Frame each as a question the user would actually type.

**③ Product-only evidence.** Numbers from our own measurements, a real screenshot, a documented limitation, a comparison we actually ran. This is the trust anchor. An article with none of this reads as AI to a human reader regardless of prose quality. If none exists, ask the user for one concrete piece rather than writing around the gap. A single real detail beats three paragraphs of hedging.

Optional structural borrowing: if the user names an article they admire, extract its heading skeleton only, never its wording, and use the skeleton as a layout reference filled with our material.

Do not proceed until this checklist is fully true:

```
□ I have read every top-10 result for this keyword and written down what they miss.
□ I have at least one piece of material only this product/team could supply.
□ I have the user's real questions for this scenario, not questions I invented.
```

### Step 2 — Outline

Build the heading tree before writing prose, using the structure template:

```
Title:  core keyword + benefit
Intro (first 100 words): scenario → keyword appears → promise of what this solves
H2: problem / scenario breakdown            (keyword in this first H2)
  H3: step one (long-tail variant)
  H3: step two
H2: comparison / choice of approach         (internal-link destination lives here)
H2: FAQ (2–4 H3s, each a real search question; feeds FAQPage schema)
H2: conclusion + CTA                        (keyword again, links to the tool page)
```

Adapt to article type per `docs/seo-blog-instruct-doc.md` (a list article's H2s are the candidates; a vs article's H2s are the comparison axes). Every H2 that has its own page on the site gets a keyword-anchored internal link.

### Step 3 — Generate the first draft with full material

Fill [assets/draft-prompt.md](assets/draft-prompt.md) with the keyword, article type, intent, the gap statement, the user scenarios, the product evidence, the outline, and the link targets. The model is the "blog editor who writes in words a five-year-old can read". The draft must be produced from the material, not from a keyword alone.

Write the body in the voice rules from `references/machine-tells.md` from the start; it is cheaper than removing tells afterwards.

### Step 4 — Self-score, then revise

Have the model (yourself) score the draft on each dimension, give a reason for every score below full marks, then output an improved version. Dimensions: readability, word count, title, heading structure, keyword coverage and density, originality (does the gap section actually deliver C?), grammar and flow. Score, explain, revise. Do not stop at one pass.

Measure, do not estimate. Once the article is in its guide JSON (Step 6), run the gate:

```bash
pnpm guides:check-quality <slug>        # one guide
pnpm guides:check-quality               # all guides
pnpm guides:check-quality --json <slug> # numbers for scripting
# where the pnpm alias is not registered: node scripts/check-guide-quality.mjs [slug]
```

`scripts/check-guide-quality.mjs` reads `seo.keyword` from the guide and fails on: body outside 800–3000 words, keyword missing from Title / H1 / Description / first 100 words / first heading / last section / figure alt, keyword outside the top 3 of the 2-word density table, fewer than 8 https references, first related link not a `/tools/` page, Title over 60 chars, Description outside 140–160 chars, or any banned machine-tell phrase. Exact-phrase density outside 3–5% is a warning; for a three- or four-word keyword the bigram rank is the criterion that matters, so do not stuff the full phrase to silence the warning.

For a draft that is not in guide JSON yet, count with a quick script over the assembled body; the same thresholds apply. If the count is under 800, revise; do not pad with filler or stuff the keyword.

### Step 5 — Remove machine tells (never skip)

Read the full draft against the six tells in [references/machine-tells.md](references/machine-tells.md), one by one, and edit:

1. Opening boilerplate ("In today's digital age…") → cut, open on the scenario.
2. Filler connectives (Furthermore, Moreover, It is worth noting) → cut; two in one paragraph means rewrite the paragraph.
3. Forced balance ("On one hand… on the other hand") → state the conclusion.
4. Paragraph-closing summaries ("What this means is…") → cut; let the fact end the paragraph.
5. Absence of specifics → insert the product-only evidence from Step 1 ③.
6. Uniform paragraph length → break the rhythm: some one-line paragraphs, some three-line, the occasional long one.

Also strip the banned words listed there (delve, moreover, in conclusion, in today's digital landscape, and the rest).

Then a human reads it. State clearly in the hand-off that the draft still requires a human read-through before it is published; that step belongs to the user and is not optional.

### Step 6 — Package for this repository

Long-form public articles in this project are guides at `product/marketing/guides/<slug>.<locale>.json`, typed by `src/content/guides/types.ts` (`GuidePageContent`). Map the article onto that shape:

- `seo.keyword` — the one core keyword, exactly as the page targets it. The quality gate measures everything against this field.
- `seo.title` / `seo.description` — the Title and Description from the limits table.
- `hero.title` — the H1. `hero.description` — the first-100-words hook with the keyword.
- `directAnswer` — the direct answer to the search query, 60–120 words.
- `keyTakeaway` — one sentence.
- `sections[]` — the H2 sections; each `heading` is the H2 text, `body` is that section's prose.
- `comparison` — the choice-of-approach table (three columns).
- `risks.items` — limitations and caveats; this is where honesty about what the product cannot do lives.
- `figure` — one image with a keyword-bearing alt and true pixel dimensions; upload via `pnpm marketing:upload-asset` and register it in `product/marketing/assets.json`.
- `references.items` — the 8+ outbound sources, each with title, publisher, year, and a URL you have actually verified resolves.
- `related[]` — 2–4 internal links; the first is the tool page this article funnels to.
- `indexing` — start at `"noindex"`. Flipping to `"index"` is /marketing-seo's release-gate decision.

If the article belongs elsewhere (a route, MDX, a different content source), follow that surface's contract instead; the writing rules do not change.

Then run:

```bash
node scripts/check-guide-quality.mjs <slug>   # the measurable half of the checklist; must pass
pnpm marketing:build-content-release          # schema validation of the guide JSON
pnpm product:validate                         # the product-pack checks
```

In a repository whose long-form content lives somewhere other than `product/marketing/guides/`, apply the same thresholds by hand or adapt the script's `bodyParts()` to that shape; the rules do not change with the storage format.

Hand the page lifecycle (directory listing entry in `product/marketing/directories/guides/`, SEO map entry, sitemap, JSON-LD, canonical, release gate) to `/marketing-seo`. This skill ends when the content file validates and the self-check below passes.

## Pre-hand-off self-check

Run the 20-point table in `docs/seo-blog-instruct-doc.md` section 九, plus these from the SOP:

```
□ One core keyword; no other page on the site owns it
□ Keyword in Title / H1 / first 100 words / first H2 / last H2 / Description / an image alt
□ Body 800–3000 words, measured, not estimated
□ Keyword in the top 3 of the 2-word density table (`pnpm guides:check-quality`); exact density 3–5% where the keyword is two words
□ Title ≤ 60 chars, Description 150–160 chars
□ H2 → H3 tree; H2s are long-tail or real user questions
□ 8+ outbound references, every URL checked
□ 1–2 images with keyword alt and width/height
□ Internal links: keyword anchors, blog → tool page only, tool page is the CTA destination
□ ≥ 2 product-only concrete details in the body
□ All six machine tells checked and removed; banned words absent
□ No fabricated statistics, ratings, citations, or product capabilities
□ indexing: "noindex" until /marketing-seo clears it
□ Explicit note to the user: human read-through still required before publish
```

## Red lines

- **Do not batch.** One article per invocation. If asked to produce many articles from a list of titles, a competitor sitemap, or a keyword dump, refuse the batch and offer to do one properly. Publishing cadence for a new site is 1 per day, 3–5 per week at most; "automatic page generation counts as batch" and gets the whole domain filtered.
- **Do not fabricate.** No invented numbers, study results, user quotes, review counts, ratings, or claims about what the product can do. Product capability comes from `src/config/catalog/` and the tool pages, not from the article.
- **Do not hide content** in collapsed or off-screen blocks to catch more keywords, and do not pack keyword variants into one page. One keyword, one page, listed openly in the headings.
- **Do not link from a tool page to the blog.** Links go one way.
- **Do not skip the human read.** The AI self-score is layer two; the human read-through is layer three and it is the one that removes the machine feel. Say so in the hand-off every time.
