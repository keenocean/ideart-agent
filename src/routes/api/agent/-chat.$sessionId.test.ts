import { beforeEach, describe, expect, it, vi } from 'vitest';

import { GET } from './chat.$sessionId';

const mocks = vi.hoisted(() => ({
  getActiveTasksForSession: vi.fn(),
  getActiveTurnLease: vi.fn(),
  getChatWithMessages: vi.fn(),
  getSession: vi.fn(),
}));

vi.mock('@tanstack/react-router', () => ({
  createFileRoute: vi.fn(() => (options: unknown) => options),
}));
vi.mock('@/core/auth', () => ({
  getAuth: () => ({ api: { getSession: mocks.getSession } }),
}));
vi.mock('@/modules/ai-tasks/service', () => ({
  getActiveTasksForSession: mocks.getActiveTasksForSession,
}));
vi.mock('@/modules/agent/turn-lease', () => ({
  getActiveTurnLease: mocks.getActiveTurnLease,
}));
vi.mock('@/modules/chats/service', () => ({
  deleteChat: vi.fn(),
  getChatWithMessages: mocks.getChatWithMessages,
  renameChat: vi.fn(),
}));

const ctx = {
  request: new Request('http://localhost/api/agent/chat/session-1'),
  params: { sessionId: 'session-1' },
};

describe('Agent chat run state', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getSession.mockResolvedValue({ user: { id: 'user-1' } });
    mocks.getChatWithMessages.mockResolvedValue(undefined);
    mocks.getActiveTasksForSession.mockResolvedValue([]);
    mocks.getActiveTurnLease.mockResolvedValue(undefined);
  });

  it('is active when an owned lease exists without a media task', async () => {
    mocks.getActiveTurnLease.mockResolvedValue({ userId: 'user-1' });
    const response = await GET(ctx);
    await expect(response.json()).resolves.toMatchObject({
      data: { run: { active: true } },
    });
  });

  it('is active when a media task exists without a lease', async () => {
    mocks.getActiveTasksForSession.mockResolvedValue([{ id: 'task-1' }]);
    const response = await GET(ctx);
    await expect(response.json()).resolves.toMatchObject({
      data: { run: { active: true } },
    });
  });

  it('does not expose another owner lease as this user run state', async () => {
    mocks.getActiveTurnLease.mockResolvedValue({ userId: 'user-2' });
    const response = await GET(ctx);
    await expect(response.json()).resolves.toMatchObject({
      data: { run: { active: false } },
    });
  });
});
