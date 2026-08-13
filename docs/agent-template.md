# Agent Template

Ideart ships one `primary` conversational Agent for image and video generation. A product rebrand normally changes only [`src/config/agent.ts`](../src/config/agent.ts):

- `id`: stable audit identity; keep `primary` unless persisted identity is intentionally changing.
- `name`: product-facing Agent name.
- `defaultSystemPrompt`: version-controlled business behavior.
- `maxTurns`: maximum SDK loop count.

Do not rename or move `generate_image`, `generate_video`, `animate_image`, `mediaMode`, composer settings, SSE events, API request fields, AI task statuses, or browser storage keys as part of a rebrand. Image/video tools, providers, storage, credits, Stop, history, composer controls, and renderers are template capabilities, not a project adapter.

## Prompt Boundary

The effective System Prompt should be assembled in this fixed order:

1. code-owned Core Guardrails;
2. the project business Prompt;
3. the capability policy generated from tools actually registered for the Turn;
4. the selected private Skill, when the project enables Skill releases.

Admins with `admin.settings.read`/`admin.settings.write` can read or change only layer 2 at `/admin/settings`. The database key is `agent_system_prompt`; blank means "use the project default." The server should accept only `{{app_name}}`, `{{agent_name}}`, and `{{available_tools}}`, with a 20 KiB UTF-8 limit, and validate on write and each Turn. Read the latest value directly from the primary database path; do not rely on the one-hour general configuration cache for prompts.

Prompt text, Guardrails, Skill source, and Turn Context never belong in chat metadata, ordinary chat APIs, public config, share responses, logs, or browser bundles. Logs and audit records should contain identity only:

- `businessPromptHash`: SHA-256 of the selected business template before substitution;
- `effectivePromptHash`: SHA-256 of the final Prompt sent to the SDK;
- source, byte lengths, model, Skill release when enabled, and actual tool names.

A hash proves identity; it cannot reconstruct historical Prompt text. Add an explicit version/snapshot table if exact restoration is ever required. Prompt text, user input, tool output, and Skill content cannot authorize tools; only code-created tools can enter the SDK tool list.

## Turn Preparation And Concurrency

`prepareAgentTurn()` should create one immutable execution snapshot: Prompt, hashes, model, history, Turn Context, tools, and audit metadata all come from that snapshot. The current persisted user message is excluded from replay and appears exactly once as the SDK query.

Each request gets a random `turnId` and must own the `agent_turn_lease` row for its chat before preparation or persistence once lease-aware runtime code is enabled. The lease is renewed during long work and ownership-sensitive boundaries match `chatId + userId + turnId`. An old request cannot renew, cancel, release, call a provider, or persist assistant output for a replacement lease.

Admission errors are machine-readable HTTP 409 responses:

- `turn_in_progress`: an unexpired Turn already owns the chat;
- `stale_run_requires_stop`: no live lease exists, but an active media task must be stopped before retrying.

Stop compare-and-sets `cancelRequestedAt` for the exact live `turnId`, then cancels only tasks and pending tool calls for that Turn. Without a live execution lease, it briefly acquires and conditionally releases its own `stop-*` cleanup lease so a new Turn cannot race orphan cleanup. Stop never deletes another execution's lease; the owning execution releases it conditionally. The run state shown by the chat API is the union of a live owned lease and active media tasks.

Initial rollout from a version that does not write leases requires a drain window: reject new chat POSTs temporarily, wait beyond the longest provider polling window, stop remaining legacy tasks, verify zero active tasks, apply the migration, then deploy the lease-dependent Worker. Do not deploy code that expects `agent_turn_lease` before the target database has the reviewed migration.

## Metadata And History Safety

New user messages should store `AgentTurnMetadataV1`: `turnId`, definition, both Prompt hashes, source, model/provider, selected Skill release when enabled, actual tools, and the long-running subset. Assistant rows should store `AgentAssistantMessageMetadataV1`: `turnId`, `parentUserMessageId`, and `roundIndex`.

Metadata is decoded strictly. A completed historical tool call is replayed as structured `tool_use`/`tool_result` only when its assistant row links to exactly one valid user Turn, that Turn authorized the tool, and the current Turn still registers it. Missing/corrupt metadata, duplicate rounds, broken parents, removed tools, and legacy calls become bounded ordinary text summaries. Unfinished calls receive an interrupted terminal result; history never grants a tool merely because it appeared in old messages.

Ordinary owner chat and public share responses strip metadata. When the audit route is enabled, owners and admins may inspect safe execution identity through `/api/agent/chat/:sessionId/audit`; that endpoint must not return Prompt or message bodies.

## Error And Module Contracts

`AgentRequestError` serializes Prompt/Turn/lease failures with `status`, machine `code`, `message`, optional `data`, and optional headers. Existing media contracts remain unchanged: validation 400, structured credit refusal 402, and provider/configuration failures 503 keep their existing bodies and behavior.

The Agent runtime remains under `src/modules/agent/`; there is no adapter or orchestration directory. Its cross-module composition is a restricted exception for chats, AI tasks, config, and storage. Do not add more module dependencies or introduce reverse imports into Agent. Reconsider an adapter only when a real second product needs a materially different tool lifecycle.

## Skills

Ideart does not vendor the source project's private 122-Skill bundle. If Ideart enables product Skills later, publish immutable private R2 releases, load only the selected Skill for a Turn, and scope its resource reader to that release. Publishing and rollback documentation should live in `docs/agent-skills-r2.md` when that system is added.

## Verification

Before release, run:

```bash
pnpm test
pnpm exec tsc --noEmit
pnpm build
pnpm cf:build
```

If Skill release scripts are present, also run the Skill bundle checks before `pnpm cf:build`. Review generated migrations before applying them; the lease rollout migration must only add `agent_turn_lease` and its indexes, never a destructive `DROP`.
