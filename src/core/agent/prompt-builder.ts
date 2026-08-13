import { CORE_AGENT_GUARDRAILS } from './guardrails';
import { applyAgentPromptVariables } from './prompt-config';

export interface BuildAgentPromptInput {
  appName: string;
  agentName: string;
  businessPrompt: string;
  promptSource: 'default' | 'admin';
  toolNames: readonly string[];
  capabilityInstructions?: string;
  skillPrompt?: string;
}

export interface BuiltAgentPrompt {
  systemPrompt: string;
  businessPromptHash: string;
  effectivePromptHash: string;
  promptSource: 'default' | 'admin';
}

export async function buildAgentPrompt(
  input: BuildAgentPromptInput
): Promise<BuiltAgentPrompt> {
  const availableTools = [...input.toolNames].join(', ') || 'none';
  const businessPrompt = applyAgentPromptVariables(input.businessPrompt, {
    app_name: input.appName,
    agent_name: input.agentName,
    available_tools: availableTools,
  });
  const capabilityPolicy = [
    'Effective tool policy:',
    `- Available tools for this turn: ${availableTools}.`,
    '- No other tool is authorized.',
    input.capabilityInstructions?.trim() || '',
  ]
    .filter(Boolean)
    .join('\n');
  const sections = [
    CORE_AGENT_GUARDRAILS,
    businessPrompt,
    capabilityPolicy,
    input.skillPrompt?.trim() || '',
  ].filter(Boolean);
  const systemPrompt = sections.join('\n\n');

  return {
    systemPrompt,
    businessPromptHash: await sha256(input.businessPrompt),
    effectivePromptHash: await sha256(systemPrompt),
    promptSource: input.promptSource,
  };
}

async function sha256(value: string): Promise<string> {
  const digest = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(value)
  );
  return [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}
