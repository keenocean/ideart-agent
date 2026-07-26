# ShipAny Image Agent

A complete AI image product, ready to rebrand and ship. Users describe an edit
in plain language; an agent decides which tool to call, generates or edits the
image, and charges credits for it. Payments, subscriptions, credits, auth,
admin panel and i18n are already wired — you change the branding, the examples
and the prices.

Built on [ShipAny](https://shipany.ai) (TanStack Start + Drizzle + better-auth).
It deploys to Cloudflare Workers with no filesystem and no background workers.

## What it does

The chat is an agent loop, not a prompt box. A message goes to an LLM that has
two tools — `generate_image` and `edit_image` — and it picks one, writes the
prompt, and calls it. That's why a user can say "make the background white and
keep her hair" and get one image back instead of a form to fill in.

Around that loop:

- **Credits** — priced per model from a catalog, deducted atomically, refunded
  when generation fails. The turn is refused up front when the balance is
  short, so nobody pays for an LLM turn that ends in a paywall.
- **Paywall that fits** — someone without a plan is shown plans; someone on a
  plan who ran dry is shown top-ups. The server decides which.
- **Providers** — Replicate and Fal, both configured in the admin panel. The
  composer's model list maps each model to the id every provider knows it by,
  so switching provider doesn't change what the user picked.
- **Stateless** — conversation history replays from the database each turn, and
  generated images go straight to object storage. No session files, no disk.

## Quick start

```bash
pnpm install
cp .env.example .env.development     # set AUTH_SECRET at minimum
pnpm db:push                         # creates data/local.db
pnpm rbac:init --admin-email=you@example.com --admin-password=<pick-one>
pnpm dev                             # http://localhost:3000
```

Then sign in and open `/admin/settings` — **the app cannot generate anything
until you configure it there.** Nothing is baked into env.

## Configure

Admin → Settings → **AI**:

| Group                | What to set                                                                              |
| -------------------- | ---------------------------------------------------------------------------------------- |
| **Chat Model**       | Default provider (`auto` prefers OpenAI, falls back to Anthropic), and the model id      |
| **OpenAI**           | Base URL + API key. Any OpenAI-compatible gateway works — OpenRouter, Together, your own |
| **Anthropic**        | Base URL + API key, if you'd rather drive the agent with Claude                          |
| **Image Generation** | Default provider, then the **Replicate** token or **Fal** key in the groups below        |

Admin → Settings → **Storage** (Cloudflare R2 / S3). Generated images are uploaded there,
and **on Cloudflare Workers this is not optional** — there is no disk to fall
back to.

Every group has a **Test** button that makes one real request, so you find out
a key is wrong before a user does.

Also worth setting: Payment (Stripe/Creem/PayPal), Email (Resend or Cloudflare
Email) for verification mail, and Google OAuth.

## Make it yours

| What                | Where                                                                      |
| ------------------- | -------------------------------------------------------------------------- |
| Name, logo, favicon | `VITE_APP_NAME` / `VITE_APP_LOGO`, and `public/logo.*`, `public/favicon.*` |
| Theme colour        | `src/styles/globals.css` — one `oklch` hue drives accent and neutrals      |
| Landing copy        | `messages/en.json` + `messages/zh.json`, keys under `landing.*`            |
| Example gallery     | `src/components/agent/prompt-examples.ts` + `landing.examples.*`           |
| Models and prices   | `AGENT_MODEL_OPTIONS` in `src/lib/agent-settings.ts`                       |
| Plans and top-ups   | `src/config/pricing.ts`                                                    |

A category's examples end at the first missing translation, so removing one is
an edit to `messages/*.json` — no code change.

**Set your credit prices against real cost.** `AGENT_MODEL_OPTIONS` carries a
`credits` figure per model; the comment above it records what each model costs
upstream and the ruler used (200 credits per dollar at the top-up rate). Change
the models and you must redo that arithmetic, or you will sell images below
cost. Note that plans hand out credits more cheaply than the top-up rate, so
check the cheapest tier, not the standard one.

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
is still required for generated images.

## Commands

| Command            | What it does                               |
| ------------------ | ------------------------------------------ |
| `pnpm dev`         | Dev server on port 3000                    |
| `pnpm build`       | Production build                           |
| `pnpm start`       | Run the production build                   |
| `pnpm test`        | Unit tests (vitest)                        |
| `pnpm db:push`     | Sync schema to the database — dev only     |
| `pnpm db:generate` | Write a migration to `drizzle/`            |
| `pnpm db:migrate`  | Apply pending migrations                   |
| `pnpm db:studio`   | Drizzle Studio                             |
| `pnpm rbac:init`   | Seed roles and permissions, optional admin |
| `pnpm cf:deploy`   | Build and deploy to Cloudflare Workers     |

## Structure

```
src/
├── modules/agent/      # The agent: runtime, tools, history replay, paywall
├── modules/            # credits, payment, subscriptions, chats, rbac, config
├── core/               # db, auth, payment, email, storage, ai providers
├── routes/(agent)/     # Chat, library, chat list
├── routes/api/agent/   # Chat SSE endpoint, library, chat CRUD
├── routes/admin/       # Admin panel
├── components/agent/   # Composer, transcript, preview pane, sidebar
├── lib/agent-settings.ts   # Model catalog, credit prices, provider mapping
└── config/pricing.ts       # Plans and top-up packs

messages/{en,zh}.json   # All copy, flat dot-keyed
```

## License

Proprietary. See [LICENSE](./LICENSE).

**ShipAny** — [shipany.ai](https://shipany.ai)
