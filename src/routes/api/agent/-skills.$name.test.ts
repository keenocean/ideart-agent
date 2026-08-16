import { beforeEach, describe, expect, it, vi } from 'vitest';

import { GET } from './skills/$name';

const mocks = vi.hoisted(() => ({
  getPromptSkill: vi.fn(),
  getSession: vi.fn(),
}));

vi.mock('@tanstack/react-router', () => ({
  createFileRoute: vi.fn(() => (options: unknown) => options),
}));
vi.mock('@/modules/agent/skills', () => ({
  getPromptSkill: mocks.getPromptSkill,
  SkillRegistryUnavailableError: class SkillRegistryUnavailableError extends Error {},
}));
vi.mock('@/core/auth', () => ({
  getAuth: () => ({ api: { getSession: mocks.getSession } }),
}));

describe('agent skill detail API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getSession.mockResolvedValue({ user: { id: 'user-1' } });
  });

  it('requires an authenticated session before returning instructions', async () => {
    mocks.getSession.mockResolvedValue(null);

    const response = await GET({
      request: new Request('http://localhost/api/agent/skills/private-skill'),
      params: { name: 'private-skill' },
    });

    expect(response.status).toBe(401);
    expect(mocks.getPromptSkill).not.toHaveBeenCalled();
  });

  it('returns one skill body without exposing reference contents', async () => {
    mocks.getPromptSkill.mockResolvedValue({
      name: 'ads-cinematic-skill',
      title: 'Ads Cinematic',
      summary: 'Film-look creative direction',
      instructions: '# Ads Cinematic\nUse deliberate camera language.',
      references: {
        'references/lenses.md': '# Lenses',
        'references/lighting.md': '# Lighting',
      },
      releaseId: 'release',
    });

    const response = await GET({
      request: new Request(
        'http://localhost/api/agent/skills/ads-cinematic-skill'
      ),
      params: { name: 'ads-cinematic-skill' },
    });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      code: 0,
      data: {
        name: 'ads-cinematic-skill',
        instructions: '# Ads Cinematic\nUse deliberate camera language.',
        referencePaths: ['references/lenses.md', 'references/lighting.md'],
      },
    });
  });

  it('returns a real 404 for an unknown skill', async () => {
    mocks.getPromptSkill.mockResolvedValue(null);

    const response = await GET({
      request: new Request('http://localhost/api/agent/skills/missing-skill'),
      params: { name: 'missing-skill' },
    });

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toMatchObject({
      code: -1,
      message: 'Skill not found',
    });
  });
});
