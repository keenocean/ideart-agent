import { beforeEach, describe, expect, it, vi } from 'vitest';

import { POST } from './chat';

const mocks = vi.hoisted(() => ({
  acquireTurnLease: vi.fn(),
  appendMessage: vi.fn(),
  assertTurnLeaseOwnership: vi.fn(),
  ensureChat: vi.fn(),
  findChatOwnerId: vi.fn(),
  getActiveTasksForSession: vi.fn(),
  getActiveTurnLease: vi.fn(),
  getBalance: vi.fn(),
  getCurrentSubscription: vi.fn(),
  getPromptSkill: vi.fn(),
  getSession: vi.fn(),
  prepareAgentTurn: vi.fn(),
  releaseTurnLease: vi.fn(),
  renewTurnLease: vi.fn(),
  runAgentTurn: vi.fn(),
}));

vi.mock('@tanstack/react-router', () => ({
  createFileRoute: vi.fn(() => (options: unknown) => options),
}));
vi.mock('@/core/auth', () => ({
  getAuth: () => ({ api: { getSession: mocks.getSession } }),
}));
vi.mock('@/lib/rate-limit', () => ({
  enforceMinIntervalRateLimit: vi.fn(() => null),
}));
vi.mock('@/lib/agent', () => ({
  isAgentSessionId: vi.fn(() => true),
}));
vi.mock('@/lib/agent-settings', () => ({
  normalizeClientGenerationSettings: vi.fn((settings) => settings ?? {}),
}));
vi.mock('@/modules/agent/paywall', () => ({
  checkCredits: vi.fn(() => ({ allowed: true, required: 1, balance: 10 })),
  insufficientCreditsBody: vi.fn(),
}));
vi.mock('@/modules/agent/skills', () => ({
  getPromptSkill: mocks.getPromptSkill,
  SkillRegistryUnavailableError: class extends Error {},
}));
vi.mock('@/modules/agent/service', () => ({
  prepareAgentTurn: mocks.prepareAgentTurn,
  runAgentTurn: mocks.runAgentTurn,
}));
vi.mock('@/modules/agent/turn-lease', () => ({
  acquireTurnLease: mocks.acquireTurnLease,
  assertTurnLeaseOwnership: mocks.assertTurnLeaseOwnership,
  getActiveTurnLease: mocks.getActiveTurnLease,
  releaseTurnLease: mocks.releaseTurnLease,
  renewTurnLease: mocks.renewTurnLease,
  TURN_LEASE_RENEW_INTERVAL_MS: 60_000,
}));
vi.mock('@/modules/ai-tasks/service', () => ({
  getActiveTasksForSession: mocks.getActiveTasksForSession,
}));
vi.mock('@/modules/chats/service', () => ({
  appendMessage: mocks.appendMessage,
  ensureChat: mocks.ensureChat,
  findChatOwnerId: mocks.findChatOwnerId,
}));
vi.mock('@/modules/credits/service', () => ({ getBalance: mocks.getBalance }));
vi.mock('@/modules/subscriptions/service', () => ({
  getCurrentSubscription: mocks.getCurrentSubscription,
}));

function chatRequest(sessionId = 'session-1') {
  return new Request('http://localhost/api/agent/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId, message: 'hello', settings: {} }),
  });
}

