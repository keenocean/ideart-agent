import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  authorizeLibraryMediaForChat,
  isLocalChatMediaUrl,
  uploadChatMedia,
} from './agent';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('isLocalChatMediaUrl', () => {
  const origin = 'http://localhost:3000';

  it('recognizes bundled and same-origin media', () => {
    expect(isLocalChatMediaUrl('/videos/example.mp4', origin)).toBe(true);
    expect(
      isLocalChatMediaUrl('http://localhost:3000/images/frame.png', origin)
    ).toBe(true);
  });

  it('recognizes stale local-development ports', () => {
    expect(
      isLocalChatMediaUrl('http://localhost:3003/videos/example.mp4', origin)
    ).toBe(true);
    expect(
      isLocalChatMediaUrl('http://127.0.0.1:4173/images/frame.png', origin)
    ).toBe(true);
  });

  it('leaves external CDN media alone', () => {
    expect(
      isLocalChatMediaUrl('https://cdn.example.com/videos/example.mp4', origin)
    ).toBe(false);
  });
});

describe('verified chat media clients', () => {
  it('requires one signed receipt for every uploaded file', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          code: 0,
          data: {
            results: [{ url: 'https://cdn.example.com/reference.png' }],
          },
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    );
    vi.stubGlobal('fetch', fetchMock);

    await expect(
      uploadChatMedia(
        [new File(['image'], 'reference.png', { type: 'image/png' })],
        's-1777280106721-target'
      )
    ).rejects.toThrow(/verified media receipts/);

    const request = fetchMock.mock.calls[0][1] as RequestInit;
    expect(request.body).toBeInstanceOf(FormData);
    expect((request.body as FormData).get('chatId')).toBe(
      's-1777280106721-target'
    );
    expect((request.body as FormData).get('referenceMedia')).toBe('true');
  });

  it('rejects a library authorization response for a different URL', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            code: 0,
            data: {
              url: 'https://cdn.example.com/other.png',
              receipt: 'signed-receipt',
            },
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        )
      )
    );

    await expect(
      authorizeLibraryMediaForChat(
        {
          src: 'https://cdn.example.com/reference.png',
          mediaType: 'image',
          chatId: 's-1777280106721-source',
          sourceMessageId: 'message-1',
        },
        's-1777280106721-target'
      )
    ).rejects.toThrow(/Library media failed/);
  });
});
