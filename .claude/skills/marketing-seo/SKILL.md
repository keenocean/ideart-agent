---
name: marketing-seo
description: "Own the end-to-end SEO lifecycle for public product and marketing pages. Use whenever the user asks to add, update, rename, publish, unpublish, index, audit, consolidate, retire, or monitor a public landing, directory, feature, tool, integration, comparison, or model page—even when they do not mention SEO. The skill discovers the repository's architecture, researches intent, maintains a durable SEO map, implements content and metadata through project contracts, chooses index/noindex/blocked, verifies rendered output and discovery surfaces, and prepares post-launch monitoring. Do not use for private application screens, a generic whole-site launch sweep, or a writing-only request with no page lifecycle work."
---

# Marketing SEO — $ARGUMENTS

Act as the SEO owner for a public marketing-page change. Finish the requested implementation when it is in scope; do not hand SEO choices back to a user who asked the Agent to own them.

The outcome is not “metadata added.” The outcome is a truthful, useful page with an evidence-backed `index`, `noindex`, or `blocked` decision, passing repository checks, plus an explicit production follow-up when live search data is unavailable.

## Autonomy contract

- Infer technical SEO decisions from repository policy, current official guidance, public search evidence, and available Search Console/analytics data.
- Ask the user only for a material business fact that cannot be discovered safely, a decision that changes product positioning, or authorization to mutate an external system. Continue every reversible part while that input is missing.
- Never ask the user to choose canonical, hreflang, schema type, title shape, sitemap membership, or indexing status.
- Never invent search volume, ranking, customer evidence, product support, price, rating, review, or provider capability.
- Treat the project's authoritative capability and business sources as truth. Marketing content may explain those facts but may not redefine them.
- Default every new public page to `noindex` unless a stricter project state prevents routing at all. Flip it to `index` only after the release gate passes.
- Do not promise ranking, rich results, crawling speed, or indexation. Report what was verified and what remains external.

## Required context

Before acting:

1. Read the repository's agent guidance and honor its worktree, architecture, test, and safety rules.
2. Read [references/release-contract.md](references/release-contract.md) completely.
3. Discover the project's framework, route system, locale strategy, content source, capability source, page registry, discovery endpoints, checks, and deployment target.
4. When the repository matches the bundled ShipAny/TanStack profile, read [references/shipany-tanstack.md](references/shipany-tanstack.md). Treat it as an adapter, not a universal SEO rule.
5. Read any project architecture/marketing plan selected by the adapter or discovered in the repository. Current code and newer project decisions override stale examples.
6. If creating or changing an SEO map entry, read and reuse [assets/seo-map-entry.md](assets/seo-map-entry.md).
7. If producing the final decision, read and reuse [assets/seo-release-report.md](assets/seo-release-report.md).

Inspect the current repository rather than assuming planned files already exist. Prefer `rg`/`rg --files`; inspect `package.json` before invoking a named command. Preserve unrelated and concurrent worktree changes.

## Classify the request

Choose one primary lane and include dependent lanes when needed:

| Lane | Typical request | Required expansion |
| --- | --- | --- |
| Create | Add a landing/detail/directory page | Product truth → intent → noindex implementation → gate |
| Update content | Change copy, examples, FAQ, claims, OG asset | Impacted locales, metadata, JSON-LD, internal links |
| Update capability | Change specs, inputs, provider, pricing, or executable behavior | Authoritative product source first, then every referencing page |
| Rename | Change slug or canonical path | New URL, legacy 301, internal links, alternates, sitemap |
| Retire | Unlist, hide, replace, or delete | 200/noindex, 404, 410, or justified 301 decision |
| Audit | Diagnose one or more marketing pages | Read-only findings unless the user asks to fix |
| Monitor | Check post-launch search health | Production/Search Console evidence, no code churn without cause |

For whole-site pre-launch sweeps, use the repository's whole-site audit workflow as the outer process and apply this skill's release contract to affected marketing pages. Use the project's application-page workflow for private dashboard screens.

## Workflow

### 1. Establish the change surface

- Record `git status --short` before editing.
- Resolve the route, entity identifier, lifecycle/indexing state, locales, related entries, content source, execution/capability mapping when applicable, sitemap projection, and current metadata.
- Build an impact graph from the authoritative fact to every consumer: detail pages, presets or interactive entry points, comparisons, homepage/directory cards, related links, sitemaps or other discovery feeds, and claims.
- For an audit-only request, stop after evidence-backed findings and recommended fixes. Do not mutate files.

### 2. Verify product truth

Locate the project's authoritative sources before writing copy. Depending on the product, these may include runtime registries, server validation, API schemas, feature flags, billing configuration, provider mappings, inventory, or verified product documentation.

- For an executable page, prove that the user-visible action has a real validated execution path.
- Derive technical specs, limits, pricing, and availability from authoritative sources; do not duplicate them into marketing-only configuration.
- A page preset or input policy may narrow product limits but may not expand them.
- Temporary deployment readiness controls the interactive experience unless the project explicitly couples it to publication; it should not make a stable SEO URL oscillate without a deliberate policy.

If the capability is not real, continue with a truthful beta/coming-soon/noindex page only when that matches the user's product intent. Otherwise return `blocked` rather than fabricate support.

### 3. Research search intent

Research separately for every target locale:

