# ShipAny TanStack project adapter

Apply this adapter only when the repository uses the ShipAny TanStack Start architecture described below. It translates the generic Marketing SEO lifecycle into project-specific paths and commands; it is not a universal SEO rule.

## Detection

Use this adapter when the repository has the matching surfaces, including TanStack Start file routes under `src/routes`, Paraglide locale runtime/messages, `src/blocks`, and the ShipAny `AGENTS.md` architecture contract. Verify current files before assuming planned marketing modules exist.

## Project guidance

Read the relevant sections of:

- `.omx/plans/marketing-pages-architecture.md`
- `docs/marketing-pages-guide.md`

Current code and newer decisions override stale examples in either document.

## Boundaries

- Routes own loader, head, status/redirect behavior, and page composition.
- Blocks own project wiring, code-controlled section order, Catalog/runtime integration, and project-specific variants; localized long-form content arrives as validated release data.
- Components are durable pure-props UI and do not read translations.
- Runtime/server sources own capabilities, limits, model/provider mapping, billing, permissions, and execution.
- `messages/{en,zh}.json` contains short UI/metadata messages; known keys use static Paraglide access. Public marketing graphs must not use `tDynamic` or runtime-built message keys.
- For the 100+ page profile, repository-edited long-form marketing content lives under `messages/marketing/**`: home, directories, `tools/<entityId>/<locale>.json`, `models/<entityId>/<locale>.json`, and `assets.json`. It is excluded from Paraglide and all route/client globs, schema-validated at build time, and published as immutable external content releases. Do not extend legacy `src/content/**/pages/*.ts` lazy chunks for new bulk pages.
- Do not import server-only modules into components.

## Marketing registry and execution

- The planned canonical registry is `src/config/catalog/*`, with named selectors for homepage, directory, related pages, indexable URLs, and llms discovery.
- Public project blocks stay flat under `src/blocks/*` and use domain-prefixed filenames such as `tool-*` and `model-*`; do not add a redundant `src/blocks/marketing/*` layer.
- Preserve `src/routes/tools/index.tsx` and `src/routes/models/index.tsx` as directory routes, plus one `$slug.tsx` detail route per kind. Do not create a route module per entity. Keeping the file does not publish an empty directory: a locale directory returns 200 only when the pinned release has at least one listable same-locale detail entry; otherwise it fails before head with 404 and stays out of discovery.
- Catalog-specific durable components live under `src/components/catalog/*`. Extract broader section primitives only after real reuse exists.
- Lifecycle fields are entity-level `publication`/`availability` plus per-locale route/indexing data. Map each concrete locale URL—not the entity as a whole—to `listed + index`, `listed + noindex`, `unlisted`, `hidden`, and coming-soon release states. A missing locale route does not exist and must not be mechanically generated.
- A model page derives modality-specific Runtime keys and specifications from `src/lib/agent-settings.ts`.
- A tool may use `agent-preset` only when the existing Agent path truthfully executes it. A `dedicated-api` operation must exist and be server-validated before registration.
- Page `inputPolicy` may narrow Runtime limits but not expand them.
- Client Catalog/preset data is not authoritative. The chat API resolves a stable `entryContext` against the server Catalog, validates the locale route and attachments, overlays locked media/model after normalization, and propagates the policy to Agent tool context so explicit tool parameters cannot bypass it.
- Do not claim arbitrary locked image-model support until `imageModelOption` is carried through composer state, normalization, handoff, API validation, runtime settings, and Agent tool context.
- Deployment readiness controls the Workbench; stable publication/indexing state controls discovery.

## Locale and metadata

