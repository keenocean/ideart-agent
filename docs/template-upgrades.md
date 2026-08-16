# Template Upgrade Contract

Downstream products consume this repository as a Git remote named `template`.
They do not merge `ugcmind-agent` directly. Ugcmind is provenance for the
template; the template is the maintained upstream for products.

## Downstream ownership

Product-specific changes should normally be limited to:

- `product/**`
- local `.env.*` files and real deployment configuration
- database migrations for product-specific tables
- explicitly documented product modules and routes

Changes to shared runtime files are allowed when a product truly needs a new
platform capability, but those changes should be proposed to the template
first whenever they are reusable.

## Upgrade procedure

Start from a clean product branch:

```bash
git remote add template <template-url>  # first upgrade only
git fetch template
git switch -c chore/template-sync-YYYYMMDD
git merge --no-commit template/main
```

Resolve conflicts by ownership:

- In `product/**`, preserve the downstream product's identity and content, then
  apply any documented schema migration from the template.
- In shared platform code, prefer the template implementation unless the
  downstream repository has an intentional product extension.
- Never resolve the whole merge with a repository-wide `ours` or `theirs`
  strategy; it hides product loss and runtime regressions.

Then rebuild generated content and verify:

```bash
pnpm install
pnpm product:validate
pnpm skills:build
pnpm marketing:sync-content-release
pnpm i18n:check
pnpm test
pnpm exec tsc --noEmit
pnpm build
git diff --check
```

Review the Product Pack diff separately from the platform diff before
committing. The merge commit should record:

- the template commit being adopted;
- Product Pack schema migrations applied;
- intentional shared-code deviations retained;
- verification commands and known gaps.

## Template maintainer sync

The template keeps the source repository as `ugcmind-source` for provenance.
When a reusable Ugcmind platform improvement should enter the template:

```bash
git fetch ugcmind-source
git switch -c chore/ugcmind-platform-sync-YYYYMMDD
git merge --no-commit ugcmind-source/main
```

Do not accept Ugcmind product content into `product/**` automatically. Classify
incoming changes as:

1. shared platform/runtime;
2. Product Pack schema or sample migration;
3. Ugcmind-only content.

Only the first category merges normally. The second needs an explicit Product
Pack migration. The third stays out of the template.

## Stop conditions

An upgrade is complete only when:

- Product Pack validation and release builds pass;
- type checking and tests pass;
- the production build passes its bundle gates;
- no product brand or deployment secret crossed into the shared runtime;
- the downstream homepage, tool/model routes, and Agent entry points still
  resolve against the downstream Product Pack.
