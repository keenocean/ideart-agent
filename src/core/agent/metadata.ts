import type {
  AgentAssistantMessageMetadataV1,
  AgentMediaType,
  AgentMessageMetadata,
  AgentTurnMetadataV1,
  AgentVerifiedMedia,
} from './types';

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0;
}

function isNullableString(value: unknown): value is string | null {
  return value === null || typeof value === 'string';
}

function stringArray(value: unknown): string[] | null {
  if (!Array.isArray(value) || !value.every(isNonEmptyString)) return null;
  if (new Set(value).size !== value.length) return null;
  return [...value];
}

function mediaType(value: unknown): AgentMediaType | null {
  return value === 'image' || value === 'audio' || value === 'video'
    ? value
    : null;
}

function verifiedMediaArray(value: unknown): AgentVerifiedMedia[] | null {
  if (value === undefined) return [];
  if (!Array.isArray(value)) return null;
  const parsed: AgentVerifiedMedia[] = [];
  const seen = new Set<string>();
  for (const item of value) {
    if (!isRecord(item)) return null;
    const type = mediaType(item.mediaType);
    if (!type || !isNonEmptyString(item.url)) return null;
    const key = `${type}\u0000${item.url}`;
    if (seen.has(key)) return null;
    seen.add(key);
    parsed.push({ mediaType: type, url: item.url });
  }
  return parsed;
}

export function parseAgentMessageMetadata(
  value: unknown
): AgentMessageMetadata | null {
  if (!isRecord(value) || value.schemaVersion !== 1) return null;
  if (!isNonEmptyString(value.turnId)) return null;

  if (value.kind === 'assistant') {
    if (
      !isNonEmptyString(value.parentUserMessageId) ||
      !Number.isInteger(value.roundIndex) ||
      (value.roundIndex as number) < 0
    ) {
      return null;
    }
    return {
      schemaVersion: 1,
      kind: 'assistant',
      turnId: value.turnId,
      parentUserMessageId: value.parentUserMessageId,
      roundIndex: value.roundIndex as number,
    } satisfies AgentAssistantMessageMetadataV1;
  }

  if (value.kind !== 'user') return null;
  const toolNames = stringArray(value.toolNames);
  const longRunningToolNames = stringArray(value.longRunningToolNames);
  const media = verifiedMediaArray(value.media);
  if (
    !isNonEmptyString(value.agentDefinitionId) ||
    !isNonEmptyString(value.businessPromptHash) ||
    !isNonEmptyString(value.effectivePromptHash) ||
    (value.promptSource !== 'default' && value.promptSource !== 'admin') ||
    !isNonEmptyString(value.llmProvider) ||
    !isNonEmptyString(value.llmModel) ||
    !isNullableString(value.skillName) ||
    !isNullableString(value.skillReleaseId) ||
    !toolNames ||
    !longRunningToolNames ||
    !media ||
    longRunningToolNames.some((name) => !toolNames.includes(name))
  ) {
    return null;
  }

  return {
    schemaVersion: 1,
    kind: 'user',
    turnId: value.turnId,
    agentDefinitionId: value.agentDefinitionId,
    businessPromptHash: value.businessPromptHash,
    effectivePromptHash: value.effectivePromptHash,
    promptSource: value.promptSource,
    llmProvider: value.llmProvider,
    llmModel: value.llmModel,
    skillName: value.skillName,
    skillReleaseId: value.skillReleaseId,
    toolNames,
    longRunningToolNames,
    ...(media.length > 0 ? { media } : {}),
  } satisfies AgentTurnMetadataV1;
}

export function decodeAgentMessageMetadata(
  raw: string | null
): AgentMessageMetadata | null {
  if (!raw) return null;
  try {
    return parseAgentMessageMetadata(JSON.parse(raw));
  } catch {
    return null;
  }
}