- Routes, Catalog paths, links, canonical inputs, and redirect targets remain locale-free. Reuse the existing `vite.config.ts` Paraglide `urlPatterns`, `src/server.ts` middleware, and `src/router.tsx` `deLocalizeUrl/localizeUrl` rewrite; do not add `$locale` routes, store `/zh`, or hand-build locale prefixes. `vite.config.ts` derives patterns from `project.inlang/settings.json`: the base locale is unprefixed and every non-base locale uses `/<locale>`.
- Register `slug` and content explicitly per locale. Resolve dynamic routes by `(kind, current locale, current slug)`; unknown, hidden, unregistered locale, or a pinned release manifest that explicitly lacks the page throws 404 before metadata is generated. Never return another language as a fallback 200.
- Blog records follow the same explicit-locale rule using the database `(slug, locale)` key. Translations share one slug; create/edit accepts only a locale from the generated Paraglide `locales` list. Empty or unsupported locales are excluded from public lists, detail resolution, hreflang, sitemap, and llms discovery. Do not add language-neutral Blog fallback, translation-group infrastructure, or speculative redirects for a new project without confirmed historical URLs.
- A locale Blog directory is indexable and discoverable only after that locale has at least one published article. An empty locale directory remains `200 + noindex` with no hreflang or sitemap entry; category filters and page 2+ follow the same noindex/no-hreflang rule. On an article, the language selector keeps the slug only for published translations and otherwise navigates to the target locale Blog directory; direct missing-translation URLs still return 404.
- Treat Blog list/detail and sitemap database failures as temporary availability failures: return 503 (with `Retry-After` where possible), never an empty indexable 200, article 404, or static-only sitemap 200. The optional homepage Blog teaser may degrade to no items without taking down the homepage.
- Register homepage, Pricing, static pages, and directory routes per locale in `src/config/seo/public-routes.ts`; validate that every locale-free path is accepted by a real file route. Keep these fixed routes outside the tool/model Catalog, while Blog URLs continue to come from published database records.
- The planned shared metadata builder is `src/lib/seo.ts`. If implementation has not reached that stage, follow the approved plan rather than assuming the file exists.
- Feed the metadata builder route-backed locale-free references. Only substantive, indexable translations participate in self-including reciprocal hreflang; `x-default` appears only when a real indexable base-locale route exists. A noindex page emits no hreflang.
- Discovery endpoints are `src/routes/sitemap[.]xml.ts`, `src/routes/robots[.]txt.ts`, `src/routes/llms[.]txt.ts`, and `src/routes/llms-full[.]txt.ts`.
- Sitemap validates, deduplicates, and merges explicit indexable fixed-route locale states, concrete Catalog URLs from `selectIndexableUrls()`, and published Blog locale URLs. Do not drop homepage/Pricing/static/Blog URLs when adding Catalog discovery. Use real `lastmod` or omit it, and do not emit `priority`/`changefreq`. Public noindex pages remain crawlable so robots can be read; private routes rely on auth/noindex, with any extra Disallow covering actual locale prefixes.
- Register published URL changes in `src/config/catalog/legacy-routes.ts` by `{ kind, locale, fromSlug }`. Require single-hop 301 to a 200 canonical, integration-tested 410 for permanent removal, and 404 for unknown/hidden paths. Legacy sources never enter discovery surfaces.
- llms endpoints are experimental and do not replace conventional SEO. Keep them crawlable, return HTTP `X-Robots-Tag: noindex`, and only include resolver-backed allowed locale URLs.

## 404 release boundary

- Build a **published URL inventory** from fixed public routes, Catalog locale routes, Header/Footer, directories, Related, canonical/hreflang, sitemap/llms, and legacy redirect targets. Every URL in this set must return its non-404 release-matrix status; unexpected 404 count is zero.
- Keep **negative route fixtures** separate: unknown slugs, hidden entries, unregistered locales, intentionally unpublished locale content, and malformed paths must return real 404s and must not appear in the published inventory.
- When Catalog plus the Worker-pinned release manifest says a locale page is published, a failed content-store read, missing object, hash mismatch, or incompatible schema is an availability fault: return `503 Service Unavailable` with `Retry-After`, never 404 or an empty 200. Sitemap and llms endpoints also return 503 instead of a partial 200 when their pinned projection cannot be loaded.
- A real, useful but not-yet-indexable page is `200 + noindex`; an absent page is 404. Do not return thin/fallback `200`, redirect missing Chinese URLs to English or the homepage, or use robots.txt to hide the report.
- Search Console's total 404 count is diagnostic, not a release KPI. Fix self-linked, sitemap-submitted, hreflang/canonical, redirect-target, and historically valuable URLs; record guessed/typo URLs that correctly remain 404 without creating fake redirects.

## Marketing media delivery