- Inspect existing page/query mappings and internal search overlap first.
- Use current public search results to identify dominant intent, terminology, result types, and credible content gaps.
- Use Search Console query/page data when authorized and available. Search Console is the source of truth for this site's Google Search performance; public research is not a substitute for private traffic data.
- Use primary/official sources for technical SEO and provider/model claims. Attach source URL and review date to external factual claims.
- Do not present third-party keyword volume or difficulty as fact unless a named data source and observation date are available.

Assign one primary intent per locale. Separate task-completion intent, category discovery, product/entity evaluation, comparison, integration, and troubleshooting where relevant. If two pages still target the same need, consolidate, reposition one, or keep one noindex.

### 4. Update the durable SEO map

Use the project's existing SEO map as the durable source. If none exists, create `docs/marketing-pages-seo-map.md` from the bundled entry template without inventing entries for unrelated pages.

Record:

- route/entity/locale and current publication decision;
- primary intent and query cluster;
- adjacent pages and cannibalization boundary;
- visible evidence, limitations, and claim sources;
- inbound internal links and natural anchors;
- canonical path and indexable alternate paths;
- intended structured data and OG asset;
- release decision, review date, and external items not yet verified.

The SEO map is an operational decision record, not a keyword-stuffing brief. A review timestamp must not become sitemap `lastmod` unless page content actually changed.

### 5. Implement through project boundaries

- Follow the repository's route/content/component/business boundaries and the matching adapter. Do not introduce a second page registry or duplicate authoritative product facts.
- Update the canonical page/entity registry when one exists instead of maintaining separate homepage, directory, sitemap, and discovery-feed lists.
- Reuse existing UI primitives before adding marketing components.
- Make core H1, explanatory copy, limitations, evidence, and internal links available in SSR HTML. Lazy-load heavy Workbench/gallery panels when appropriate.
- Use one typed content source for visible FAQ and FAQ JSON-LD, visible breadcrumbs and `BreadcrumbList`, and social metadata inputs.
- Route all page metadata through the shared SEO helper when it exists. If project guidance calls for one but it is absent, implement it once rather than proliferating route-local copies.
- Update every affected locale, but do not register or synthesize a missing locale merely for parity. Add an alternate only when that locale has substantive, indexable content and an accurate canonical path.
- Follow the adapter's media-host and local-asset allowlist for page images, videos, posters, and OG/Twitter assets. Keep rendered URLs public, absolute, stable, accessible, dimensioned, and truthful; upload/verify external objects before merging their page references.

### 6. Apply the release gate

Read the decision matrix in the release contract, then decide:

- `index`: unique useful content, verified capability/claims, crawlable SSR content, valid metadata, intentional internal links, passing technical checks.
- `noindex`: routable page that is thin, duplicative, incomplete, untranslated, coming soon without sufficient substance, or intentionally undiscoverable.
- `blocked`: safe publication is impossible because a critical product fact, implementation prerequisite, or authorization is missing.

Do not let transient operational readiness make a stable SEO URL enter and leave the sitemap unless the project's publication contract explicitly requires that behavior.

### 7. Verify proportionally

Discover and run the repository's formatter/linter, tests, type/static checks, and production build in proportion to the change. If dedicated SEO checks exist, run the relevant ones. Do not invent a command or claim a nonexistent check passed; the project adapter may name expected commands.

For changed routes verify, as applicable:

- status code and redirect behavior;
- zero unexpected 404s in the site's published/discovered URL inventory, while negative route fixtures return their deliberate 404/410 status;
- one title, description, robots directive, and canonical;
- canonical/current-locale URL and `og:url` equality;
- reciprocal hreflang only between indexable real translations;
- `x-default` only when a real, indexable base-locale page exists;
- sitemap membership and honest `lastmod`;
- robots crawlability for noindex pages;
- parseable, safely serialized, visible-content-backed JSON-LD;
- every changed page-media URL uses the adapter-approved origin and has public 200 evidence; images/OG assets have alt and dimensions, while videos have a poster and valid range behavior;
- SSR H1, core content, limitations, and crawlable internal links;
- no localhost, expiring asset URL, missing asset, forbidden local-media reference, console error, or unexplained client-JS/performance regression.

Use Rich Results Test or Schema Validator for representative production-capable pages. A passing result proves validation eligibility, not that a rich result will appear.

### 8. Handle external publication and monitoring

Only mutate Search Console or another external account when that access and action are authorized for the task. Never request that credentials be pasted into source files or chat; use an established connector/session or provide a least-privilege setup handoff.

When authorized:

- submit or refresh the sitemap;
- inspect representative URLs and Google-selected canonicals;
- triage Search Console 404s by discovery source and lifecycle instead of treating the raw count as a zero-target KPI;
- record the production-day, day-7, and day-30 checks;
- compare Search Console impressions/clicks/queries/pages with analytics organic landing-page conversions and real-user Core Web Vitals.

The Search Console API can inspect the version in Google's index, but it cannot live-test a URL or request indexing. Record those manual-tool limitations rather than pretending they were automated.

When access is unavailable, finish repository work, state exactly what was not verified, and create an owner/date/checklist handoff. Lack of Search Console access alone does not make an otherwise useful, technically valid page noindex.

## Final response

Use the release-report template. Lead with:

1. final decision (`index`, `noindex`, or `blocked`);
2. what changed and which pages/locales were affected;
3. verification evidence;
4. external checks completed or handed off;
5. remaining risks.

Do not report completion while required repository checks are failing or while the page's published claims exceed verified Runtime capability.
