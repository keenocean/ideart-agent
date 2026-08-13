import { beforeEach, describe, expect, it, vi } from 'vitest';

import { GET } from './chat.$sessionId.audit';

const mocks = vi.hoisted(() => ({
  findChatOwnerId: vi.fn(),
  getChatForAdmin: vi.fn(),
  getChatWithMessages: vi.fn(),
  getSession: vi.fn(),
  hasPermission: vi.fn(),
}));

vi.mock('@tanstack/react-router', () => ({
  createFileRoute: vi.fn(() => (options: unknown) => options),
}));
vi.mock('@/core/auth', () => ({
  getAuth: () => ({ api: { getSession: mocks.getSession } }),
}));
vi.mock('@/modules/chats/service', () => ({
  findChatOwnerId: mocks.findChatOwnerId,
  getChatForAdmin: mocks.getChatForAdmin,
  getChatWithMessages: mocks.getChatWithMessages,
}));
vi.mock('@/modules/rbac/service', () => ({
  hasPermission: mocks.hasPermission,
}));

const request = new Request('http://localhost/api/agent/chat/session-1/audit');
const params = { sessionId: 'session-1' };
const audit = {
  schemaVersion: 1 as const,
  kind: 'user' as const,
  turnId: 'turn-1',
  agentDefinitionId: 'primary',
  businessPromptHash: 'business-hash',
  effectivePromptHash: 'effective-hash',
  promptSource: 'admin' as const,
  llmProvider: 'openai',
  llmModel: 'model-1',
  skillName: null,
  skillReleaseId: null,
  toolNames: ['generate_image'],
  longRunningToolNames: ['generate_image'],
};

function detail() {
  return {
    chat: { id: 'session-1' },
    messages: [
      {
        id: 'message-1',
        role: 'user',
        parts: [{ type: 'text', text: 'SECRET PROMPT BODY' }],
        metadata: audit,
      },
    ],
  };
}

describe('Agent audit endpoint authorization', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getSession.mockResolvedValue({ user: { id: 'user-1' } });
    mocks.findChatOwnerId.mockResolvedValue('user-1');
    mocks.getChatWithMessages.mockResolvedValue(detail());
  });

  it('returns only safe execution metadata to the owner', async () => {
    const response = await GET({ request, params });
    const body = await response.text();
    expect(response.status).toBe(200);
    expect(body).toContain('effective-hash');
    expect(body).not.toContain('SECRET PROMPT BODY');
    expect(body).not.toContain('parts');
  });

  it('allows an admin to inspect another owner chat', async () => {
    mocks.findChatOwnerId.mockResolvedValue('user-2');
    mocks.hasPermission.mockResolvedValue(true);
    mocks.getChatForAdmin.mockResolvedValue(detail());

    const response = await GET({ request, params });
    expect(response.status).toBe(200);
    expect(mocks.getChatForAdmin).toHaveBeenCalledWith('session-1');
  });

  it('returns not found to a non-owner without admin permission', async () => {
    mocks.findChatOwnerId.mockResolvedValue('user-2');
    mocks.hasPermission.mockResolvedValue(false);

    const response = await GET({ request, params });
    expect(response.status).toBe(404);
    expect(mocks.getChatWithMessages).not.toHaveBeenCalled();
    expect(mocks.getChatForAdmin).not.toHaveBeenCalled();
  });
});
