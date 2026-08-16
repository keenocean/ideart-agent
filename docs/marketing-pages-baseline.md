# Marketing pages implementation baseline

Captured on 2026-08-14 before the phase 0/1 infrastructure edits. The worktree
already contained the in-progress Blog/i18n changes listed by `git status
--short`; implementation preserved them and did not assume a clean branch.

This is historical measurement evidence, not the current scale architecture.
The 100+ page target in `docs/marketing-pages-guide.md` supersedes the earlier
future recommendation for lazy `slug + locale` client modules: editable bodies
now belong under `messages/marketing/**` and must be published as immutable,
server-loaded content releases outside Worker/client bundles.

## Repository checks

| Check                    | Baseline result                             |
| ------------------------ | ------------------------------------------- |
| `pnpm test`              | Pass: 36 files, 204 tests                   |
| `pnpm exec tsc --noEmit` | Pass                                        |
| `pnpm format:check`      | Pass                                        |
| `pnpm build`             | Pass, including all postbuild bundle checks |

The existing PayPal duplicate-case build warning remains unrelated to the
marketing-page work.

## HTTP baseline

The Node production build was served locally on port 3100. `/`, `/zh`, Pricing,
and the two static legal pages returned 200 in both registered locales. `/blog`
and `/zh/blog` used the framework's 307 trailing-slash normalization. The local
database had not been initialized, so `sitemap.xml` correctly returned 503
instead of a partial 200; the optional homepage Blog teaser degraded without
taking down the homepage. `robots.txt`, `llms.txt`, and `llms-full.txt` returned 200.

The reusable snapshot command is:

```bash
pnpm marketing:snapshot-routes -- --base-url=http://localhost:3000
```

The captured pre-migration head snapshot used the configured production origin
`https://ugcmind.sjun-zhu.workers.dev` and showed the following behavior:

| Surface             | Status                              | Canonical/alternates                    | Legacy head behavior                                                                                                     |
| ------------------- | ----------------------------------- | --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Home en/zh          | 200                                 | Self canonical; en/zh/x-default present | Root OG/Twitter description and image were shared English `/logo.png` defaults; no explicit robots meta                  |
| Pricing en/zh       | 200                                 | Self canonical; en/zh present           | Page OG/Twitter fields were localized but inherited local `/logo.png`; no x-default or explicit robots meta              |
| Privacy/Terms en/zh | 200                                 | Self canonical only                     | Page title/description existed, but OG/Twitter incorrectly remained the root homepage values and no hreflang was emitted |
| Blog listing        | 503 with the uninitialized local DB | Canonical was present; no alternates    | `noindex,follow`; the 503 normalization and `Retry-After` contract were retained                                         |
| `robots.txt`        | 200                                 | Sitemap declaration present             | Private paths did not yet include every `/chat` locale projection                                                        |
| `sitemap.xml`       | 503 with the uninitialized local DB | No partial sitemap                      | Correct fail-closed discovery behavior                                                                                   |
| `llms*.txt`         | 200                                 | Static fallback                         | No `X-Robots-Tag` before phase 1                                                                                         |

The local baseline could not produce a real Article because the database was
uninitialized. Article field preservation is therefore locked by the Blog
loader/service tests and the shared SEO helper's dedicated `BlogPosting` test,
not represented as a fabricated HTTP success.

## Client route baseline

The report parses the production TanStack Start manifest and follows static
client imports. Raw/gzip bytes include the root chain once per route.

| Route id      | Raw bytes | Gzip bytes | Assets |
| ------------- | --------: | ---------: | -----: |
| `__root__`    |   763,721 |    235,985 |      7 |
| `/`           | 1,041,527 |    336,775 |     60 |
| `/pricing`    |   981,716 |    315,610 |     39 |
| `/(pages)`    |   793,435 |    245,735 |     11 |
| `/blog/`      |   964,302 |    308,827 |     37 |
| `/blog/$slug` | 1,066,875 |    353,110 |     37 |

The main compiled messages chunk was 238,799 raw / 72,081 gzip bytes and was
preloaded by the root route. This confirms that long future Catalog bodies must
not be added to the global messages graph. The later implementation superseded
the interim lazy-module idea with immutable, server-loaded content releases.

The public marketing import scan found no `tDynamic` calls or runtime-built
message keys. The only eager content glob is the existing, small legal-page MDX
factory at `src/routes/(pages)/-static-page.tsx`; it is explicit in the
reviewable allowlist. Catalog content has no eager glob. The same scan is now
part of `pnpm marketing:check-assets`.

