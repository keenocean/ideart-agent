# Ideart

A production-ready conversational AI image and video SaaS, built to rebrand and ship.
Users describe a shot or attach source media; the agent decides how to use the
material, chooses the right generation tool, writes the production prompt,
renders the result, and charges credits for it. Payments, subscriptions, credits, auth,
admin, sharing, media library, and i18n are already wired.

Built on [ShipAny](https://shipany.ai) (TanStack Start + Drizzle + better-auth).
It runs on Node or Cloudflare Workers without relying on a writable filesystem.

## What it does

The chat is an agent loop, not a prompt box. A message goes to an LLM with
three tools — `generate_image` (generation and reference-based editing),
`generate_video` (text-to-video), and `animate_image` (image-to-video). It
picks the right tool, writes the production prompt, and calls it.
That's why a user can say "slow push in on her while the background goes soft"
and get a clip back instead of a form to fill in.

Around that loop:

- **Agent-owned media routing** — the composer only asks users to upload from
  their device or choose something from their library. The agent decides
  whether each image, audio file, or video is a frame or reference input and
  maps it to the generation tool's parameters.
- **Video Lite-compatible composer** — MiniMax H3 and Seedance 2.5 expose the
  same duration, resolution, aspect-ratio, provider model mapping, and example
  behavior expected by Ideart's public workbench and chat UI.
- **Living showcase** — examples use a responsive masonry layout, load and
  autoplay only near the viewport, and open in a full-screen preview with
  “Use this prompt” and “Use as reference” actions.
- **Credits** — image prices come from a server-owned resolution/quality rate
  card; video prices are calculated per model and second. Credits are deducted
  atomically and refunded when a render fails or is canceled. The server
  verifies the exact tool price before submitting work to a provider.
- **Paywall that fits** — someone without a plan is shown plans; someone on a
  plan who ran dry is shown top-ups. The server decides which.
- **Providers** — EvoLink, gRouter, Fal, and Replicate, all configured in the
  admin panel. Separate image and video catalogs map each product model to the
  id its provider expects.
- **Renders take minutes, not seconds** — the tool polls for up to 15 minutes
  at a 5-second interval. The upstream and local task ids are persisted; the
  composer becomes a stop button while work is active, cancellation is sent
  upstream when supported, and stale unfinished transcript rows are shown as
  interrupted instead of spinning forever.
- **Stateless** — conversation history replays from the database each turn, and
  generated media goes straight to object storage. No session files, no disk.
- **Product shell included** — chat history, reusable media library, clip
  preview/download, public share pages, bilingual UI, billing, top-ups, and an
  admin settings/test surface are included.

## How generation works

```text
User message + uploaded/library media
  → agent chooses generate_image, generate_video, or animate_image
  → provider accepts an asynchronous task
  → server stores both task ids and polls every 5 seconds over the chat SSE
  → completed media is copied to object storage
  → tool result and final answer are persisted in the conversation
```

The active chat request owns the polling loop; this repository does not ship a
separate queue consumer. Task metadata is durable so the UI can recover the
correct active/interrupted state and cancel a provider task after navigation
or reconnection. If you need renders to survive server process restarts and
continue without an open request, move the same polling service behind a queue
or workflow runner.

The database schema includes `agent_turn_lease` for lease-aware Agent turns.
When the runtime lease code is enabled, deploy it only after the reviewed
migration has been applied and existing long-running requests have drained.
See [docs/agent-template.md](docs/agent-template.md) for the Prompt, audit,
history, and Turn concurrency contract.

## Quick start

```bash
pnpm install
cp .env.example .env.development     # set AUTH_SECRET at minimum
pnpm db:push                         # creates data/local.db
pnpm rbac:init --admin-email=you@example.com --admin-password=<pick-one>
pnpm dev                             # http://localhost:3000
```

Then sign in and open `/admin/settings` — **the app cannot generate anything
until you configure a chat model, media provider, and object storage there.**
Provider credentials are stored in the database rather than baked into env.

## Configure

Admin → Settings → **AI**:

| Group                | What to set                                                                                |
| -------------------- | ------------------------------------------------------------------------------------------ |
| **Chat Model**       | Default provider (`auto` prefers OpenAI, falls back to Anthropic), plus its model id       |
| **OpenAI**           | Base URL + API key. OpenAI-compatible gateways such as OpenRouter or Together also work    |
| **Anthropic**        | Base URL + API key when Claude should drive the agent                                      |
| **Image Generation** | GPT Image 2 route: `auto` prefers EvoLink, gRouter, Replicate, then Fal                    |
| **Video Generation** | Default route: `auto` prefers EvoLink, gRouter, then Fal, then Replicate                   |
| **EvoLink**          | Base URL + API key for GPT Image 2 and supported Seedance video models                     |
| **gRouter**          | Gateway base URL + API key for MiniMax, Seedance, and multimodal reference-to-video inputs |
| **Fal**              | API key for supported MiniMax and Seedance video routes                                    |
| **Replicate**        | API token for supported MiniMax routes                                                     |

Current model/provider support:

| Model        | EvoLink | gRouter | Fal | Replicate | Output                |
| ------------ | :-----: | :-----: | :-: | :-------: | --------------------- |
| GPT Image 2  |    ✓    |    ✓    |  ✓  |     ✓     | 1K / 2K / 4K images   |
| MiniMax H3   |    —    |    ✓    |  ✓  |     ✓     | 5–15s, 768P / 2K / 4K |
| Seedance 2.0 |    ✓    |    —    |  —  |     —     | 4–15s video           |
| Seedance 2.5 |    —    |    ✓    |  ✓  |     —     | 4–30s, 480p / 720p    |

Admin → Settings → **Storage** (Cloudflare R2 / S3). Generated media is uploaded there,
and **on Cloudflare Workers this is not optional** — there is no disk to fall
back to. Video files are much larger than images, so budget storage accordingly.
Composer attachments and bundled example media are published to
the same storage first, ensuring video providers receive a downloadable public
URL instead of a localhost or site-relative path.

Every group has a **Test** button that makes one real request, so you find out
a key is wrong before a user does. For Fal and Replicate that request queues a
real render on the cheapest model — it proves the account can reach the video
models, and it costs what one clip costs.

Also worth setting: Payment (Stripe/Creem/PayPal), Email (Resend or Cloudflare
Email) for verification mail, and Google OAuth.

## Make it yours

| What                | Where                                                                      |
| ------------------- | -------------------------------------------------------------------------- |
| Name, logo, favicon | `VITE_APP_NAME` / `VITE_APP_LOGO`, and `public/logo.*`, `public/favicon.*` |
| Theme colour        | `src/styles/globals.css` — one `oklch` hue drives accent and neutrals      |
| Landing copy        | `messages/en.json` + `messages/zh.json`, keys under `landing.*`            |
| Example gallery     | `src/components/agent/prompt-examples.ts`, `public/videos/showcase/`       |
| Models and prices   | Image/video model catalogs in `src/lib/agent-settings.ts`                  |
| Plans and top-ups   | `src/config/pricing.ts`                                                    |

A category's examples end at the first missing translation, so removing one is
an edit to `messages/*.json` — no code change.

**Set your credit prices against real cost — and check them before launch.**
The image catalog carries a server-owned resolution/quality credit matrix;
`AGENT_MODEL_OPTIONS` carries each video model's `creditsPerSecond` and
supported durations. The server rounds video prices to ten credits. Provider
pricing moves fast, so verify every rate before taking money. Change a model
and you must redo that arithmetic, or you may sell generations below cost.
Plans can hand out credits more cheaply than the top-up rate, so check the
cheapest tier, not only the standard one.

Also revisit **Admin → Settings → General → Credits**. With the catalog shipped
here, a default 5-second MiniMax H3 render at 2K costs 550 credits; signup
grants, plans, and top-ups should be sized accordingly.

## Deploy to Cloudflare Workers

The build target is `cloudflare_module`; nitro merges your `wrangler.jsonc`
into the generated config. Database is D1.

### 1. Config file

```bash
cp wrangler.example.jsonc wrangler.jsonc     # gitignored — holds real ids
```

Set `name` to your worker name and `vars.VITE_APP_NAME`. Note that
`wrangler d1 create` suggests a binding named after the database — ignore it
and keep `"binding": "DB"`, which is the name the code looks for.

### 2. Create the database

```bash
npx wrangler login
npx wrangler d1 create <your-db-name>
```

Paste the returned `database_id` into `wrangler.jsonc`, and set
`database_name` to match.

### 3. Push the schema

Migrations are generated locally and applied remotely:

```bash
pnpm db:generate                                        # writes drizzle/
npx wrangler d1 migrations apply <your-db-name> --remote
```

Review generated SQL before applying it. The checked-in D1/SQLite migrations
are not portable to PostgreSQL or MySQL; regenerate and review migrations under
the chosen provider before applying them there.

### 4. Seed roles and permissions

`rbac:init` talks to a database over libsql, which can't reach remote D1. Run
it against wrangler's **local** D1 — a plain SQLite file — and copy the rows
up:

```bash
npx wrangler d1 migrations apply <your-db-name> --local

# miniflare keeps its own metadata.sqlite next to the database — skip it or
# you will seed the wrong file and the copy below comes out empty.
LOCAL_D1=$(find .wrangler/state -path '*d1*' -name '*.sqlite' ! -name 'metadata.sqlite' | head -1)
DATABASE_PROVIDER=sqlite DATABASE_URL="file:$LOCAL_D1" pnpm rbac:init

sqlite3 "$LOCAL_D1" ".dump role permission role_permission" \
  | grep '^INSERT INTO' | sed 's/^INSERT INTO/INSERT OR IGNORE INTO/' > /tmp/rbac.sql
npx wrangler d1 execute <your-db-name> --remote --file=/tmp/rbac.sql
```

### 5. Secrets

Never put these in `vars` — that block is public.

```bash
openssl rand -base64 32 | npx wrangler secret put AUTH_SECRET
openssl rand -base64 32 | npx wrangler secret put CONFIG_ENCRYPTION_KEY
```

### 6. Production URL — in two places

```bash
cat > .env.production <<'EOF'
VITE_APP_URL=https://your-domain.com
VITE_APP_NAME=Your App
DATABASE_PROVIDER=d1
EOF
```

Then set the **same** `VITE_APP_URL` in `wrangler.jsonc` `vars`. Both are
needed and for different reasons: `.env.production` is read at build time and
baked into the bundle, while `vars` is what the server reads at runtime.
Miss the second and better-auth rejects every sign-in with `Invalid origin`.

For a custom domain, add it to `wrangler.jsonc` — the zone must already be in
your Cloudflare account:

```jsonc
"routes": [{ "pattern": "your-domain.com", "custom_domain": true }]
```

### 7. Deploy

```bash
pnpm cf:deploy
```

That sources `.env.production`, builds with the Cloudflare preset, and runs
`wrangler deploy`.

If this project later adds a private Agent Skills release system, publish and
verify the release before `pnpm cf:deploy`, pin `AGENT_SKILLS_RELEASE` in
`wrangler.jsonc`, and bind the private R2 bucket as `AGENT_SKILLS`. Ideart does
not vendor the source project's private 122-Skill bundle by default.

### 8. Admin account

Sign up through the site, then grant yourself the role:

```bash
npx wrangler d1 execute <your-db-name> --remote --command="
  INSERT INTO user_role (id, user_id, role_id)
  SELECT lower(hex(randomblob(16))),
         (SELECT id FROM user WHERE email='you@example.com'),
         (SELECT id FROM role WHERE name='super_admin')"
```

Now open `/admin/settings` on the live site and fill in the providers — the
production database starts empty, and none of your local configuration
travels with the deploy.

### Redeploying

`pnpm cf:deploy` again. Secrets, database and settings persist; only the code
and the baked env change.

## Deploy elsewhere

`pnpm build && pnpm start` runs the Node build on any host. A `Dockerfile` is
included. Postgres and MySQL are supported via `DATABASE_PROVIDER` — run
`pnpm db:setup` after changing it to swap the schema template. Object storage
is still required for generated media.

## Commands

| Command            | What it does                               |
| ------------------ | ------------------------------------------ |
| `pnpm dev`         | Dev server on port 3000                    |
| `pnpm build`       | Production Node build                      |
| `pnpm start`       | Run the production build                   |
| `pnpm test`        | Unit tests (Vitest)                        |
| `pnpm cf:build`    | Production Cloudflare Workers build        |
| `pnpm cf:deploy`   | Build and deploy to Cloudflare Workers     |
| `pnpm db:push`     | Sync schema to the database — dev only     |
| `pnpm db:generate` | Write a migration to `drizzle/`            |
| `pnpm db:migrate`  | Apply pending migrations                   |
| `pnpm db:studio`   | Drizzle Studio                             |
| `pnpm rbac:init`   | Seed roles and permissions, optional admin |

Optional Skill release scripts, when present in a future Ideart build, should
run before `pnpm cf:deploy` so the Worker points at an immutable R2 release.

## Structure

```
src/
├── modules/agent/          # Agent runtime, tools, provider polling, paywall
├── modules/ai-tasks/       # Durable task status and credit refund lifecycle
├── modules/chats/          # Chat history, sharing, and generated-media library
├── core/ai/                # EvoLink, gRouter, Fal, and Replicate adapters
├── routes/(agent)/         # Chat, library, and editor surfaces
├── routes/api/agent/       # Chat SSE, history/status, stop, library, CRUD
├── routes/admin/           # Admin settings, provider tests, chat inspection
├── components/agent/       # Composer, transcript, preview pane, sidebar
├── lib/agent-settings.ts   # Model catalog, capabilities, prices, route mapping
└── config/pricing.ts       # Plans and top-up packs

product/messages/{en,zh}.json # All copy, flat dot-keyed
product/agent.json          # Ideart Agent identity and default Prompt
product/catalog/*.json      # Public tool/model Catalog (empty until published)
product/marketing/          # Versioned marketing content sources
product/skills/             # Optional private Skills (empty until published)
public/videos/showcase/     # Bundled masonry example clips
```

## License

Proprietary. See [LICENSE](./LICENSE).

**ShipAny** — [shipany.ai](https://shipany.ai)
