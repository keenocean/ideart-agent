export const AGENT_PROMPT_MAX_BYTES = 20 * 1024;

export const AGENT_PROMPT_VARIABLES = [
  'app_name',
  'agent_name',
  'available_tools',
] as const;

const ALLOWED_VARIABLES = new Set<string>(AGENT_PROMPT_VARIABLES);
const TEMPLATE_VARIABLE = /{{\s*([^{}]+?)\s*}}/g;

export function promptByteLength(value: string): number {
  return new TextEncoder().encode(value).byteLength;
}

export function validateAgentPromptOverride(value: string): void {
  const bytes = promptByteLength(value);
  if (bytes > AGENT_PROMPT_MAX_BYTES) {
    throw new Error(
      `Agent System Prompt exceeds ${AGENT_PROMPT_MAX_BYTES} UTF-8 bytes.`
    );
  }

  const unknown = new Set<string>();
  for (const match of value.matchAll(TEMPLATE_VARIABLE)) {
    const name = match[1].trim();
    if (!ALLOWED_VARIABLES.has(name)) unknown.add(name);
  }
  if (unknown.size > 0) {
    throw new Error(
      `Unknown Agent System Prompt variable: ${[...unknown].join(', ')}`
    );
  }
}

export function applyAgentPromptVariables(
  template: string,
  variables: Record<(typeof AGENT_PROMPT_VARIABLES)[number], string>
): string {
  validateAgentPromptOverride(template);
  return template.replace(TEMPLATE_VARIABLE, (_match, rawName: string) => {
    const name = rawName.trim() as keyof typeof variables;
    return variables[name];
  });
}
