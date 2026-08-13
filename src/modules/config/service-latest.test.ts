import { beforeEach, describe, expect, it, vi } from 'vitest';

import { filterPublicConfigs, getConfigLatest } from './service';

const mocks = vi.hoisted(() => ({
  bind: vi.fn(),
  createD1PrimarySession: vi.fn(),
  first: vi.fn(),
  prepare: vi.fn(),
}));

vi.mock('@/config', () => ({
  envConfigs: { database_provider: 'd1', database_url: '' },
}));
vi.mock('@/core/db', () => ({ db: vi.fn() }));
vi.mock('@/core/db/d1', () => ({
  createD1PrimarySession: mocks.createD1PrimarySession,
}));
vi.mock('@/config/db/schema', () => ({
  config: { name: 'name', value: 'value' },
}));
vi.mock('@/lib/crypto', () => ({
  decryptSecret: vi.fn(),
  encryptSecret: vi.fn(),
  isEncryptedSecret: vi.fn(() => false),
}));
vi.mock('./settings', () => ({ getSettings: vi.fn(() => []) }));

describe('getConfigLatest D1 freshness path', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.bind.mockReturnValue({ first: mocks.first });
    mocks.prepare.mockReturnValue({ bind: mocks.bind });
    mocks.createD1PrimarySession.mockReturnValue({ prepare: mocks.prepare });
  });

  it('reads the requested key through a fresh primary session', async () => {
    mocks.first.mockResolvedValue({ value: 'latest-value' });

    await expect(getConfigLatest('agent_system_prompt')).resolves.toBe(
      'latest-value'
    );
    expect(mocks.prepare).toHaveBeenCalledWith(
      'SELECT value FROM config WHERE name = ? LIMIT 1'
    );
    expect(mocks.bind).toHaveBeenCalledWith('agent_system_prompt');
  });

  it('distinguishes a missing value from a failed primary read', async () => {
    mocks.first.mockResolvedValueOnce(null);
    await expect(getConfigLatest('missing')).resolves.toBeUndefined();

    mocks.first.mockRejectedValueOnce(new Error('D1 unavailable'));
    await expect(getConfigLatest('broken')).rejects.toThrow('D1 unavailable');
  });
});

describe('Agent Prompt public config boundary', () => {
  it('cannot be exposed even if a future caller accidentally allowlists it', () => {
    expect(
      filterPublicConfigs(
        { agent_system_prompt: 'PRIVATE PROMPT', app_name: 'Public name' },
        ['agent_system_prompt', 'app_name']
      )
    ).toEqual({ app_name: 'Public name' });
  });
});
