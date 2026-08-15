import type { NormalizedMessageParam } from '@keenocean/open-agent-sdk';

import type {
  AgentAssistantMessageMetadataV1,
  AgentMediaType,
  AgentMessageMetadata,
  AgentTurnMetadataV1,
  AgentVerifiedMedia,
} from '@/core/agent/types';
import {
  getChatWithMessages,
  type ChatWithMessages,
  type StoredPart,
} from '@/modules/chats/service';

import { isTrustedGenerationAttachmentUrl } from './entry-policy';

export const LONG_RUNNING_MEDIA_TOOL_NAMES = [
  'generate_image',
  'generate_video',
  'animate_image',
] as const;

const INTERRUPTED_TOOL_RESULT = JSON.stringify({
  status: 'interrupted',
  message: 'Generation was interrupted before a final result was recorded.',
});
const TOOL_HISTORY_SUMMARY_MAX_CHARS = 2_000;

/** Resolve unfinished built-in media calls once no durable task is active. */
export function completeInterruptedMediaCalls(
  parts: StoredPart[],
  hasActiveRun: boolean,
  longRunningToolNames?: readonly string[]
): StoredPart[] {
  if (hasActiveRun) return parts;
  const allowed = longRunningToolNames ? new Set(longRunningToolNames) : null;
  return parts.map((part) =>
    part.type === 'tool_call' &&
    part.result === undefined &&
    (!allowed || allowed.has(part.name))
      ? { ...part, result: INTERRUPTED_TOOL_RESULT }
      : part
  );
}

/**
 * Rebuild the agent's conversation history from the chat rows.
 *
 * The SDK can persist sessions to disk, but the database already holds every
 * turn — and a Worker has no disk anyway. So each turn starts by replaying
 * what's stored here, which also means the history survives restarts and is
 * identical across instances.
 *
 * The stored shape (text + tool_call parts with their results) maps onto the
 * SDK's normalized blocks: a tool call becomes a `tool_use` block on the
 * assistant message plus a `tool_result` block on a following user message,
 * which is the layout every provider expects.
 */
export async function loadAgentHistory(
  chatId: string,
  userId: string,
  excludeMessageId?: string,
  currentToolNames: readonly string[] = [],
  preloaded?: ChatWithMessages
): Promise<NormalizedMessageParam[]> {
  const chat = preloaded ?? (await getChatWithMessages(chatId, userId));
  if (!chat) return [];
  return mapRowsToHistory(chat.messages, excludeMessageId, currentToolNames);
}

interface HistoryRow {
  id?: string;
  role: 'user' | 'assistant';
  parts: StoredPart[];
  metadata?: AgentMessageMetadata | null;
}

/** Long-running tools authorized by each assistant row's linked user Turn. */
export function assistantLongRunningToolNames(
  rows: HistoryRow[]
): Map<number, readonly string[]> {
  const result = new Map<number, readonly string[]>();
  for (const [rowIndex, audit] of buildTurnAssociations(rows).assistantAudit) {
    result.set(rowIndex, audit.longRunningToolNames);
  }
  return result;
}

export function collectAllowedMediaAttachments(
  rows: HistoryRow[]
): AgentVerifiedMedia[] {
  const allowed = new Map<string, AgentVerifiedMedia>();
  const add = (media: AgentVerifiedMedia) => {
    allowed.set(mediaKey(media), media);
  };

  for (const row of rows) {
    if (row.role !== 'user' || row.metadata?.kind !== 'user') continue;
    for (const media of row.metadata.media ?? []) add(media);
  }

  const associations = buildTurnAssociations(rows);
  for (const [rowIndex, audit] of associations.assistantAudit) {
    const row = rows[rowIndex];
    for (const part of row.parts) {
      if (
        part.type !== 'tool_call' ||
        !audit.longRunningToolNames.includes(part.name)
      ) {
        continue;
      }
      const mediaType = generatedMediaTypeForTool(part.name);
      if (!mediaType) continue;
      for (const url of extractSuccessfulToolFiles(part.result, mediaType)) {
        add({ mediaType, url });
      }
    }
  }

  return [...allowed.values()];
}

/**
 * The mapping itself, split from the database read so it can be exercised
 * directly — getting this wrong produces a conversation the provider rejects,
 * or worse, silently accepts with the tool results detached from their calls.
 */
