import { createServerOnlyFn } from '@tanstack/react-start';

import type { AgentDefinition } from '@/core/agent/types';

import { productAgent } from './product/agent';

export const DEFAULT_AGENT_SYSTEM_PROMPT = productAgent.defaultSystemPrompt;

const AGENT_DEFINITION: AgentDefinition = {
  id: productAgent.id,
  name: productAgent.name,
  defaultSystemPrompt: DEFAULT_AGENT_SYSTEM_PROMPT,
  maxTurns: productAgent.maxTurns,
};

/** Build-time boundary prevents project Prompt content from entering clients. */
export const getAgentDefinition = createServerOnlyFn(
  (): AgentDefinition => AGENT_DEFINITION
);
