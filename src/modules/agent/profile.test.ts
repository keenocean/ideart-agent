import { beforeEach, describe, expect, it, vi } from 'vitest';

import { DEFAULT_AGENT_SYSTEM_PROMPT } from '@/config/agent';

import { resolveAgentProfile } from './profile';

const mocks = vi.hoisted(() => ({
  getConfigLatest: vi.fn(),
}));

vi.mock('@/modules/config/service', () => ({
  getConfigLatest: mocks.getConfigLatest,
}));

describe('resolveAgentProfile', () => {
  beforeEach(() => vi.clearAllMocks());

  it.each([undefined, '', '   '])(
    'uses the project default for a missing or blank override',
    async (value) => {
      mocks.getConfigLatest.mockResolvedValue(value);
      await expect(resolveAgentProfile()).resolves.toMatchObject({
        businessPrompt: DEFAULT_AGENT_SYSTEM_PROMPT,
        promptSource: 'default',
      });
    }
  );

  it('uses a valid latest admin override', async () => {
    mocks.getConfigLatest.mockResolvedValue('Custom {{agent_name}}');
    await expect(resolveAgentProfile()).resolves.toMatchObject({
      businessPrompt: 'Custom {{agent_name}}',
      promptSource: 'admin',
    });
  });

  it('fails closed for an invalid database value', async () => {
    mocks.getConfigLatest.mockResolvedValue('Bad {{unknown}}');
    await expect(resolveAgentProfile()).rejects.toMatchObject({
      status: 503,
      code: 'invalid_agent_prompt_config',
    });
  });

  it('does not hide latest-read failures', async () => {
    mocks.getConfigLatest.mockRejectedValue(new Error('primary unavailable'));
    await expect(resolveAgentProfile()).rejects.toMatchObject({
      status: 503,
      code: 'agent_prompt_unavailable',
    });
  });
});
