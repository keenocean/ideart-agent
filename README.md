# Agent SaaS Template

A production-ready TanStack Start template for building branded AI agent
products without forking the platform code for every product.

The repository is split into two ownership zones:

- `product/**` is the product pack. Replace its JSON, localized copy, media,
  catalog entries, and optional skills to create a different product.
- Everything else is the reusable platform and rendering runtime. It provides
  auth, billing, credits, admin, AI providers, agent chat, storage, database
  support, public routes, SEO, content releases, and Cloudflare deployment.

The included product pack is a working image/video-agent example. It is sample
content, not a second source of platform behavior.

## What stays in the template

- Homepage blocks and a JSON-controlled section order
- `/tools`, `/tools/:slug`, `/models`, and `/models/:slug`
- JSON-authored tool/model directories and detail pages
- Agent chat, streaming tool calls, task persistence, cancellation, and refunds
- Authentication, RBAC, payments, subscriptions, credits, API keys, and admin
- PostgreSQL, MySQL, SQLite, Turso, and Cloudflare D1 support
- R2/S3 media storage and content-addressed Marketing/Skills releases
- Paraglide localization, sitemap, `llms.txt`, structured data, and bundle gates

## Product pack

```text
product/
├── brand.json            # Brand name, description, and logo defaults
├── agent.json            # Default agent name and system prompt
├── home.json             # Enabled homepage sections and their order
├── messages/             # Paraglide JSON for short UI and homepage copy
├── catalog/
│   ├── tools.json        # Public tool routes and runtime bindings
│   └── models.json       # Public model routes and runtime bindings
├── marketing/            # Long-form tool/model/directory JSON and assets
├── posts/                # Optional editorial MDX sources; runtime uses the DB
├── research/             # Optional product-owned design/content evidence
└── skills/               # Optional agent skill catalog and source documents
```

JSON selects and describes capabilities. Executable provider adapters, payment
logic, database access, React components, and authorization remain TypeScript.
Catalog entries reference stable runtime capability keys and are rejected at
build time when their schema or binding is invalid.

See [Product Pack](docs/product-pack.md) for field ownership and replacement
steps.

## Quick start

```bash
pnpm install
cp .env.example .env.development
# Set AUTH_SECRET and choose DATABASE_PROVIDER / DATABASE_URL.
pnpm db:setup
pnpm db:push
pnpm dev
```

The default development server is <http://localhost:3000>. Configure AI,
storage, payment, email, and OAuth providers from `/admin/settings`; provider
credentials are stored in the database and may be encrypted with
`CONFIG_ENCRYPTION_KEY`.

Before shipping a new product:

1. Replace `product/brand.json`, `product/agent.json`, and `product/home.json`.
2. Replace localized copy under `product/messages/`.
3. Replace `product/catalog/*.json` and the matching long-form content under
   `product/marketing/`.
4. Replace `product/marketing/assets.json` and publish the referenced media.
5. Replace or empty `product/skills/catalog.json` and its skill directories.
6. Copy `wrangler.example.jsonc` to the gitignored deployment config and fill
   in real Cloudflare resource IDs.
7. Run the validation commands below.

## Validation

```bash
pnpm product:validate
pnpm format:check
pnpm i18n:check
pnpm skills:build
pnpm marketing:build-content-release
pnpm test
pnpm exec tsc --noEmit
pnpm build
```

Production builds also enforce client/Worker bundle boundaries so Marketing
Content and Agent Skills do not leak into public JavaScript bundles.

## Creating a downstream product

Clone this repository, give the clone its own `origin`, and keep this template
as a second remote:

```bash
git clone <template-url> my-product
cd my-product
git remote rename origin template
git remote add origin <my-product-url>
git push -u origin main
```

Keep product-specific changes inside `product/**`, environment files, deployment
configuration, and explicitly documented custom modules. This makes later
template merges reviewable instead of turning every upgrade into a repository
replacement.

See [Template Upgrades](docs/template-upgrades.md) for the upgrade procedure and
conflict policy.

## Architecture

```text
Product JSON
  -> schema validation / generated release indexes
  -> server-only content registry
  -> typed route loaders
  -> reusable blocks and components

User request
  -> API route
  -> module service
  -> database / provider
```

The release systems use immutable payloads and mutable release pointers:

- Agent Skills: `.agent-skills/agent-skills/releases/<releaseId>`
- Marketing Content: `.marketing-content/marketing-content/releases/<releaseId>`

Cloudflare Workers read the pinned release from private R2 bindings. Local
development uses the same manifest and object layout from the generated local
release directories.

## Upstream provenance

This template was extracted from `ugcmind-agent` at the commit recorded in
[`template.json`](template.json). The `ugcmind-source` remote is provenance for
template maintainers; downstream products should consume this repository as
their `template` remote rather than merging Ugcmind directly.
