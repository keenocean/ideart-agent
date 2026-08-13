# Marketing, Tool, And Model Page Guide

This guide defines the long-term shape for Ideart's public marketing pages, tool pages, and model pages.

The goal is not a generic JSON page renderer. The goal is to keep four constraints balanced:

1. Pages are easy to rebrand and reuse.
2. Tool and model catalogs can grow without duplicated route files.
3. Important pages can still have real content and interaction differences.
4. Cloudflare Worker code size and static asset size remain measurable.

## 1. Boundaries

```text
Routes
  compose pages, loaders, head metadata, canonical, hreflang, and 404
    ↓
Blocks
  hold project copy, i18n, assets, catalog wiring, and business choices
    ↓
Components
  render reusable layout and interaction from props
    ↓
Runtime
  owns models, tools, credits, providers, permissions, and execution
```

- `src/routes/*` expresses section order and metadata.
- `src/blocks/*` is project content and may be rewritten per product.
- `src/components/*` is durable UI and should stay portable.
- `messages/{en,zh}.json` holds public copy.
- `src/config/marketing/*` may hold publishable tool/model catalog entries.
- Runtime catalogs remain authoritative for model parameters, prices, provider ids, and credits.

## 2. Recommended Structure

```text
src/
├── components/marketing/
│   ├── section-heading.tsx
│   ├── directory-card-grid.tsx
│   ├── example-gallery.tsx
│   ├── feature-grid.tsx
│   ├── steps.tsx
│   ├── faq-list.tsx
│   ├── related-pages.tsx
│   ├── final-cta.tsx
│   ├── before-after-slider.tsx
│   ├── model-specs-table.tsx
│   └── detail-page-shell.tsx
├── config/marketing/
│   ├── types.ts
│   ├── tools.ts
│   ├── models.ts
│   └── selectors.ts
├── blocks/marketing/
│   ├── home-*.tsx
│   ├── tool-directory.tsx
│   ├── tool-detail.tsx
│   ├── model-directory.tsx
│   ├── model-detail.tsx
│   └── variants/
└── routes/
    ├── index.tsx
    ├── tools/index.tsx
    ├── tools/$slug.tsx
    ├── models/index.tsx
    └── models/$slug.tsx
```

Use one dynamic route for tool details and one for model details. Do not copy a route file for every slug.

## 3. Catalog Rules

Separate publication state from capability state:

```ts
type Publication = 'listed' | 'unlisted' | 'hidden';
type Availability = 'live' | 'beta' | 'coming-soon';

type MarketingPlacement = {
  homeFeatured?: boolean;
  homeOrder?: number;
  directoryOrder: number;
};
```

| State                | Detail Page | Directory  | Sitemap  | Robots  | Workbench            |
| -------------------- | ----------- | ---------- | -------- | ------- | -------------------- |
| listed + live        | 200         | shown      | included | index   | enabled              |
| listed + beta        | 200         | beta label | included | index   | enabled with limits  |
| listed + coming-soon | 200         | may show   | included | index   | disabled             |
| unlisted             | 200         | hidden     | excluded | noindex | follows availability |
| hidden               | 404         | hidden     | excluded | none    | none                 |

Homepage, directories, related pages, sitemap, robots, and LLM text routes must share selectors. Do not maintain separate publish lists.

Catalog entries may describe slugs, placement, related pages, assets, page variants, and safe generation presets. They must not become the source of truth for:

- prices or credits;
- provider model ids;
- System Prompt;
- Agent tool permissions;
- arbitrary Skill names;
- runtime model limits such as resolution or duration.

Derive those values from `src/lib/agent-settings.ts` or server runtime catalogs and validate them again server-side.

## 4. Generation Entry

Generative tool and model pages should enter the Agent path with a validated preset:

```text
Marketing workbench
  → validate input and safe preset
  → create sessionId
  → save prompt/settings/attachments
  → redirect to /chat/$sessionId
  → run the first Agent turn
```

Do not redirect users to an empty `/chat` when the page promises a configured task.

```ts
type GenerationPreset = {
  initialPrompt?: string;
  mediaMode?: 'auto' | 'image' | 'video';
  modelKey?: string;
  requiredInput?: 'none' | 'image' | 'video' | 'media';
  settings?: unknown;
  locks?: {
    mediaMode?: boolean;
    model?: boolean;
  };
};
```

All presets must pass existing normalization. A preset may not modify credits, providers, System Prompt, or tool permissions.

## 5. SEO And Content

Every listed page needs:

- title and meta description;
- one unique H1;
- a clear task/model explanation;
- a real workbench preset or honest disabled state;
- unique examples and prompts;
- visible capabilities, use cases, and limitations;
- related internal links;
- canonical and hreflang;
- Open Graph image;
- Breadcrumb JSON-LD.

Structured data must match visible page content. Do not generate FAQ, pricing, or review data that is not shown to users.

Blog content is database-first:

- Database articles use `(slug, locale)` uniqueness; empty locale is legacy language-neutral data.
- Requested-language articles win over language-neutral articles, and the same slug appears once.
- Public categories are stable `slug + title`; URLs use slug only.
- Public listing and category pagination are server-side.
- Runtime code must not import local article bodies; Admin -> Posts writes published articles to the database.
- Cover images and large media belong in object storage.
- Article pages must output canonical, real hreflang alternates, Open Graph, Twitter Card, and `BlogPosting` JSON-LD.

Provider-specific migrations must be regenerated and reviewed for PostgreSQL or MySQL. Do not apply a SQLite/D1 migration file to another provider.

## 6. Cloudflare Size Control

Growth usually comes from bundled code and text, not from the number of dynamic URLs.

- Put images, videos, and fonts in `public/` or object storage.
- Do not embed large assets as Base64 in TS/JSON.
- Do not import complete videos or large example datasets from Worker global modules.
- Keep Blog bodies in D1/Postgres or another external data layer, not in the Worker bundle.
- Avoid root modules that import every page-specific component.

Measure after bulk marketing changes:

```bash
pnpm cf:build
npx wrangler deploy --outdir bundled --dry-run
```

Record total upload size, gzip size, startup time, static asset count, and largest file size.

## 7. Release Checklist

- [ ] Publication and availability states are correct.
- [ ] Homepage, directories, related pages, sitemap, and LLM routes use shared selectors.
- [ ] Listed pages have real unique content.
- [ ] Model specs come from runtime catalogs.
- [ ] Page presets cannot alter credits, providers, prompts, or permissions.
- [ ] Beta or coming-soon capabilities state their limits.
- [ ] Metadata, canonical, hreflang, and JSON-LD are complete.
- [ ] English and Chinese message keys match.
- [ ] Image and video URLs do not 404.
- [ ] 390px and 1440px layouts are checked.
- [ ] Light/dark, English/Chinese, anonymous/authenticated states are checked.
- [ ] `pnpm test` passes.
- [ ] `pnpm build` passes.
- [ ] Cloudflare dry-run stays within the agreed internal size budget.
