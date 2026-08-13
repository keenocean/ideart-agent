import { AgentRequestError } from '@/core/agent/errors';
import { validateAgentPromptOverride } from '@/core/agent/prompt-config';
import { getAgentDefinition } from '@/config/agent';
import { getConfigLatest } from '@/modules/config/service';

export const AGENT_SYSTEM_PROMPT_CONFIG_KEY = 'agent_system_prompt';

export interface AgentProfile {
  definition: ReturnType<typeof getAgentDefinition>;
  businessPrompt: string;
  promptSource: 'default' | 'admin';
}

export async function resolveAgentProfile(): Promise<AgentProfile> {
  const definition = getAgentDefinition();
  let override: string | undefined;
  try {
    override = await getConfigLatest(AGENT_SYSTEM_PROMPT_CONFIG_KEY);
  } catch (error) {
    console.error('[agent prompt] latest read failed', error);
    throw new AgentRequestError(
      503,
      'agent_prompt_unavailable',
      'The Agent configuration is temporarily unavailable.'
    );
  }
  if (override !== undefined) {
    try {
      validateAgentPromptOverride(override);
    } catch (error) {
      console.error('[agent prompt] invalid database override', error);
      throw new AgentRequestError(
        503,
        'invalid_agent_prompt_config',
        'The configured Agent System Prompt is invalid.'
      );
    }
  }

  const useOverride = Boolean(override?.trim());
  return {
    definition,
    businessPrompt: useOverride ? override! : definition.defaultSystemPrompt,
    promptSource: useOverride ? 'admin' : 'default',
  };
}
