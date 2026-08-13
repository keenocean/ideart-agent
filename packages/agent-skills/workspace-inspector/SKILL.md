---
name: workspace-inspector
description: Inspect a sandbox workspace and produce a concise project inventory. Use when the user asks to understand a codebase, summarize workspace contents, prepare a handoff, or inspect files before making changes.
metadata:
  fastclaw:
    always: false
---

# Workspace Inspector

Use this skill to inspect the current sandbox workspace before editing, debugging, migration, or handoff work.

## Run

Run the bundled inspector script from the sandbox:

```bash
python3 /skills/workspace-inspector/scripts/inspect_workspace.py \
  --root /workspace \
  --markdown /workspace/workspace-inspection.md \
  --json /workspace/workspace-inspection.json
```

If `python3` is unavailable, retry with `python`.

## Output

The script writes:

- `/workspace/workspace-inspection.md` - human-readable project inventory.
- `/workspace/workspace-inspection.json` - structured inventory for later tools.

After the script finishes, summarize the markdown report for the user and mention the two output paths.

## Safety

- Inspect only `/workspace` unless the user explicitly gives another workspace root.
- Do not read or print secrets. The script reports sensitive file paths, but does not read their contents.
- Do not modify project files other than the two report outputs requested above.
- Do not install packages. The script uses only Python standard library.

## Notes

Read `references/report-format.md` if you need the report schema or want to explain the output fields.
