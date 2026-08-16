# Product Skills

This directory is the product-owned source for optional Agent Skills. The
template intentionally ships with an empty Catalog so each downstream product
can choose its own Skills without changing the platform runtime.

`catalog.json` is always required. An empty Catalog is valid:

```json
{
  "schemaVersion": 1,
  "skills": []
}
```

To add a prompt-only Skill:

1. Create `product/skills/<slug>/SKILL.md`.
2. Add a matching entry to `catalog.json`. Its `relativeDir` must remain under
   this directory.
3. Set `compatibilityTier` to `native` and keep both `allowedTools` and
   `unmappedTools` empty. Skills that need executable tools require a runtime
   adapter and are not published by the prompt-only release builder.
4. Run `pnpm skills:build` and the Agent Skill tests.

The builder writes a content-addressed release under `.agent-skills/`. Do not
commit that generated directory. Production releases are stored in private R2
and activated through the pinned `AGENT_SKILLS_RELEASE` value. See
`docs/agent-skills-r2.md` for publishing and rollback details.
