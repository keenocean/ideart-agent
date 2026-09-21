---
name: write-tool-page
description: "Write or rewrite the SEO copy for a public tool page or the homepage: one core keyword, H1 with the tool entry directly under it, a Headings skeleton that lays every sub-topic out in the open, 800–3000 words of body that a crawler can read, FAQ, limits, and references — all fed from product truth, never invented. Use when the user asks to write, draft, rewrite, or improve copy for a tool page, feature page, landing page, or the homepage — '写工具页文案', 'write the copy for /tools/<slug>', 'rewrite the homepage headings', 'this tool page is thin'. This skill owns the words; routing, Catalog registration, sitemap, and index/noindex decisions go to /marketing-seo."
argument-hint: "<tool slug or 'homepage'> [--keyword <core keyword>]"
user-invocable: true
---

# Write Tool Page — $ARGUMENTS

Produce the copy for one tool page (or the homepage) around one core keyword. The
page must satisfy two readers at once: the person who searched the keyword and
wants to use the tool now, and the crawler that cannot operate the tool and can
only read what the page says about it.

Governing docs, read them before writing:

1. `docs/seo-landingpages-instruct-doc.md` — the full spec this skill implements: three foundations, homepage (section 一) and tool page (section 二) rules, general rules (三), internal links (四), JSON-LD (五), page-type decision tree (六), the 18-point self-check (九), common mistakes (十).
2. `docs/让 AI 写出高质量blog文章.md` sections 5 and 8 — feeding the model material instead of prompts, and removing machine tells. Both apply to tool pages exactly as they apply to articles.
3. `docs/marketing-pages-guide.md` section 5.1 (tool page shared structure) and 7.1 (intent brief and publish threshold), when the repository has that file.
4. [../write-blog/references/machine-tells.md](../write-blog/references/machine-tells.md) — the six tells and banned words; shared with the article skill.

## What a tool page is for

A crawler cannot upload a photo, click the button, or read the result. It reads
the HTML. Google believes what the page says first, sends some traffic, and then
watches whether people who arrive stay or bounce back to the results. The body
copy earns the first visit; the tool earns the second. A tool page with no
copy never gets the first visit, and a page with copy before the tool loses the
second. Both halves are required.

## Hard limits

| Metric | Requirement |
| --- | --- |
| Core keyword | Exactly one per page. Semantic variants (same search intent) live on the same page; a different intent is a different page. `face shape detector` and `face shape test` share a page; `face shape` and `attractiveness test` do not. |
| Title | Core keyword first, 1–2 variants joined as a natural sentence, brand last, 50–60 characters. |
| Description | 150–160 characters. Keyword once. One clause on what it does, one on why to click. |
| H1 | Exactly one. Contains the full core keyword. On a tool page the H1 is the tool name; the logo is a `div`. On the homepage the logo is the H1. |
| Layout | H1 → tool entry (form, upload, button) → one sentence of 10–15 words → then the body. The entry is above the fold with no scrolling. Never three paragraphs before the input. |
| Headings | H1 → H2 → H3 tree, never skipping a level. 4–8 H2s, each with at least one H3. Every H2 that has its own page carries a keyword-anchored link to it. H2 text contains a second-level keyword or a question users type. |
| Body | 800–3000 words of real prose in the server-rendered HTML. Tool pages usually land above 1000 because the sub-topics have to be laid out. Under 800 does not ship. Over 3000 means two pages are sharing one URL. |
| Keyword density | 3%–5% nominal. Practical test: the core keyword is in the top 3 of the 2-word density table (AITDK). Achieved through the Headings skeleton, never by stuffing. |
| Images | Every image has a keyword-bearing alt, a meaningful filename, explicit width/height, WebP, lazy loading, 300×300 or larger. Served from R2 per `product/marketing/assets.json`. |
| Internal links | 2–5 per page, keyword anchor text, varied wording. Tool page → homepage and → related tools. Never tool page → blog. |
| FAQ | 4–6 or more real questions, each answered in plain prose; feeds `FAQPage` JSON-LD. |
| References | Outbound citations for every checkable claim, with a real URL. |
| Product truth | Every capability, input limit, output, price, and accuracy statement comes from `src/config/catalog/`, the runtime, or a measurement the team has actually made. Nothing else. |

## Workflow

### Step 0 — Fix the keyword and the page boundary

1. Take the keyword from the user, from `docs/marketing-pages-seo-map.md`, or derive it. Verify it is a term people search (Keyword Planner, Trends, or the live SERP), not an invented product name. An invented term goes in the body as a brand concept, never in Title or H1.
2. Run the page-type decision tree (landing doc section 六): transactional/tool intent → this skill; informational → `/write-blog`; if unclear, look at what ranks on the live SERP and follow the majority page type.
3. Check cannibalisation: `rg -i "<keyword>" product/marketing product/catalog docs/marketing-pages-seo-map.md`. If another page owns this keyword, this is an update to that page or a boundary decision for `/marketing-seo`, not a new page.
4. Write the one-line intent statement: who searches this, what they want to do in the next thirty seconds, and what the page must show first.

### Step 1 — Collect material the model cannot invent

The same rule as articles: prompts cannot rescue writing that has nothing to say. Before drafting, assemble:

- **SERP breakdown.** Read the current top 10 for the keyword. For each: page type, what the tool entry looks like, which H2s they have, what they claim, what they leave out. Write the gap statement: everyone covers A and B, nobody covers C.
- **Product truth.** From `src/config/catalog/tools.ts`, `product/catalog/tools.json`, the runtime, and the existing page JSON: inputs accepted, limits, what runs where (browser vs server), what the output contains, price, refund terms. Also every limitation the product states. Copy these as facts; do not soften or extend them.
- **Team-only evidence.** Measurements (cohort size, ranges, the ratio that barely separates anything), a real screenshot, a documented failure mode, a number from analytics. At least two per page.
- **User questions.** Real questions from support, from the SERP's People Also Ask, from the existing FAQ. Not questions you think sound good.

