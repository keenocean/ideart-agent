# R2-backed Agent Skills

This project keeps Agent Skill source in Git but stores deployable Skill
content in a private Cloudflare R2 bucket. The Worker bundle contains only the
registry loader and validation code; it never imports `SKILL.md`, references,
scripts, or assets.

## Architecture contract

| Layer                         | Responsibility                                                 |
| ----------------------------- | -------------------------------------------------------------- |
| `packages/agent-skills`       | Authoring source and `catalog.json`                            |
| `.agent-skills`               | Generated local releases; ignored by Git                       |
| private R2 bucket             | Immutable production release objects                           |
| Worker `AGENT_SKILLS` binding | Read-only runtime access to the private bucket                 |
| `AGENT_SKILLS_RELEASE`        | Pinned SHA-256 release activated by a Worker deployment        |
| D1                            | Product state, permissions, and chat data; never Skill bodies  |
| Sandbox                       | Future execution of script-based Skills and their dependencies |

The R2 bucket used for Skills must be separate from the admin-configured
bucket used for generated user media. Do not expose an `r2.dev` URL or custom
public domain for the Skill bucket.

## Release layout

```text
agent-skills/releases/<release-id>/manifest.json
agent-skills/releases/<release-id>/skills/<slug>.json
```

Each Skill object contains its `SKILL.md` instructions and a map of Markdown
references. This makes a selected Skill one R2 read after the manifest has
been cached. The manifest records every object's byte length and SHA-256; the
runtime rejects missing, oversized, malformed, or tampered objects.

The release ID is derived from the manifest contents. Objects are uploaded
first and the manifest last. Production does not use a mutable `latest`
pointer: deployment atomically activates a release by pinning
`AGENT_SKILLS_RELEASE`, which also makes rollback deterministic.

## Local development

`pnpm dev`, `pnpm build`, and `pnpm cf:build` run `pnpm skills:build` first.
The generator writes an immutable release and `.agent-skills/current.json`.
Node development reads this local release. A Cloudflare Worker never falls
back to local files if its R2 binding or release variable is missing.

Generate a release explicitly:

```bash
pnpm skills:build
```

Set `AGENT_SKILLS_LOCAL_ROOT` only when a consuming project wants the local
release directory somewhere other than `.agent-skills`.

## First Cloudflare setup

Create a dedicated private bucket:

```bash
npx wrangler r2 bucket create <worker-name>-agent-skills
```

Configure the binding and release variable in `wrangler.jsonc`:

```jsonc
{
  "vars": {
    "AGENT_SKILLS_RELEASE": "<64-character release id>",
  },
  "r2_buckets": [
    {
      "binding": "AGENT_SKILLS",
      "bucket_name": "<worker-name>-agent-skills",
    },
  ],
}
```

Publish and verify the release, then update the configured release ID:

```bash
pnpm skills:publish -- --bucket=<worker-name>-agent-skills
```

`skills:publish` uses the authenticated Wrangler CLI, uploads the immutable
objects, downloads them again to verify their hashes, and only then updates
`vars.AGENT_SKILLS_RELEASE` in `wrangler.jsonc`. It does not deploy the Worker.

Deploy only after the publish succeeds:

```bash
pnpm cf:deploy
```

## Updating or rolling back

1. Change source under `packages/agent-skills`.
2. Run `pnpm skills:publish -- --bucket=<bucket>`.
3. Review the new release ID in `wrangler.jsonc`.
4. Deploy the Worker.

To roll back, restore a previous release ID in `wrangler.jsonc` and redeploy.
Immutable release objects should be retained while any deployable Worker
version references them.

## Reusing in another project

Copy these files and preserve their public contracts:

- `scripts/agent-skills-release.mjs`
- `scripts/check-agent-skills-bundle.mjs`
- `src/modules/agent/skill-registry.ts`
- `src/modules/agent/skill-store.ts`

The consuming project must:

1. provide `packages/agent-skills/catalog.json` and per-Skill `SKILL.md` files;
2. add the package scripts and `.agent-skills/` ignore rule;
3. stash Cloudflare bindings before route execution, or replace
   `getDefaultSkillRegistry()` with its own dependency injection;
4. bind a private R2 bucket as `AGENT_SKILLS`;
5. pin `AGENT_SKILLS_RELEASE` during deployment.

The current release builder intentionally publishes only prompt-only entries:
`compatibilityTier === "native"`, with no `allowedTools` or `unmappedTools`.
Script-based Skills remain unavailable until a Sandbox adapter supplies their
declared tools.

## Failure behavior

- No Skill selected: chat runs without touching R2.
- Unsupported Skill: chat returns HTTP 400.
- Missing binding, missing release, R2 failure, or invalid release: Skill list
  and selected-Skill chat return HTTP 503.
- Cached immutable manifests and Skill objects are reused within a Worker
  isolate; failures are not cached, so a later request can recover.

`pnpm skills:check-bundle` scans the server output for known source markers.
It is part of both Node and Cloudflare post-build validation and fails the
build if Skill content is accidentally reintroduced into the Worker bundle.
