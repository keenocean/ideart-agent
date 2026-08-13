# Workspace Inspector Report Format

The inspector produces both Markdown and JSON.

## Markdown Sections

- Workspace: root path, generation time, and scan limits.
- Summary: total files, directories, byte size, skipped directories, and sensitive file count.
- Detected Project Type: lightweight signals such as package.json, tsconfig, pyproject, or README files.
- Key Files: known project/config/documentation files found near the root.
- Package Summary: package manager, scripts, dependencies, and dev dependencies when package.json exists.
- Environment Variables: variable names from example/template env files only.
- Largest Files: largest regular files under the scan limit.
- Extension Counts: most common file extensions.
- Sensitive Files: sensitive-looking paths present, without contents.
- Suggested Next Reads: small set of files worth opening next.

## JSON Top-level Fields

```json
{
  "generatedAt": "ISO-8601 timestamp",
  "root": "/workspace",
  "limits": {},
  "summary": {},
  "projectTypes": [],
  "keyFiles": [],
  "package": {},
  "envExampleKeys": [],
  "largestFiles": [],
  "extensionCounts": [],
  "sensitiveFiles": [],
  "suggestedNextReads": []
}
```

The JSON is intended for other tools. It should not include file contents, secret values, or provider credentials.
