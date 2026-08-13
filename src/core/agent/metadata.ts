import type {
  AgentAssistantMessageMetadataV1,
  AgentMessageMetadata,
  AgentTurnMetadataV1,
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
