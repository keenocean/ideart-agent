#!/usr/bin/env python3
"""Inspect a sandbox workspace and write Markdown/JSON inventory reports."""

from __future__ import annotations

import argparse
import json
import os
import re
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


DEFAULT_IGNORE_DIRS = {
    ".git",
    ".hg",
    ".svn",
    ".next",
    ".nuxt",
    ".output",
    ".tanstack",
    ".turbo",
    ".cache",
    ".parcel-cache",
    ".vite",
    "node_modules",
    "bower_components",
    "vendor",
    "dist",
    "build",
    "coverage",
    "__pycache__",
    ".pytest_cache",
    ".mypy_cache",
    ".ruff_cache",
}

KEY_FILE_NAMES = {
    "README.md",
    "AGENTS.md",
    "CLAUDE.md",
    "package.json",
    "pnpm-lock.yaml",
    "package-lock.json",
    "yarn.lock",
    "bun.lockb",
    "tsconfig.json",
    "vite.config.ts",
    "next.config.ts",
    "next.config.js",
    "Dockerfile",
    "docker-compose.yml",
    "wrangler.jsonc",
    "wrangler.toml",
    "pyproject.toml",
    "requirements.txt",
    "Cargo.toml",
    "go.mod",
}

ENV_EXAMPLE_NAMES = {
    ".env.example",
    ".env.template",
    ".env.sample",
    "env.example",
    "env.template",
    "env.sample",
}

SENSITIVE_NAME_RE = re.compile(
    r"(^|/)(\.env($|\.)|.*\.(pem|key|p12|pfx|jks|keystore|kdbx)$|"
    r"id_rsa$|id_ed25519$|credentials(\..*)?$|secrets?(\..*)?$)",
    re.IGNORECASE,
)

ENV_KEY_RE = re.compile(r"^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Inspect a workspace and write inventory reports.")
    parser.add_argument("--root", default="/workspace", help="Workspace root to inspect.")
    parser.add_argument("--markdown", default="/workspace/workspace-inspection.md", help="Markdown report path.")
    parser.add_argument("--json", default="/workspace/workspace-inspection.json", help="JSON report path.")
    parser.add_argument("--max-files", type=int, default=5000, help="Maximum files to scan.")
    parser.add_argument("--max-depth", type=int, default=8, help="Maximum directory depth from root.")
    parser.add_argument("--top", type=int, default=20, help="Number of largest/common entries to include.")
    return parser.parse_args()


def resolve_under_root(path: str, root: Path) -> Path:
    resolved = Path(path).expanduser().resolve()
    root_resolved = root.resolve()
    if resolved != root_resolved and root_resolved not in resolved.parents:
        raise SystemExit(f"Refusing to write outside workspace root: {resolved}")
    return resolved


def relpath(path: Path, root: Path) -> str:
    value = path.relative_to(root).as_posix()
    return value or "."


def is_sensitive(rel: str) -> bool:
    name = Path(rel).name
    if name in ENV_EXAMPLE_NAMES:
        return False
    return bool(SENSITIVE_NAME_RE.search(rel))


def file_ext(path: Path) -> str:
    name = path.name
    if name in {"Dockerfile", "Makefile"}:
        return name
    suffix = path.suffix.lower()
    return suffix if suffix else "[no extension]"


def walk_workspace(root: Path, max_files: int, max_depth: int) -> dict[str, Any]:
    files: list[dict[str, Any]] = []
    key_files: list[str] = []
    sensitive_files: list[str] = []
    extension_counts: Counter[str] = Counter()
    skipped_dirs: Counter[str] = Counter()
    total_bytes = 0
    dir_count = 0
    truncated = False

    for current, dirnames, filenames in os.walk(root, topdown=True, followlinks=False):
        current_path = Path(current)
        depth = len(current_path.relative_to(root).parts)
        if depth >= max_depth:
            if dirnames:
                skipped_dirs["max_depth"] += len(dirnames)
            dirnames[:] = []

        kept_dirs = []
        for dirname in sorted(dirnames):
            if dirname in DEFAULT_IGNORE_DIRS:
                skipped_dirs[dirname] += 1
                continue
            kept_dirs.append(dirname)
        dirnames[:] = kept_dirs
        dir_count += len(kept_dirs)

        for filename in sorted(filenames):
            path = current_path / filename
            if path.is_symlink():
                continue
            try:
                stat = path.stat()
            except OSError:
                continue
            if not path.is_file():
                continue

            rel = relpath(path, root)
            item = {
                "path": rel,
                "size": stat.st_size,
                "extension": file_ext(path),
                "sensitive": is_sensitive(rel),
            }
            files.append(item)
            total_bytes += stat.st_size
            extension_counts[item["extension"]] += 1

            if filename in KEY_FILE_NAMES or filename in ENV_EXAMPLE_NAMES:
                key_files.append(rel)
            if item["sensitive"]:
                sensitive_files.append(rel)

            if len(files) >= max_files:
                truncated = True
                break
        if truncated:
            break

    return {
        "files": files,
        "keyFiles": sorted(set(key_files)),
        "sensitiveFiles": sorted(set(sensitive_files)),
        "extensionCounts": extension_counts,
        "skippedDirs": dict(sorted(skipped_dirs.items())),
        "summary": {
            "fileCount": len(files),
            "dirCount": dir_count,
            "totalBytes": total_bytes,
            "truncated": truncated,
        },
    }