- For every new or materially changed public marketing component, store page images, videos, video posters, Blog covers, and OG/Twitter images in Cloudflare R2. Render the stable absolute URL under the configured HTTPS `r2_domain`; do not add or copy `/images/*`, `/videos/*`, `/imgs/*`, or other content media into `public/`.
- Existing untouched local media is legacy, not precedent. If a new component reuses it or its current page is materially changed, upload that object to R2 and replace the reference in the same change. `public/` exceptions are limited to browser shell assets such as favicon/manifest icons and non-marketing functional icons; a logo used in page content, Blog metadata, or social metadata is not exempt.
- The existing `R2Provider` falls back to the S3 API endpoint when `r2_domain` is absent. That fallback is not an approved public marketing origin. Reject localhost, `*.r2.cloudflarestorage.com`, authenticated URLs, and expiring signed URLs for page/social media.
- Components receive media props and never read storage configuration or concatenate the domain. Keep assetId plus absolute URL/kind/MIME/dimensions/bytes/poster in `messages/marketing/assets.json`; keep localized alt/caption in the locale page JSON. The release compiler resolves only referenced assets into each page payload so runtime never downloads the global asset registry. Never put R2 credentials in Catalog, source JSON, client bundles, or release manifests.
- Use immutable version/content-hash keys such as `marketing/<surface>/<slug>/<hash>.<ext>`, upload a new key for content changes, and serve the correct MIME, inline disposition, and immutable cache headers. Images need intrinsic dimensions; videos need an optimized R2 poster and verified range responses.
- Publish atomically in dependency order: upload/verify assets; validate source JSON, Catalog, links, schema, and asset IDs; build/upload immutable content objects and discovery projections; verify every object/hash; then deploy a Worker pinned to that releaseId and run SSR/SEO/status smoke. Retain the previous release for rollback. Never follow a mutable runtime `latest`, overwrite immutable objects, or silently fall back to `public/`.

## 100+ page content release

- Use immutable object keys such as `marketing-content/releases/<releaseId>/pages/<kind>/<entityId>/<locale>.json`, plus release-scoped home/directory projections and a lightweight manifest.
- Every release entry records schemaVersion, exact entityId/locale, content hash, object key, and honest `contentModifiedAt`. The release identifier is public deployment metadata, not a secret.
- Treat private R2 release objects as the default content source of truth and Cache API as read-through edge cache. KV may accelerate only release-scoped small manifests/projections; it must not become a separately mutable truth. Public media remains on the R2 CDN, while page JSON stays server-only.
- The Worker contains only finite template code, a lightweight Typed Catalog, and a release descriptor (pinned releaseId, schemaVersion, and store prefix); the complete manifest/projections stay in the external content layer. A server-only loader fetches the exact object, validates identity/hash/schema, and caches by releaseId + object key using Cache API/KV. Client code receives only current-route loaderData.
- Homepage, directory, Related, sitemap, llms, detail availability, and language targets consume the same pinned projection. They may not scan source JSON independently or read a mutable latest release.
- Before approving scale, build at least 100 detail-page fixtures and prove page JSON does not add Worker Static Assets or client chunks, while Worker gzip and root-route preload remain within baseline tolerance.

## UI reuse

Reuse existing primitives, including `src/components/ui/*`, `ImageUploader`, `ViewportVideo`, and `VideoPreviewDialog`. Do not edit shadcn primitives manually; add new marketing components only for missing durable content behavior.

## Verification

Inspect `package.json`, then normally run:

```bash
pnpm format:check
pnpm test
pnpm exec tsc --noEmit
pnpm build
```

Run `seo:*` commands only if they actually exist. For Cloudflare launch work, also use the repository's documented build/dry-run checks. Preserve unrelated dirty-worktree changes.

For marketing-route releases, also run repository-provided content-release build/publish dry-run, `bundle:report-routes`, `marketing:check-assets`, and Cloudflare budget checks when present. The content release gate validates every source/manifest/object hash and proves marketing source JSON is absent from Paraglide, Worker/client imports, and Static Assets. `marketing:check-assets` must reject new local page media outside the shell allowlist and validate every R2 asset ref; its online/release mode must fetch the complete R2 inventory. Fetch every published URL and assert its release-matrix status. Separately cover `/tools/missing`, `/zh/tools/missing`, `/models/missing`, and `/zh/models/missing` as negative fixtures that must return 404, plus injected published-object failures that must return 503. Representative sampling is not enough to prevent phantom localized URLs or missing media.

## Workflow boundaries

- `/marketing-seo` owns the vertical lifecycle of an individual public marketing entity.
- `/launch-audit seo` owns a whole-site horizontal sweep.
- `/new-page` is for authenticated dashboard pages, not public marketing entities.
