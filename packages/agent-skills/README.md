# Default App Runtime Skills

`skills/default` is the legacy App-side mirror used by the first manual sync
flow. The canonical source for FastClaw App runtime skills is now:

```text
fastclaw/app-runtime-skills/*
```

Migration principles are documented in
`docs/agent/06-fastclaw-skill-migration-guidelines.md`. Use that guideline
before changing FastClaw core behavior or migrating another App runtime skill.
Use `docs/agent/07-app-runtime-skill-migration-template.md` as the copyable
checklist for each new non-paid App runtime skill.

FastClaw embeds that directory into the binary and installs it on gateway
startup to:

```text
${FASTCLAW_HOME:-~/.fastclaw}/app-runtime-skills/*
```

The runtime loader scans that directory by default, so new deployments no
longer need `skills.load.extraDirs` just to see App-provided runtime skills.
An existing `skills.load.extraDirs: ["/data/.fastclaw/app-runtime-skills"]`
setting is harmless but no longer required.

## New Skill Flow

Use this flow for each new non-paid App runtime skill:

1. Add the skill under `fastclaw/app-runtime-skills/<name>/`.
2. Keep it self-contained:
   - `SKILL.md` at the skill root.
   - `scripts/` for executable helpers.
   - `references/` for extra instructions or schemas.
   - outputs written to `/workspace`.
3. Sync the Go embed copy before committing:

```bash
cd fastclaw
make bundle-skills
```

4. Rebuild/redeploy FastClaw. On startup, FastClaw installs or upgrades the
   embedded skills into `/data/.fastclaw/app-runtime-skills` using a
   `.app-runtime-hash` sidecar. If an operator modified the on-disk skill, the
   startup installer skips it instead of overwriting local changes.
5. Open a new FastClaw chat and verify:

```text
load_skill("<name>")
```

For behavior verification, ask the agent to use the skill and check that any
expected `/workspace` outputs are created. Do not use `GET /api/skills` as the
only acceptance check; that endpoint can list the managed
`$FASTCLAW_HOME/skills` directory and is not equivalent to runtime
`load_skill` discovery.

Do not make `$FASTCLAW_HOME/skills` the target for App runtime skills; that
directory is reserved for FastClaw managed/global installs and user/agent skill
management.
