import type {
  NormalizedMessageParam,
  ToolDefinition,
} from '@keenocean/open-agent-sdk';

import type { AgentGenerationSettings } from '@/lib/agent-settings';

export type AgentMediaType = 'image' | 'audio' | 'video';

export interface AgentVerifiedMedia {
  mediaType: AgentMediaType;
  url: string;
}

export interface AgentDefinition {
  id: string;
  name: string;
  defaultSystemPrompt: string;
  maxTurns: number;
}

export interface AgentTurnMetadataV1 {
  schemaVersion: 1;
  kind: 'user';
  turnId: string;
  agentDefinitionId: string;
  businessPromptHash: string;
  effectivePromptHash: string;
  promptSource: 'default' | 'admin';
  llmProvider: string;
  llmModel: string;
  skillName: string | null;
  skillReleaseId: string | null;
  toolNames: string[];
  longRunningToolNames: string[];
  /** Stable marketing/chat entry identity for audit only. */
  generationEntrySource?: string;
  /** Server-verified reference media accepted for this user turn. */
  media?: AgentVerifiedMedia[];
}

export interface AgentAssistantMessageMetadataV1 {
  schemaVersion: 1;
  kind: 'assistant';
  turnId: string;
  parentUserMessageId: string;
  roundIndex: number;
}

export type AgentMessageMetadata =
  | AgentTurnMetadataV1
  | AgentAssistantMessageMetadataV1;

export interface PreparedAgentTurn {
  turnId: string;
  definitionId: string;
  settings?: AgentGenerationSettings;
  history: NormalizedMessageParam[];
  systemPrompt: string;
  userMessage: string;
  tools: readonly ToolDefinition[];
  audit: AgentTurnMetadataV1;
  llm: {
    provider: 'openai' | 'anthropic';
    apiKey: string;
    baseURL?: string;
    apiType: 'openai-completions' | 'anthropic-messages';
    model: string;
  };
  maxTurns: number;
  leaseOwner?: {
    chatId: string;
    userId: string;
    turnId: string;
  };
}
