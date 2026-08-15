import { beforeEach, describe, expect, it, vi } from 'vitest';

import { POST } from './library';

const mocks = vi.hoisted(() => ({
  createAgentMediaReceipt: vi.fn(),
  getSession: vi.fn(),
  getChatWithMessages: vi.fn(),
  listGeneratedImages: vi.fn(),
  collectAllowedMediaAttachments: vi.fn(),
}));

vi.mock('@tanstack/react-router', () => ({
  createFileRoute: vi.fn(() => (options: unknown) => options),
}));
vi.mock('@/core/auth', () => ({
  getAuth: () => ({ api: { getSession: mocks.getSession } }),
}));
vi.mock('@/core/agent/media-receipt', () => ({
  createAgentMediaReceipt: mocks.createAgentMediaReceipt,
}));
vi.mock('@/modules/chats/service', () => ({
  getChatWithMessages: mocks.getChatWithMessages,
  listGeneratedImages: mocks.listGeneratedImages,
}));
vi.mock('@/modules/agent/history', () => ({
  collectAllowedMediaAttachments: mocks.collectAllowedMediaAttachments,
}));

function request(body: Record<string, unknown>) {
  return new Request('http://localhost/api/agent/library', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

const validBody = {
  targetChatId: 's-1777280106721-target',
  sourceChatId: 's-1777280106721-source',
  sourceMessageId: 'assistant-1',
  mediaType: 'image',
  url: 'https://cdn.example.com/generated.png',
};

describe('agent library media authorization', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getSession.mockResolvedValue({ user: { id: 'user-1' } });
    mocks.getChatWithMessages.mockResolvedValue({
      chat: { id: 's-1777280106721-source' },
      messages: [
        {
          id: 'assistant-1',
          role: 'assistant',
          parts: [
            {
              type: 'tool_call',
              id: 'call-1',
              name: 'generate_image',
              arguments: '{}',
              result: JSON.stringify({
                status: 'success',
                files: ['https://cdn.example.com/generated.png'],
              }),
            },
          ],
          metadata: null,
          model: 'model',
          provider: 'provider',
          createdAt: new Date(),
        },
      ],
    });
    mocks.collectAllowedMediaAttachments.mockReturnValue([
      { mediaType: 'image', url: 'https://cdn.example.com/generated.png' },
    ]);
    mocks.createAgentMediaReceipt.mockResolvedValue('receipt');
  });

  it('signs a receipt only after owner-scoped source message and exact URL validation', async () => {
    const response = await POST({ request: request(validBody) });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      code: 0,
      data: {
        url: 'https://cdn.example.com/generated.png',
        mediaType: 'image',
        receipt: 'receipt',
      },
    });
    expect(mocks.createAgentMediaReceipt).toHaveBeenCalledWith({
      userId: 'user-1',
      chatId: 's-1777280106721-target',
      mediaType: 'image',
      url: 'https://cdn.example.com/generated.png',
    });
  });

  it('rejects a URL that is not in the claimed source message', async () => {
    const response = await POST({
      request: request({
        ...validBody,
        url: 'https://cdn.example.com/other.png',
      }),
    });

    expect(response.status).toBe(404);
    expect(mocks.createAgentMediaReceipt).not.toHaveBeenCalled();
  });

  it('fails closed when the owner-scoped source chat is unavailable', async () => {
    mocks.getChatWithMessages.mockResolvedValue(undefined);

    const response = await POST({ request: request(validBody) });

    expect(response.status).toBe(404);
    expect(mocks.getChatWithMessages).toHaveBeenCalledWith(
      's-1777280106721-source',
      'user-1'
    );
    expect(mocks.collectAllowedMediaAttachments).not.toHaveBeenCalled();
    expect(mocks.createAgentMediaReceipt).not.toHaveBeenCalled();
  });

  it('rejects a media type that does not match the verified source', async () => {
    const response = await POST({
      request: request({ ...validBody, mediaType: 'video' }),
    });

    expect(response.status).toBe(404);
    expect(mocks.createAgentMediaReceipt).not.toHaveBeenCalled();
  });
});