export function mapRowsToHistory(
  rows: HistoryRow[],
  excludeMessageId?: string,
  currentToolNames: readonly string[] = []
): NormalizedMessageParam[] {
  const history: NormalizedMessageParam[] = [];
  const currentTools = new Set(currentToolNames);
  const associations = buildTurnAssociations(rows);

  for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
    const row = rows[rowIndex];
    if (excludeMessageId && row.id === excludeMessageId) continue;

    if (row.role === 'user') {
      const text = textOf(row.parts);
      if (text) history.push({ role: 'user', content: text });
      continue;
    }

    const assistant: NormalizedMessageParam['content'] = [];
    const results: NormalizedMessageParam['content'] = [];
    const audit = associations.assistantAudit.get(rowIndex);

    for (const part of row.parts) {
      if (part.type === 'text') {
        if (part.text.trim()) assistant.push({ type: 'text', text: part.text });
        continue;
      }
      const canReplayStructured =
        audit?.toolNames.includes(part.name) === true &&
        currentTools.has(part.name);
      if (!canReplayStructured) {
        assistant.push({ type: 'text', text: summarizeToolCall(part) });
        continue;
      }

      assistant.push({
        type: 'tool_use',
        id: part.id,
        name: part.name,
        input: parseArguments(part.arguments),
      });
      const result = part.result ?? INTERRUPTED_TOOL_RESULT;
      results.push({
        type: 'tool_result',
        tool_use_id: part.id,
        content: result,
        ...(part.result === undefined ? { is_error: true } : {}),
      });
    }

    if (assistant.length > 0)
      history.push({ role: 'assistant', content: assistant });
    if (results.length > 0) history.push({ role: 'user', content: results });
  }

  return history;
}

function buildTurnAssociations(rows: HistoryRow[]) {
  const usersById = new Map<
    string,
    { metadata: AgentTurnMetadataV1; rowIndex: number }
  >();
  const userTurnCounts = new Map<string, number>();
  const assistantRoundCounts = new Map<string, number>();

  rows.forEach((row, rowIndex) => {
    if (row.role === 'user' && row.id && row.metadata?.kind === 'user') {
      usersById.set(row.id, { metadata: row.metadata, rowIndex });
      userTurnCounts.set(
        row.metadata.turnId,
        (userTurnCounts.get(row.metadata.turnId) ?? 0) + 1
      );
    }
    if (row.role === 'assistant' && row.metadata?.kind === 'assistant') {
      const key = assistantRoundKey(row.metadata);
      assistantRoundCounts.set(key, (assistantRoundCounts.get(key) ?? 0) + 1);
    }
  });

  const assistantAudit = new Map<number, AgentTurnMetadataV1>();
  rows.forEach((row, rowIndex) => {
    if (row.role !== 'assistant' || row.metadata?.kind !== 'assistant') return;
    const metadata = row.metadata;
    const parent = usersById.get(metadata.parentUserMessageId);
    if (
      !parent ||
      parent.metadata.turnId !== metadata.turnId ||
      userTurnCounts.get(metadata.turnId) !== 1 ||
      assistantRoundCounts.get(assistantRoundKey(metadata)) !== 1 ||
      parent.rowIndex >= rowIndex
    ) {
      return;
    }
    assistantAudit.set(rowIndex, parent.metadata);
  });

  return { assistantAudit };
}

function assistantRoundKey(metadata: AgentAssistantMessageMetadataV1) {
  return `${metadata.turnId}\u0000${metadata.roundIndex}`;
}

function generatedMediaTypeForTool(name: string): AgentMediaType | null {
  if (name === 'generate_image') return 'image';
  if (name === 'generate_video' || name === 'animate_image') return 'video';
  return null;
}

function mediaKey(media: AgentVerifiedMedia): string {
  return `${media.mediaType}\u0000${media.url}`;
}

function extractSuccessfulToolFiles(
  result: string | undefined,
  mediaType: AgentMediaType
): string[] {
  if (!result) return [];
  try {
    const payload = JSON.parse(result) as {
      status?: unknown;
      files?: unknown;
    };
    if (payload.status !== 'success') return [];
    if (!Array.isArray(payload.files)) return [];
    return payload.files.filter(
      (file): file is string =>
        typeof file === 'string' &&
        isTrustedGenerationAttachmentUrl(mediaType, file)
    );
  } catch {
    return [];
  }
}

function summarizeToolCall(
  part: Extract<StoredPart, { type: 'tool_call' }>
): string {
  const result = part.result ?? INTERRUPTED_TOOL_RESULT;
  const summary = `[Historical tool record: ${part.name}]\nArguments: ${part.arguments}\nResult: ${result}`;
  return summary.length <= TOOL_HISTORY_SUMMARY_MAX_CHARS
    ? summary
    : `${summary.slice(0, TOOL_HISTORY_SUMMARY_MAX_CHARS - 1)}…`;
}

function textOf(parts: StoredPart[]): string {
  return parts
    .filter(
      (part): part is Extract<StoredPart, { type: 'text' }> =>
        part.type === 'text'
    )
    .map((part) => part.text)
    .join('')
    .trim();
}

function parseArguments(raw: string): unknown {
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}
