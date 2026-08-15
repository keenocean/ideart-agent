import { beforeEach, describe, expect, it, vi } from 'vitest';

import { POST } from './upload-image';

const mocks = vi.hoisted(() => ({
  createAgentMediaReceipt: vi.fn(),
  getSession: vi.fn(),
  getStorage: vi.fn(),
  exists: vi.fn(),
  getPublicUrl: vi.fn(),
  uploadFile: vi.fn(),
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
vi.mock('@/modules/storage/service', () => ({
  getStorage: mocks.getStorage,
}));
vi.mock('@/lib/rate-limit', () => ({
  enforceMinIntervalRateLimit: vi.fn(() => null),
}));

function requestFor(file: File, referenceMedia = true) {
  const formData = new FormData();
  formData.append('files', file);
  formData.append('requirePublic', 'true');
  if (referenceMedia) {
    formData.append('referenceMedia', 'true');
    formData.append('chatId', 's-1777280106721-target');
  }
  return new Request('http://localhost/api/storage/upload-image', {
    method: 'POST',
    body: formData,
  });
}

function pngFile(
  bytes: number[] = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]
) {
  return new File([new Uint8Array(bytes)], 'reference.png', {
    type: 'image/png',
  });
}

describe('reference media upload receipts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getSession.mockResolvedValue({ user: { id: 'user-1' } });
    mocks.getStorage.mockResolvedValue({
      exists: mocks.exists,
      getPublicUrl: mocks.getPublicUrl,
      uploadFile: mocks.uploadFile,
    });
    mocks.exists.mockResolvedValue(true);
    mocks.getPublicUrl.mockReturnValue('https://cdn.example.com/reference.png');
    mocks.createAgentMediaReceipt.mockResolvedValue('signed-receipt');
  });

  it('signs the exact deduplicated public URL after magic-byte validation', async () => {
    const response = await POST({ request: requestFor(pngFile()) });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      code: 0,
      data: {
        results: [
          {
            url: 'https://cdn.example.com/reference.png',
            mediaType: 'image',
            receipt: 'signed-receipt',
            deduped: true,
          },
        ],
      },
    });
    expect(mocks.createAgentMediaReceipt).toHaveBeenCalledWith({
      userId: 'user-1',
      chatId: 's-1777280106721-target',
      mediaType: 'image',
      url: 'https://cdn.example.com/reference.png',
    });
    expect(mocks.uploadFile).not.toHaveBeenCalled();
  });

  it('rejects spoofed file contents before storage or receipt issuance', async () => {
    const response = await POST({
      request: requestFor(pngFile([0x6e, 0x6f, 0x70, 0x65])),
    });

    expect(response.status).toBe(415);
    expect(mocks.exists).not.toHaveBeenCalled();
    expect(mocks.createAgentMediaReceipt).not.toHaveBeenCalled();
  });
});
