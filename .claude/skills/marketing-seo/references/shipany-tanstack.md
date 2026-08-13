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
- Blocks own localized project content, assets, Catalog wiring, and project-specific variants.
- Components are durable pure-props UI and do not read translations.
- Runtime/server sources own capabilities, limits, model/provider mapping, billing, permissions, and execution.
- `messages/{en,zh}.json` contains flat localized messages; known keys use static Paraglide message access.
- Do not import server-only modules into components.

## Marketing registry and execution

- The planned canonical registry is `src/config/marketing/*`, with named selectors for homepage, directory, related pages, indexable URLs, and llms discovery.
- Lifecycle fields are `publication`, `availability`, and `indexing`. Map `listed + index`, `listed + noindex`, `unlisted`, `hidden`, and coming-soon states to the generic release matrix.
- A model page derives modality-specific Runtime keys and specifications from `src/lib/agent-settings.ts`.
- A tool may use `agent-preset` only when the existing Agent path truthfully executes it. A `dedicated-api` operation must exist and be server-validated before registration.
- Page `inputPolicy` may narrow Runtime limits but not expand them.
- Deployment readiness controls the Workbench; stable publication/indexing state controls discovery.

## Locale and metadata

- Routes remain locale-free. Paraglide/router rewriting keeps base English paths locale-free and prefixes Chinese with `/zh` under the current configuration.
- The planned shared metadata builder is `src/lib/seo.ts`. If implementation has not reached that stage, follow the approved plan rather than assuming the file exists.
- Only substantive, indexable translations participate in reciprocal hreflang. Each alternate supplies its accurate locale-free canonical path; `x-default` points to the real base-locale version.
- Discovery endpoints are `src/routes/sitemap[.]xml.ts`, `src/routes/robots[.]txt.ts`, `src/routes/llms[.]txt.ts`, and `src/routes/llms-full[.]txt.ts`.
- llms endpoints are experimental and do not replace conventional SEO.

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

## Workflow boundaries

- `/marketing-seo` owns the vertical lifecycle of an individual public marketing entity.
- `/launch-audit seo` owns a whole-site horizontal sweep.
- `/new-page` is for authenticated dashboard pages, not public marketing entities.