describe('Agent chat database admission', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getSession.mockResolvedValue({ user: { id: 'user-1' } });
    mocks.findChatOwnerId.mockResolvedValue(undefined);
    mocks.getActiveTurnLease.mockResolvedValue(undefined);
    mocks.getActiveTasksForSession.mockResolvedValue([]);
    mocks.acquireTurnLease.mockResolvedValue(true);
    mocks.releaseTurnLease.mockResolvedValue(undefined);
    mocks.renewTurnLease.mockResolvedValue(true);
    mocks.assertTurnLeaseOwnership.mockResolvedValue(undefined);
    mocks.getBalance.mockResolvedValue(10);
    mocks.getCurrentSubscription.mockResolvedValue(null);
    mocks.appendMessage.mockResolvedValue({ id: 'message-1' });
    mocks.prepareAgentTurn.mockImplementation(async ({ turnId }) => ({
      turnId,
      definitionId: 'primary',
      history: [],
      systemPrompt: 'prompt',
      userMessage: 'hello',
      tools: [],
      maxTurns: 12,
      llm: {
        provider: 'openai',
        model: 'model-1',
        apiKey: 'secret',
        apiType: 'openai-completions',
      },
      audit: {
        schemaVersion: 1,
        kind: 'user',
        turnId,
        agentDefinitionId: 'primary',
        businessPromptHash: 'a',
        effectivePromptHash: 'b',
        promptSource: 'default',
        llmProvider: 'openai',
        llmModel: 'model-1',
        skillName: null,
        skillReleaseId: null,
        toolNames: [],
        longRunningToolNames: [],
      },
    }));
    mocks.runAgentTurn.mockImplementation(() =>
      (async function* () {
        yield { type: 'done' };
      })()
    );
  });

  it('returns turn_in_progress before active-task or media checks', async () => {
    mocks.getActiveTurnLease.mockResolvedValue({
      turnId: 'other',
      userId: 'user-1',
    });
    const response = await POST({ request: chatRequest() });
    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toMatchObject({
      code: 'turn_in_progress',
    });
    expect(mocks.getActiveTasksForSession).not.toHaveBeenCalled();
    expect(mocks.acquireTurnLease).not.toHaveBeenCalled();
  });

  it('requires Stop when an orphan or legacy task remains', async () => {
    mocks.getActiveTasksForSession.mockResolvedValue([{ id: 'task-1' }]);
    const response = await POST({ request: chatRequest() });
    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toMatchObject({
      code: 'stale_run_requires_stop',
    });
    expect(mocks.acquireTurnLease).not.toHaveBeenCalled();
  });

  it('maps an acquire race to turn_in_progress', async () => {
    mocks.acquireTurnLease.mockResolvedValue(false);
    const response = await POST({ request: chatRequest() });
    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toMatchObject({
      code: 'turn_in_progress',
    });
  });

  it('persists the prepared audit and releases the matching turn after streaming', async () => {
    mocks.runAgentTurn.mockImplementation(() =>
      (async function* () {
        yield { type: 'content', data: { content: 'hello back' } };
        yield { type: 'done' };
      })()
    );
    const response = await POST({ request: chatRequest() });
    expect(response.status).toBe(200);
    await response.text();

    const preparedCall = mocks.prepareAgentTurn.mock.calls[0][0];
    const prepared = await mocks.prepareAgentTurn.mock.results[0].value;
    expect(preparedCall.turnId).toMatch(/^turn-/);
    expect(preparedCall.leaseOwner).toEqual({
      chatId: 'session-1',
      userId: 'user-1',
      turnId: preparedCall.turnId,
    });
    expect(mocks.appendMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        role: 'user',
        metadata: expect.objectContaining({
          kind: 'user',
          turnId: preparedCall.turnId,
        }),
        model: 'model-1',
        provider: 'openai',
      })
    );
    expect(mocks.appendMessage.mock.calls[0][0].metadata).toBe(prepared.audit);
    expect(mocks.runAgentTurn).toHaveBeenCalledWith(
      expect.objectContaining({ prepared })
    );
    expect(mocks.appendMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        role: 'assistant',
        parts: [{ type: 'text', text: 'hello back' }],
        metadata: {
          schemaVersion: 1,
          kind: 'assistant',
          turnId: preparedCall.turnId,
          parentUserMessageId: 'message-1',
          roundIndex: 0,
        },
        model: 'model-1',
        provider: 'openai',
      })
    );
    expect(mocks.releaseTurnLease).toHaveBeenCalledWith(
      preparedCall.leaseOwner
    );
  });
});