def detect_project_types(key_files: list[str]) -> list[str]:
    keys = set(key_files)
    out: list[str] = []
    if "package.json" in keys:
        out.append("node")
    if "tsconfig.json" in keys:
        out.append("typescript")
    if "vite.config.ts" in keys:
        out.append("vite")
    if "next.config.ts" in keys or "next.config.js" in keys:
        out.append("next")
    if "pyproject.toml" in keys or "requirements.txt" in keys:
        out.append("python")
    if "go.mod" in keys:
        out.append("go")
    if "Cargo.toml" in keys:
        out.append("rust")
    if "wrangler.jsonc" in keys or "wrangler.toml" in keys:
        out.append("cloudflare")
    if "Dockerfile" in keys or "docker-compose.yml" in keys:
        out.append("containerized")
    return out or ["unknown"]


def read_json_file(path: Path) -> dict[str, Any] | None:
    try:
        with path.open("r", encoding="utf-8") as handle:
            data = json.load(handle)
    except (OSError, json.JSONDecodeError, UnicodeDecodeError):
        return None
    return data if isinstance(data, dict) else None


def package_summary(root: Path) -> dict[str, Any]:
    package_json = read_json_file(root / "package.json")
    if not package_json:
        return {}
    return {
        "name": package_json.get("name"),
        "version": package_json.get("version"),
        "packageManager": package_json.get("packageManager"),
        "scripts": sorted((package_json.get("scripts") or {}).keys()),
        "dependencies": sorted((package_json.get("dependencies") or {}).keys()),
        "devDependencies": sorted((package_json.get("devDependencies") or {}).keys()),
    }


def env_example_keys(root: Path, key_files: list[str]) -> list[str]:
    keys: set[str] = set()
    for rel in key_files:
        if Path(rel).name not in ENV_EXAMPLE_NAMES:
            continue
        path = root / rel
        try:
            for line in path.read_text(encoding="utf-8", errors="replace").splitlines():
                match = ENV_KEY_RE.match(line)
                if match:
                    keys.add(match.group(1))
        except OSError:
            continue
    return sorted(keys)


def suggested_reads(key_files: list[str], files: list[dict[str, Any]]) -> list[str]:
    priority = [
        "AGENTS.md",
        "README.md",
        "package.json",
        "tsconfig.json",
        "vite.config.ts",
        "src/routes/__root.tsx",
        "src/router.tsx",
        "src/core/fastclaw/index.ts",
    ]
    file_paths = {item["path"] for item in files}
    out = [path for path in priority if path in file_paths or path in key_files]
    for rel in key_files:
        if rel not in out and len(out) < 12:
            out.append(rel)
    return out[:12]


def human_bytes(size: int) -> str:
    units = ["B", "KB", "MB", "GB"]
    value = float(size)
    for unit in units:
        if value < 1024 or unit == units[-1]:
            return f"{value:.1f} {unit}" if unit != "B" else f"{int(value)} B"
        value /= 1024
    return f"{size} B"


