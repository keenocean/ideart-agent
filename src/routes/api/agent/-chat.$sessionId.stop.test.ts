import { beforeEach, describe, expect, it, vi } from 'vitest';

import { POST } from './chat.$sessionId.stop';

const mocks = vi.hoisted(() => ({
  acquireTurnLease: vi.fn(),
  cancelGenerationsForSession: vi.fn(),
  cancelPendingToolCalls: vi.fn(),
  findChat: vi.fn(),
  getActiveTurnLease: vi.fn(),
  getSession: vi.fn(),
  requestTurnCancellation: vi.fn(),
  releaseTurnLease: vi.fn(),
}));

vi.mock('@tanstack/react-router', () => ({
  createFileRoute: vi.fn(() => (options: unknown) => options),
}));
vi.mock('@/core/auth', () => ({
  getAuth: () => ({ api: { getSession: mocks.getSession } }),
}));
vi.mock('@/lib/agent', () => ({ isAgentSessionId: vi.fn(() => true) }));
vi.mock('@/modules/agent/tools', () => ({
  cancelGenerationsForSession: mocks.cancelGenerationsForSession,
}));
vi.mock('@/modules/agent/turn-lease', () => ({
  acquireTurnLease: mocks.acquireTurnLease,
  getActiveTurnLease: mocks.getActiveTurnLease,
  releaseTurnLease: mocks.releaseTurnLease,
  requestTurnCancellation: mocks.requestTurnCancellation,
}));
vi.mock('@/modules/chats/service', () => ({
  cancelPendingToolCalls: mocks.cancelPendingToolCalls,
  findChat: mocks.findChat,
}));

const ctx = {
  request: new Request('http://localhost/api/agent/chat/session-1/stop', {
    method: 'POST',
  }),
  params: { sessionId: 'session-1' },
};

describe('Agent Stop turn scoping', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getSession.mockResolvedValue({ user: { id: 'user-1' } });
    mocks.findChat.mockResolvedValue({ id: 'session-1', userId: 'user-1' });
    mocks.getActiveTurnLease.mockResolvedValue(undefined);
    mocks.acquireTurnLease.mockResolvedValue(true);
    mocks.releaseTurnLease.mockResolvedValue(undefined);
    mocks.requestTurnCancellation.mockResolvedValue(true);
    mocks.cancelGenerationsForSession.mockResolvedValue({
      canceled: 1,
      upstreamCanceled: 1,
    });
    mocks.cancelPendingToolCalls.mockResolvedValue(1);
  });

  it('compare-and-sets cancellation and targets only the live turn', async () => {
    mocks.getActiveTurnLease.mockResolvedValue({
      chatId: 'session-1',
      userId: 'user-1',
      turnId: 'turn-live',
    });

    const response = await POST(ctx);

    expect(response.status).toBe(200);
    expect(mocks.requestTurnCancellation).toHaveBeenCalledWith({
      chatId: 'session-1',
      userId: 'user-1',
      turnId: 'turn-live',
    });
    expect(mocks.cancelGenerationsForSession).toHaveBeenCalledWith({
      userId: 'user-1',
      sessionId: 'session-1',
      turnId: 'turn-live',
    });
    expect(mocks.cancelPendingToolCalls).toHaveBeenCalledWith(
      'session-1',
      'user-1',
      'turn-live'
    );
    expect(mocks.acquireTurnLease).not.toHaveBeenCalled();
  });

  it('does not cancel anything if the lease changes during the CAS', async () => {
    mocks.getActiveTurnLease.mockResolvedValue({
      chatId: 'session-1',
      userId: 'user-1',
      turnId: 'turn-old',
    });
    mocks.requestTurnCancellation.mockResolvedValue(false);

    const response = await POST(ctx);

    expect(response.status).toBe(200);
    expect(mocks.cancelGenerationsForSession).not.toHaveBeenCalled();
    expect(mocks.cancelPendingToolCalls).not.toHaveBeenCalled();
  });

  it('uses conservative orphan/legacy cleanup when no lease is active', async () => {
    const response = await POST(ctx);

    expect(response.status).toBe(200);
    expect(mocks.requestTurnCancellation).not.toHaveBeenCalled();
    expect(mocks.cancelGenerationsForSession).toHaveBeenCalledWith({
      userId: 'user-1',
      sessionId: 'session-1',
    });
    expect(mocks.cancelPendingToolCalls).toHaveBeenCalledWith(
      'session-1',
      'user-1',
      undefined
    );
    const cleanupOwner = mocks.acquireTurnLease.mock.calls[0][0];
    expect(cleanupOwner).toMatchObject({
      chatId: 'session-1',
      userId: 'user-1',
    });
    expect(cleanupOwner.turnId).toMatch(/^stop-/);
    expect(mocks.releaseTurnLease).toHaveBeenCalledWith(cleanupOwner);
  });

  it('does not race cleanup with a concurrently acquired turn lease', async () => {
    mocks.acquireTurnLease.mockResolvedValue(false);

    const response = await POST(ctx);

    expect(response.status).toBe(200);
    expect(mocks.cancelGenerationsForSession).not.toHaveBeenCalled();
    expect(mocks.cancelPendingToolCalls).not.toHaveBeenCalled();
    expect(mocks.releaseTurnLease).not.toHaveBeenCalled();
  });

  it('does not reveal or cancel another owner lease', async () => {
    mocks.getActiveTurnLease.mockResolvedValue({
      chatId: 'session-1',
      userId: 'user-2',
      turnId: 'turn-other',
    });

    const response = await POST(ctx);

    expect(await response.json()).toMatchObject({ code: -1 });
    expect(mocks.requestTurnCancellation).not.toHaveBeenCalled();
    expect(mocks.cancelGenerationsForSession).not.toHaveBeenCalled();
  });
});