Run the repeatable report after a production build:

```bash
pnpm bundle:report-routes
```

### Phase 1 comparison

After the shared SEO/Catalog infrastructure was added, the same report stayed
well below the 100 KiB explanation threshold:

| Route id      | Baseline gzip | Phase 1 gzip |  Delta |
| ------------- | ------------: | -----------: | -----: |
| `__root__`    |       235,985 |      237,284 | +1,299 |
| `/`           |       336,775 |      339,348 | +2,573 |
| `/pricing`    |       315,610 |      316,816 | +1,206 |
| `/(pages)`    |       245,735 |      247,034 | +1,299 |
| `/blog/`      |       308,827 |      310,109 | +1,282 |
| `/blog/$slug` |       353,110 |      354,311 | +1,201 |

The main messages chunk remained exactly 72,081 gzip bytes. A second 194-byte
route-local messages chunk was not root-preloaded.

Cloudflare's deployment dry-run also passed the configured Free-plan internal
budget: 2,165,598 gzip bytes across Worker modules versus a 2,516,582-byte
budget. The generated public output contained 225 files; its largest static
asset was 4,731,048 bytes versus the 26,214,400-byte per-file budget. This was a
dry-run only; nothing was deployed.

### Client chunk stabilization (2026-08-16)

After the home/catalog implementation, the current working baseline had grown
to 541,657 raw bytes for the largest client chunk. The root route transferred
291,228 gzip bytes across 11 assets and the home route transferred 405,323 gzip
bytes across 66 assets. A 266,825 raw / 80,193 gzip compiled messages chunk was
preloaded by the root.

Fixed message enums now use static Paraglide function maps instead of
`tDynamic()`. A first attempt at explicit React, TanStack Router, TanStack
Start, TanStack Query, and Lucide groups produced a circular client chunk graph
and failed during browser initialization. The safe baseline keeps only two
one-way leaf boundaries: React/ReactDOM/Scheduler as `react-core` and the
tree-shaken Lucide modules as `lucide-icons`; the remaining graph stays with
Rolldown. The build now fails on any client chunk cycle as well as any client
JS asset above the configured 500,000 raw-byte budget.

| Route id       | Before gzip | Current gzip |   Delta | Current assets |
| -------------- | ----------: | -----------: | ------: | -------------: |
| `__root__`     |     291,228 |      276,844 | -14,384 |             13 |
| `/`            |     405,323 |      385,568 | -19,755 |             46 |
| `/pricing`     |     370,942 |      354,430 | -16,512 |             33 |
| `/(pages)`     |     300,979 |      286,497 | -14,482 |             16 |
| `/tools/`      |     363,709 |      346,996 | -16,713 |             30 |
| `/tools/$slug` |     393,750 |      374,496 | -19,254 |             39 |
| `/blog/`       |     364,246 |      347,510 | -16,736 |             30 |
| `/blog/$slug`  |     364,408 |      347,790 | -16,618 |             30 |

The largest client JS is now 411,243 raw / 127,524 gzip bytes. The final
Cloudflare budget dry-run reports Worker gzip 2,202,340 / 2,516,582 bytes, 199 /
250 static assets, and a 4,731,048 / 26,214,400-byte largest static asset. The
comparison is a dry-run and does not represent a production deployment.

## Public media baseline

`public/` contained 48 files totaling 52,951,151 bytes. The immutable path/hash
inventory is stored in `config/marketing-public-assets-baseline.json`. These are
legacy assets, not an allowlist for new marketing components. Deletion during R2
migration is allowed; adding or modifying non-shell media fails
`pnpm marketing:check-assets`.

## Lighthouse and first-screen network

No Lighthouse dependency or installed browser runner exists in this repository,
so phase 0 did not add a dependency or fabricate a score. The fixed measurement
contract for the later visual phase is mobile 390px plus desktop 1440px against
the production build, recording tool/browser version, throttling profile, LCP,
CLS, client JS, and first-screen media requests. Until that production/browser
measurement is captured, Lighthouse is explicitly `not verified`.

## Existing generation regression protection

The phase 0 baseline retains the existing Agent settings normalization tests,
Agent chat API tests, and chat route behavior. The initial-turn handoff now also
has a pure serialization/parsing regression contract, while callback targets
share the tested local-only sanitizer. This locks the current `/chat` behavior
before phase 2 changes the workbench/controller boundary.
