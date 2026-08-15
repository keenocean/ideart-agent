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
  getChatWithMessages: vi.fn(),
  collectAllowedMediaAttachments: vi.fn(),
  verifyAgentMediaReceipt: vi.fn(),
  applyEffectiveGenerationPolicy: vi.fn(),
  parseGenerationRequestAttachments: vi.fn(),
  prepareAgentTurn: vi.fn(),
  resolveEffectiveGenerationPolicy: vi.fn(),
  releaseTurnLease: vi.fn(),
  renewTurnLease: vi.fn(),
  runAgentTurn: vi.fn(),
  validateRequestAttachments: vi.fn(),
}));

vi.mock('@tanstack/react-router', () => ({
  createFileRoute: vi.fn(() => (options: unknown) => options),
}));
vi.mock('@/core/auth', () => ({
  getAuth: () => ({ api: { getSession: mocks.getSession } }),
}));
vi.mock('@/core/agent/media-receipt', () => ({
  verifyAgentMediaReceipt: mocks.verifyAgentMediaReceipt,
}));
vi.mock('@/content/catalog-pages', () => ({
  isCatalogPageContentAvailable: vi.fn(() => true),
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
vi.mock('@/modules/agent/entry-policy', () => ({
  GenerationEntryPolicyError: class extends Error {},
  applyEffectiveGenerationPolicy: mocks.applyEffectiveGenerationPolicy,
  parseGenerationRequestAttachments: mocks.parseGenerationRequestAttachments,
  resolveEffectiveGenerationPolicy: mocks.resolveEffectiveGenerationPolicy,
  validateRequestAttachments: mocks.validateRequestAttachments,
}));
vi.mock('@/modules/agent/paywall', () => ({
  checkCredits: vi.fn(() => ({ allowed: true, required: 1, balance: 10 })),
  insufficientCreditsBody: vi.fn(),
}));
vi.mock('@/modules/agent/skills', () => ({
  getPromptSkill: mocks.getPromptSkill,
  SkillRegistryUnavailableError: class extends Error {},
}));
vi.mock('@/modules/agent/history', () => ({
  collectAllowedMediaAttachments: mocks.collectAllowedMediaAttachments,
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
  getChatWithMessages: mocks.getChatWithMessages,
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
    mocks.resolveEffectiveGenerationPolicy.mockReturnValue({
      entryContext: { kind: 'home' },
      source: 'home',
      inputPolicy: { minimum: 0, maximum: 16, accepts: ['image'] },
    });
    mocks.applyEffectiveGenerationPolicy.mockImplementation(
      (settings) => settings
    );
    mocks.parseGenerationRequestAttachments.mockReturnValue([]);
    mocks.validateRequestAttachments.mockReturnValue(null);
    mocks.findChatOwnerId.mockResolvedValue(undefined);
    mocks.getChatWithMessages.mockResolvedValue(undefined);
    mocks.collectAllowedMediaAttachments.mockReturnValue([]);
    mocks.verifyAgentMediaReceipt.mockResolvedValue(null);
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
    expect(mocks.getChatWithMessages).not.toHaveBeenCalled();
    expect(mocks.collectAllowedMediaAttachments).not.toHaveBeenCalled();
    expect(mocks.verifyAgentMediaReceipt).not.toHaveBeenCalled();
    expect(mocks.acquireTurnLease).not.toHaveBeenCalled();
  });

  it('does not preload media history for a foreign chat', async () => {
    mocks.findChatOwnerId.mockResolvedValue('user-2');

    const response = await POST({ request: chatRequest() });

    expect(response.status).toBe(404);
    expect(mocks.getActiveTurnLease).not.toHaveBeenCalled();
    expect(mocks.getChatWithMessages).not.toHaveBeenCalled();
    expect(mocks.collectAllowedMediaAttachments).not.toHaveBeenCalled();
    expect(mocks.verifyAgentMediaReceipt).not.toHaveBeenCalled();
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

  it('rejects forged entry context before acquiring a turn lease', async () => {
    mocks.resolveEffectiveGenerationPolicy.mockImplementation(() => {
      throw new Error('Generation entry is not available.');
    });
    const request = new Request('http://localhost/api/agent/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: 'session-1',
        message: 'hello',
        settings: {},
        entryContext: {
          kind: 'model',
          entityId: 'retired-model',
          locale: 'en',
        },
      }),
    });
    const response = await POST({ request });
    expect(response.status).toBe(400);
    expect(mocks.acquireTurnLease).not.toHaveBeenCalled();
  });

  it('passes only server-resolved settings and policy into preparation', async () => {
    const locked = {
      mediaMode: 'image',
      imageModelName: 'gpt-image-2',
    };
    mocks.applyEffectiveGenerationPolicy.mockReturnValue(locked);
    const request = new Request('http://localhost/api/agent/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: 'session-1',
        message: 'hello',
        settings: { mediaMode: 'video', modelName: 'seedance-2-0' },
        entryContext: {
          kind: 'model',
          entityId: 'gpt-image-2',
          locale: 'en',
        },
        attachments: [],
      }),
    });
    const response = await POST({ request });
    expect(response.status).toBe(200);
    await response.text();
    expect(mocks.prepareAgentTurn).toHaveBeenCalledWith(
      expect.objectContaining({
        settings: locked,
        policy: expect.objectContaining({ source: 'home' }),
      })
    );
  });

  it('rejects current attachments without a valid receipt or same-chat history', async () => {
    mocks.parseGenerationRequestAttachments.mockReturnValue([
      {
        mediaType: 'image',
        url: 'https://cdn.example.com/start.png',
        receipt: 'bad',
      },
    ]);
    mocks.verifyAgentMediaReceipt.mockResolvedValue(null);

    const response = await POST({ request: chatRequest() });

    expect(response.status).toBe(400);
    expect(await response.text()).toContain('invalid attachment receipt');
    expect(mocks.acquireTurnLease).not.toHaveBeenCalled();
  });

  it('passes verified media to preparation without persisting receipts in policy', async () => {
    mocks.parseGenerationRequestAttachments.mockReturnValue([
      {
        mediaType: 'image',
        url: 'https://cdn.example.com/start.png',
        receipt: 'receipt',
      },
    ]);
    mocks.verifyAgentMediaReceipt.mockResolvedValue({
      mediaType: 'image',
      url: 'https://cdn.example.com/start.png',
    });

    const response = await POST({ request: chatRequest() });
    expect(response.status).toBe(200);
    await response.text();

    expect(mocks.prepareAgentTurn).toHaveBeenCalledWith(
      expect.objectContaining({
        policy: expect.objectContaining({
          requestAttachments: [
            {
              mediaType: 'image',
              url: 'https://cdn.example.com/start.png',
            },
          ],
          allowedAttachments: [
            {
              mediaType: 'image',
              url: 'https://cdn.example.com/start.png',
            },
          ],
        }),
      })
    );
    expect(
      mocks.prepareAgentTurn.mock.calls[0][0].policy.requestAttachments[0]
    ).not.toHaveProperty('receipt');
  });

  it('accepts an exact same-chat historical attachment without a fresh receipt', async () => {
    const historical = {
      mediaType: 'image',
      url: 'https://cdn.example.com/previous.png',
    } as const;
    mocks.findChatOwnerId.mockResolvedValue('user-1');
    mocks.getChatWithMessages.mockResolvedValue({
      chat: { id: 'session-1' },
      messages: [],
    });
    mocks.collectAllowedMediaAttachments.mockReturnValue([historical]);
    mocks.parseGenerationRequestAttachments.mockReturnValue([historical]);

    const response = await POST({ request: chatRequest() });
    expect(response.status).toBe(200);
    await response.text();

    expect(mocks.verifyAgentMediaReceipt).not.toHaveBeenCalled();
    expect(mocks.prepareAgentTurn).toHaveBeenCalledWith(
      expect.objectContaining({
        preloadedChat: expect.objectContaining({
          chat: { id: 'session-1' },
        }),
        policy: expect.objectContaining({
          requestAttachments: [historical],
          allowedAttachments: [historical],
        }),
      })
    );
  });

  it('does not count incompatible historical media toward the entry minimum', async () => {
    mocks.resolveEffectiveGenerationPolicy.mockReturnValue({
      entryContext: { kind: 'home' },
      source: 'home',
      inputPolicy: { minimum: 1, maximum: 1, accepts: ['image'] },
    });
    mocks.findChatOwnerId.mockResolvedValue('user-1');
    mocks.getChatWithMessages.mockResolvedValue({
      chat: { id: 'session-1' },
      messages: [],
    });
    mocks.collectAllowedMediaAttachments.mockReturnValue([
      { mediaType: 'video', url: 'https://cdn.example.com/previous.mp4' },
    ]);

    const response = await POST({ request: chatRequest() });
    expect(response.status).toBe(200);
    await response.text();

    expect(mocks.validateRequestAttachments).toHaveBeenCalledWith(
      expect.objectContaining({ minimumSatisfiedByAllowedMedia: false })
    );
  });

  it('rejects attachment payloads that fail the server policy', async () => {
    mocks.validateRequestAttachments.mockReturnValue(
      'This entry requires at least 1 attachment.'
    );
    const response = await POST({ request: chatRequest() });
    expect(response.status).toBe(400);
    expect(await response.text()).toContain('requires at least 1');
    expect(mocks.acquireTurnLease).not.toHaveBeenCalled();
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
