# Product Pack Contract

`product/**` is the only default product-owned directory. A downstream product
should be able to change its identity, homepage, public Catalog, long-form
marketing pages, localized copy, and optional skills without editing platform
runtime code.

## Ownership matrix

| Concern                      | Product-owned source                  | Template-owned runtime                               |
| ---------------------------- | ------------------------------------- | ---------------------------------------------------- |
| Identity and defaults        | `product/brand.json`                  | `src/config/product/**`, environment override layer  |
| Agent persona                | `product/agent.json`                  | prompt builder, policy checks, agent service         |
| Homepage composition         | `product/home.json`                   | `src/routes/index.tsx`, registered blocks/components |
| Short UI and homepage copy   | `product/messages/<locale>.json`      | Paraglide compiler/runtime                           |
| Public routes and bindings   | `product/catalog/{tools,models}.json` | Catalog schemas, resolver, selectors                 |
| Detail/directory content     | `product/marketing/**`                | release compiler, store, registry, route loaders     |
| Media inventory              | `product/marketing/assets.json`       | asset validation and release projection              |
| Editorial source             | `product/posts/*.mdx`                 | Admin-published database posts and blog routes       |
| Product research             | `product/research/**`                 | No runtime dependency                                |
| Optional skills              | `product/skills/**`                   | skills compiler, store, registry, APIs               |
| Provider execution           | Never JSON                            | `src/core/ai/**`, `src/modules/agent/**`             |
| Auth, billing, credits, RBAC | Never JSON                            | `src/core/**`, `src/modules/**`                      |
| Deployment resource IDs      | local environment / Wrangler config   | deployment scripts and bindings contract             |

## Agent workflow integration

The Product Pack is an ownership boundary used by the repository's existing
Agent workflows; it is not a replacement workflow or a requirement that users
manually author JSON. A product brief enters through `quick-start`, while
specialized work continues through `clone-website`, `marketing-seo`,
`new-module`, `new-page`, and the deployment/audit skills.

Agents translate the brief into Product Pack changes first, then widen into
shared TypeScript only when the requested behavior cannot be expressed by an
existing typed registry, Block, route, module, or provider capability. The
completion report must distinguish Product Pack changes from shared-runtime
extensions so future template upgrades remain reviewable.

## Safety boundary

Product JSON is data, not code:

- It cannot import a React component or name a filesystem module.
- It cannot define SQL, provider requests, arbitrary URLs for server fetches, or
  authorization rules.
- Homepage sections come from a closed registry owned by the template.
- Catalog model keys must resolve to capabilities implemented by the runtime.
- Marketing page shapes and asset references are schema-validated before a
  release can be built.
- Missing or invalid published content fails closed; it does not fall back to a
  different locale or silently expose an unpublished route.

## Replacing a product

### 1. Identity and Agent

Edit `brand.json` and `agent.json`. Environment variables such as
`VITE_APP_NAME`, `VITE_APP_DESCRIPTION`, and `VITE_APP_URL` remain deployment
overrides; JSON provides safe repository defaults.

Do not hardcode a product name in `src/**`. Prompt templates can use the
supported variables supplied by the prompt builder.

### 2. Homepage

`home.json` controls which existing sections render and in what order. The
allowed values are deliberately finite. Add a new React block only when a
product needs a genuinely new interaction or information architecture.

Ideart's home schema is version 2. Its registered sections are `hero`, `stats`,
`gallery`, `features`, `models`, `pricing`, `faq`, `blog`, and `cta`. Header,
footer, the support widget, and the signed-in redirect remain route-owned shell
behavior. The Blog loader uses `blogPostLimit` and skips its database query when
Blog is disabled.

Section copy lives under `landing.*` in `product/messages/<locale>.json`.
The current Ideart blocks read that localized copy directly. Adding a section
outside the registered set requires a typed Block and a registry update; JSON
cannot import a component or define executable behavior.

### 3. Tools and models

Every public Catalog entry needs two layers:

1. A route/binding definition in `product/catalog/tools.json` or
   `product/catalog/models.json`.
2. Localized long-form JSON in `product/marketing/<kind>/<entityId>/<locale>.json`.

Directory copy lives in `product/marketing/directories/**`. Assets are declared
once in `product/marketing/assets.json` and referenced by stable asset IDs.

Changing presentation content does not add an executable AI model. Add or
change the runtime provider capability first, then reference its stable key
from Catalog JSON.

### 4. Localized UI

All locales registered in `project.inlang/settings.json` must have the same
message key set under `product/messages/`. Static message access is enforced so
unused namespaces remain tree-shakeable.

### 5. Skills

`product/skills/catalog.json` lists published skills. Each entry points to a
directory beneath the same Product Pack. The build creates a content-addressed
manifest; production Workers fetch the pinned release from private R2.

An empty Catalog is valid for products that do not expose skills.

## Versioning rules

- Every Product Pack schema has an explicit `schemaVersion`.
- Template maintainers may add optional fields in a minor template upgrade.
- Required fields or semantic changes require a documented Product Pack
  migration and a schema-version increment.
- Generated release directories and generated TypeScript indexes are never
  edited manually.
- Template maintainers avoid changing sample product content unless a schema
  migration or a broken example requires it. This minimizes downstream merge
  conflicts.

## Verification

Run these checks after Product Pack changes:

```bash
pnpm product:validate
pnpm i18n:check
pnpm skills:build
pnpm marketing:build-content-release
pnpm test
pnpm exec tsc --noEmit
pnpm build
```

For Cloudflare, also run:

```bash
pnpm cf:build
pnpm cf:dry-run
pnpm cf:check-budget
```
