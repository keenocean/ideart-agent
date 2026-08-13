import { describe, expect, it } from 'vitest';

import {
  AGENT_PROMPT_MAX_BYTES,
  applyAgentPromptVariables,
  promptByteLength,
  validateAgentPromptOverride,
} from './prompt-config';

describe('agent prompt configuration', () => {
  it('enforces the UTF-8 byte boundary', () => {
    const exact = 'a'.repeat(AGENT_PROMPT_MAX_BYTES);
    expect(() => validateAgentPromptOverride(exact)).not.toThrow();
    expect(promptByteLength('图')).toBe(3);
    expect(() => validateAgentPromptOverride(`${exact}a`)).toThrow(/exceeds/);
  });

  it('rejects unknown variables and expands the whitelist', () => {
    const template = '{{app_name}} {{agent_name}} {{available_tools}}';
    expect(() => validateAgentPromptOverride(template)).not.toThrow();
    expect(
      applyAgentPromptVariables(template, {
        app_name: 'Ideart',
        agent_name: 'Ideart',
        available_tools: 'generate_image',
      })
    ).toBe('Ideart Ideart generate_image');
    expect(() => validateAgentPromptOverride('{{secret}}')).toThrow(
      /Unknown.*secret/
    );
  });
});
