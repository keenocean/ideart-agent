import { describe, expect, it } from 'vitest';

import { CORE_AGENT_GUARDRAILS } from './guardrails';
import { buildAgentPrompt } from './prompt-builder';
import {
  AGENT_PROMPT_MAX_BYTES,
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

  it('rejects unknown variables but accepts the whitelist', () => {
    expect(() =>
      validateAgentPromptOverride(
        '{{app_name}} {{agent_name}} {{available_tools}}'
      )
    ).not.toThrow();
    expect(() => validateAgentPromptOverride('{{secret}}')).toThrow(
      /Unknown.*secret/
    );
  });
});

describe('buildAgentPrompt', () => {
  it('assembles guardrails, business prompt, capability policy, and Skill in order', async () => {
    const built = await buildAgentPrompt({
      appName: 'ShipAny',
      agentName: 'Director',
      businessPrompt:
        'BUSINESS {{app_name}} {{agent_name}} {{available_tools}}',
      promptSource: 'admin',
      toolNames: ['generate_image'],
      skillPrompt: 'SKILL',
    });

    expect(built.systemPrompt.indexOf(CORE_AGENT_GUARDRAILS)).toBe(0);
    expect(built.systemPrompt).toContain(
      'BUSINESS ShipAny Director generate_image'
    );
    expect(built.systemPrompt.indexOf('Effective tool policy')).toBeGreaterThan(
      built.systemPrompt.indexOf('BUSINESS')
    );
    expect(built.systemPrompt.indexOf('SKILL')).toBeGreaterThan(
      built.systemPrompt.indexOf('Effective tool policy')
    );
    expect(built.promptSource).toBe('admin');
    expect(built.businessPromptHash).toMatch(/^[a-f0-9]{64}$/);
    expect(built.effectivePromptHash).toMatch(/^[a-f0-9]{64}$/);
    expect(built.effectivePromptHash).not.toBe(built.businessPromptHash);
  });

  it('keeps the business hash stable when only tools change', async () => {
    const base = {
      appName: 'App',
      agentName: 'Agent',
      businessPrompt: 'Hello',
      promptSource: 'default' as const,
    };
    const image = await buildAgentPrompt({
      ...base,
      toolNames: ['generate_image'],
    });
    const video = await buildAgentPrompt({
      ...base,
      toolNames: ['generate_video'],
    });

    expect(image.businessPromptHash).toBe(video.businessPromptHash);
    expect(image.effectivePromptHash).not.toBe(video.effectivePromptHash);
  });
});