Stop until you have all four. A tool page written from the keyword alone reads like every other tool page for that keyword, and Google already has ten of those.

### Step 2 — Build the Headings skeleton

Use the tool-page template from the landing doc, adapted to what the material supports:

```
H1: [tool name / core keyword]
[tool entry]
<p>one sentence, 10–15 words, contains the keyword</p>

H2: How to use [tool name]                → H3 per step (3–5)
H2: What [tool name] measures / features  → H3 per feature, each a real capability
H2: How the result is calculated          → the method, the reference data, its size
H2: What is known / research              → cited, honest about gaps
H2: Limits of [tool name]                 → what it cannot do; the medical/identity/judgement denials this product makes
H2: How to get an accurate result         → photo/input tips, each one a measurable effect
H2: [Tool name] FAQ                       → H3 per question, 4–6+
H2: CTA                                   → links to the next step, keyword in the heading
```

Homepage: the same discipline with a different skeleton — H1 is the brand/core keyword, H2s lay out the categories and each links to its inner page, plus Why-use and FAQ. No long-form essay on the homepage; that belongs on inner pages.

Write the skeleton first and check it against the material. An H2 with no material under it gets cut, not padded.

### Step 3 — Draft from the material

Draft each section from the material file, not from general knowledge. Voice rules from the machine-tells reference apply from the first sentence: plain words, short paragraphs, specifics over adjectives, say what the product cannot do. Every claim that could be checked gets a reference entry.

Do not write: accuracy percentages that were not measured, "trusted by N users", ratings, testimonials, "instant", "advanced AI", or any capability the runtime does not have.

### Step 4 — Self-score and revise

Score readability, length, Title, heading tree, keyword coverage, originality (does the C section exist?), grammar. Give a reason for each score below full marks, then revise. Two passes minimum.

Measure, do not estimate: word count of the SSR body, keyword occurrences, 2-word density table. The page JSON below is the input; count across every string a visitor sees.

### Step 5 — Remove machine tells

Read the whole draft against the six tells in the shared reference and the banned-word list. Cut boilerplate openings, filler connectives, forced balance, paragraph-closing summaries; insert the team-only evidence; break uniform paragraph rhythm. Then state in the hand-off that a human read-through is still required before the page goes to `index`.

### Step 6 — Package for this repository

In a ShipAny/TanStack product, tool page copy lives at `product/marketing/tools/<entityId>/<locale>.json` under `content`, with `template` selecting the Block variant (see `src/blocks/tool-detail-variants.tsx`). In a repository with its own tool-page engine (for example a `generate-tool-page` skill), that engine's content contract wins for storage; the writing rules above still apply. Map the skeleton onto the existing keys rather than inventing new ones; the schema is validated at build time:

- `seo.title` / `seo.description` — from the limits table.
- `hero.title` — the H1. `hero.description` — the one-sentence line under the tool entry.
- `scanner` / `result` / `upsell` — the tool entry, its result panel, and the hand-off; copy only, capability comes from the runtime.
- `intro`, `scale`, `formula`, `research`, `limitations`, `tips` — the H2 sections; each `title` is the H2, each item `title` an H3.
- `faq.items` — question/answer pairs; the Block emits `FAQPage` JSON-LD from these.
- `cta` — heading with the keyword, primary and secondary labels.
- `references.items` — title, publisher, year, https URL, each verified.
- `contentModifiedAt` — today's date, honestly.

Homepage copy lives in the `landing.*` keys of `product/messages/<locale>.json` and the section registry in `product/home.json`; do not create page JSON for it.

Then run:

```bash
pnpm marketing:build-content-release   # schema validation of the page JSON
pnpm product:validate
```

Hand everything else to `/marketing-seo`: Catalog registration, route/locale state, SEO map entry, sitemap, canonical, hreflang, JSON-LD wiring, OG asset, the release gate, and the `index` decision. A new page starts `noindex`.

## Pre-hand-off self-check

Run the 18-point table in `docs/seo-landingpages-instruct-doc.md` section 九. In addition:

```
□ One core keyword; no other page owns it; not an invented term
□ Tool entry directly under the H1, above the fold
□ H1 → H2 → H3 tree, 4–8 H2s, each with an H3; no skipped levels
□ Body 800–3000 words measured across the SSR copy; keyword in top 3 of the 2-word table
□ Every capability/limit/price claim traceable to Catalog, runtime, or a real measurement
□ No fabricated accuracy, ratings, user counts, or testimonials
□ Every image: keyword alt, width/height, WebP, lazy, R2 URL
□ 2–5 keyword-anchored internal links; none to the blog
□ FAQ 4–6+ real questions; references for checkable claims
□ Six machine tells checked; banned words absent
□ Hand-off states: human read-through required; page stays noindex until /marketing-seo clears it
```

## Red lines

- **Never invent product capability, accuracy, or social proof.** `AggregateRating` is added only when real ratings exist; the landing doc's own example omits it on purpose.
- **Never put the tool below the copy.** The entry sits under the H1.
- **Never stack several tools on one page** or hide extra keyword content in collapsed blocks. One keyword, one page, laid out in headings.
- **Never link from a tool page to the blog.** Weight flows blog → tool → home.
- **Never batch.** One page per invocation, with material behind it.
