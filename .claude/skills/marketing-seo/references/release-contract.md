# Marketing SEO release contract

Use this framework-neutral reference to make consistent page-level decisions. Repository guidance and an applicable project adapter remain authoritative when they are stricter.

## Trust hierarchy

When sources disagree, prefer:

1. The project's authoritative business/runtime data and server-side validation for executable product capability.
2. The active page/entity registry for publication, placement, relations, and indexing intent.
3. The canonical content source for visible claims and examples.
4. Official first-party documentation for facts not represented in the product source.
5. Search Console for this site's Google Search performance and indexed canonical.
6. Public search results for current intent and result-shape research.
7. Third-party SEO estimates only when the source and observation date are explicit.

Do not overwrite a higher-trust source with lower-trust marketing copy.

## Technical state matrix

| State | HTTP | robots | canonical | hreflang | sitemap | Structured data |
| --- | --- | --- | --- | --- | --- | --- |
| public + index | 200 | index,follow | self | Reciprocal real/indexable translations; x-default only when base exists | Yes | Visible facts only |
| public + noindex | 200 | noindex,follow | self | None | No | Optional visible facts only |
| routable but undiscoverable | 200 | noindex,follow | self | None | No | Optional visible facts only |
| absent or unknown | 404 | — | — | — | No | No entity data |
| coming-soon + substantial + index | 200 | index,follow | self | Same rule as listed/index | Yes | Published facts only |
| coming-soon + thin/incomplete | 200 | noindex,follow | self | None | No | No misleading capability claims |

Use the same matrix for route head, SSR checks, and sitemap assertions.

## Canonical and locale rules

- Derive locale URL rules from the project adapter or router. Never assume prefix, subdomain, query, or domain strategy.
- Generate absolute production URLs from the configured app URL.
- Remove hash and known tracking parameters. Give functional pagination/filter parameters an explicit page-type strategy instead of stripping every query globally.
- Keep a consistent trailing-slash policy.
- Each alternate contains its own canonical path so future localized slugs remain possible.
- A noindex page may self-canonical, but crawlers must be allowed to read its noindex directive.
- Renamed published slugs need a tested 301 to the new canonical. Permanently removed content needs a deliberate 410 or a relevant replacement; avoid soft 404s and redirect chains.

## Metadata ownership

- Root owns site defaults and truthful WebSite/Organization identity.
- The page owns its localized title, description, robots, canonical URL, social URL/image, breadcrumbs, and optional FAQ data.
- The shared SEO helper emits final `meta`, `links`, and JSON-LD scripts without duplicates.
- `og:url` equals canonical. Map app locales to Open Graph locales, such as `en_US` and `zh_CN`.
- Prefer a public 1200×630 sharing image; fall back to a verified default. Do not emit `og:video` without a stable public share-ready URL.

## Structured-data allowlist

- Root: `WebSite`, `Organization` when facts are real.
- Directory/detail pages: `BreadcrumbList` matching visible breadcrumbs.
- Blog: `BlogPosting` matching the article.
- FAQ: `FAQPage` only from the same data rendered visibly on the page.
- `Product` or `SoftwareApplication`: only when the business semantics and all required truthful fields exist.

Do not invent a domain-specific schema type, ratings, reviews, offers, prices, authors, dates, or capabilities. Serialize JSON-LD safely for an HTML script context; one valid pattern is replacing `<` with `\u003c` after `JSON.stringify`.

## Content quality gate

An indexable detail page needs more than a renamed template. Require:

- one clear locale-specific search intent;
- a unique H1 and useful introduction;
- verified capability and limitation statements;
- real examples or prompts with enough context to learn from;
- at least three substantive categories among workflow, capabilities, limitations, use cases, prompt guidance, comparison, or model specs;
- crawlable inbound links with descriptive anchors;
- a clear boundary from adjacent pages;
- substantive localized content for every declared alternate.

Prefer consolidation over creating multiple pages that satisfy the same intent.

## Automated and external evidence

Repository evidence can prove code, content, SSR output, metadata consistency, status behavior, assets, and build health. It cannot prove that Google crawled, indexed, selected, or ranked the page.

External evidence comes from production fetches, Search Console page indexing/URL inspection/performance data, analytics conversions, and field Core Web Vitals. A sitemap submission helps discovery but is not proof of indexation.

## Stop conditions

Complete when the requested repository change is implemented, required checks pass, claims remain within verified capability, the release decision is recorded, and external work is either completed or assigned with an owner/date.

Block only when continuing would require fabricating product truth, publishing an unsafe/misleading capability, performing an unauthorized external mutation, or choosing between materially different business positions.