def render_markdown(report: dict[str, Any]) -> str:
    lines: list[str] = []
    summary = report["summary"]
    limits = report["limits"]

    lines.append("# Workspace Inspection")
    lines.append("")
    lines.append(f"- Root: `{report['root']}`")
    lines.append(f"- Generated: `{report['generatedAt']}`")
    lines.append(f"- Limits: max files `{limits['maxFiles']}`, max depth `{limits['maxDepth']}`")
    lines.append("")

    lines.append("## Summary")
    lines.append("")
    lines.append(f"- Files scanned: `{summary['fileCount']}`")
    lines.append(f"- Directories scanned: `{summary['dirCount']}`")
    lines.append(f"- Total bytes: `{human_bytes(summary['totalBytes'])}`")
    lines.append(f"- Truncated: `{str(summary['truncated']).lower()}`")
    lines.append(f"- Sensitive-looking files: `{len(report['sensitiveFiles'])}`")
    if report["skippedDirs"]:
        skipped = ", ".join(f"`{name}` x {count}" for name, count in report["skippedDirs"].items())
        lines.append(f"- Skipped dirs: {skipped}")
    lines.append("")

    lines.append("## Detected Project Type")
    lines.append("")
    for item in report["projectTypes"]:
        lines.append(f"- `{item}`")
    lines.append("")

    lines.append("## Key Files")
    lines.append("")
    for path in report["keyFiles"][:30] or ["(none)"]:
        lines.append(f"- `{path}`")
    lines.append("")

    if report["package"]:
        pkg = report["package"]
        lines.append("## Package Summary")
        lines.append("")
        if pkg.get("name"):
            lines.append(f"- Name: `{pkg['name']}`")
        if pkg.get("packageManager"):
            lines.append(f"- Package manager: `{pkg['packageManager']}`")
        if pkg.get("scripts"):
            lines.append(f"- Scripts: {', '.join(f'`{x}`' for x in pkg['scripts'])}")
        if pkg.get("dependencies"):
            deps = pkg["dependencies"][:30]
            lines.append(f"- Dependencies: {', '.join(f'`{x}`' for x in deps)}")
        if pkg.get("devDependencies"):
            deps = pkg["devDependencies"][:30]
            lines.append(f"- Dev dependencies: {', '.join(f'`{x}`' for x in deps)}")
        lines.append("")

    lines.append("## Environment Variable Names From Examples")
    lines.append("")
    for key in report["envExampleKeys"][:60] or ["(none)"]:
        lines.append(f"- `{key}`")
    lines.append("")

    lines.append("## Largest Files")
    lines.append("")
    for item in report["largestFiles"]:
        lines.append(f"- `{item['path']}` - {human_bytes(item['size'])}")
    lines.append("")

    lines.append("## Extension Counts")
    lines.append("")
    for ext, count in report["extensionCounts"]:
        lines.append(f"- `{ext}`: {count}")
    lines.append("")

    lines.append("## Sensitive Files")
    lines.append("")
    if report["sensitiveFiles"]:
        lines.append("Contents were not read.")
        lines.append("")
        for path in report["sensitiveFiles"][:40]:
            lines.append(f"- `{path}`")
    else:
        lines.append("(none)")
    lines.append("")

    lines.append("## Suggested Next Reads")
    lines.append("")
    for path in report["suggestedNextReads"] or ["(none)"]:
        lines.append(f"- `{path}`")
    lines.append("")

    return "\n".join(lines)


def build_report(args: argparse.Namespace) -> dict[str, Any]:
    root = Path(args.root).expanduser().resolve()
    if not root.exists() or not root.is_dir():
        raise SystemExit(f"Workspace root does not exist or is not a directory: {root}")

    walked = walk_workspace(root, args.max_files, args.max_depth)
    files = walked["files"]
    largest = sorted(files, key=lambda item: item["size"], reverse=True)[: args.top]
    ext_counts = walked["extensionCounts"].most_common(args.top)
    key_files = walked["keyFiles"]

    return {
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "root": str(root),
        "limits": {
            "maxFiles": args.max_files,
            "maxDepth": args.max_depth,
            "top": args.top,
        },
        "summary": walked["summary"],
        "skippedDirs": walked["skippedDirs"],
        "projectTypes": detect_project_types(key_files),
        "keyFiles": key_files,
        "package": package_summary(root),
        "envExampleKeys": env_example_keys(root, key_files),
        "largestFiles": largest,
        "extensionCounts": ext_counts,
        "sensitiveFiles": walked["sensitiveFiles"],
        "suggestedNextReads": suggested_reads(key_files, files),
    }


def main() -> None:
    args = parse_args()
    root = Path(args.root).expanduser().resolve()
    markdown_path = resolve_under_root(args.markdown, root)
    json_path = resolve_under_root(args.json, root)

    report = build_report(args)
    markdown_path.parent.mkdir(parents=True, exist_ok=True)
    json_path.parent.mkdir(parents=True, exist_ok=True)
    markdown_path.write_text(render_markdown(report), encoding="utf-8")
    json_path.write_text(json.dumps(report, indent=2, sort_keys=True) + "\n", encoding="utf-8")

    print("workspace inspection complete")
    print(f"markdown: {markdown_path}")
    print(f"json: {json_path}")
    print(f"files scanned: {report['summary']['fileCount']}")
    print(f"sensitive files reported without contents: {len(report['sensitiveFiles'])}")


if __name__ == "__main__":
    main()
