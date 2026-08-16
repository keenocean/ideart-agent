---
name: sync-upstream
description: "Sync reusable platform changes into an Agent SaaS product while preserving its Product Pack. Use when the user asks to update from the template, sync the template, pull upstream changes, 拉取上游更新, or 更新模板. Downstream products merge template/main; template maintainers classify ugcmind-source changes and exclude source-product identity."
argument-hint: "[template remote/branch or source range]"
user-invocable: true
---

# Sync Upstream — $ARGUMENTS

Adopt reusable platform updates without replacing the downstream product. Read
`docs/template-upgrades.md` completely before acting; it is the canonical
ownership and conflict policy.

## Select the lane

### Downstream product

Use this lane when the repository consumes the Agent SaaS template through a
remote named `template`. Merge `template/main`; never merge Ugcmind or ShipAny
directly into a downstream product.

### Template maintainer

Use this lane only in the template repository when importing reusable changes
from its provenance remote `ugcmind-source`. Classify every incoming change as:

1. reusable platform/runtime;
2. Product Pack schema or sample migration;
3. source-product-only identity/content.

Adopt category 1 normally, require an explicit migration for category 2, and
exclude category 3.

## Workflow

### 1. Preflight

Record repository state and remotes:

```bash
git status --short --branch
git remote -v
```

Do not overwrite unrelated work. Start the merge only from a clean worktree; if
changes belong to the user, report the exact overlap rather than stashing or
discarding them without authorization.

For a downstream product, ensure the template remote exists and fetch it:

```bash
git remote get-url template
git fetch template main
git log --oneline --reverse HEAD..template/main
```

If `template` is absent, discover whether the original clone remote was renamed
or ask only for the missing template repository URL.

For template-maintainer sync, use the already configured fetch-only provenance
remote:

```bash
git remote get-url ugcmind-source
git fetch ugcmind-source main
git log --oneline --reverse HEAD..ugcmind-source/main
```

### 2. Review the incoming surface

Inspect the commits and diff before merging. Identify:

- Product Pack schema/version changes;
- shared runtime, module, route, dependency, schema, env, and deployment changes;
- downstream custom platform extensions;
- product identity/content that must not cross the boundary;
- database migrations or external release steps requiring special care.

An empty commit range means the repository is current; report and stop.

### 3. Merge without committing

Create a dedicated branch, then merge the selected source without committing:

```bash
git switch -c chore/template-sync-YYYYMMDD
git merge --no-commit template/main
```

Template maintainers substitute `ugcmind-source/main` and apply the three-way
classification above.

Resolve conflicts by ownership:

- Under `product/**`, preserve downstream identity/content and apply only the
  documented schema migration.
- In shared platform code, prefer the template implementation unless the
  downstream has an intentional extension.
- Preserve product-specific database migrations and modules deliberately; do
  not let their existence justify keeping stale shared runtime code.
- Never resolve the repository wholesale with `ours` or `theirs`.

### 4. Rebuild generated artifacts

After conflict resolution:

```bash
pnpm install
pnpm product:validate
pnpm skills:build
pnpm marketing:sync-content-release
pnpm i18n:check
```

Generated release objects and indexes are build output. Regenerate them from
the preserved Product Pack rather than hand-merging generated payloads.

### 5. Verify

Run:

```bash
pnpm test
pnpm exec tsc --noEmit
pnpm build
git diff --check
```

Run `pnpm cf:build`, `pnpm cf:dry-run`, and `pnpm cf:check-budget` when the
incoming changes touch Worker/runtime/deployment surfaces. Smoke-test the
downstream homepage, `/tools`, `/models`, representative details, and Agent
entry points in every supported locale.

Run the repository security-scan workflow before committing. Use the Lore
commit protocol and record the source commit, Product Pack migrations,
intentional deviations, tests, and known gaps. Do not push without explicit
authorization.

## Rules

1. `product/**` is downstream-owned; a template merge may migrate its schema but
   may not replace its identity/content.
2. Shared fixes should land in the template first when reusable, then flow to
   products through `template/main`.
3. Do not import source-product content from `ugcmind-source` into the template
   merely because it arrived with a platform commit.
4. Do not run destructive database migrations or external publish/deploy steps
   without the authority required by repository guidance.
5. Do not declare completion while Product Pack validation, tests, typecheck,
   production build, or required route smoke checks are failing.

## Report

Lead with the adopted template/source commit and outcome. Include incoming
commits, conflict decisions by ownership zone, schema migrations, deliberate
skips, verification evidence, remaining deployment/data work, and whether the
branch was committed. Never claim a push or production mutation that did not
occur.
