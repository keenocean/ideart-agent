import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { AUTH_SECRET_PLACEHOLDER, envConfigs } from '@/config';

import {
  createAgentMediaReceipt,
  verifyAgentMediaReceipt,
} from './media-receipt';

describe('agent media receipt', () => {
  const originalSecret = envConfigs.auth_secret;

  beforeEach(() => {
    envConfigs.auth_secret = 'test-secret';
  });

  afterEach(() => {
    envConfigs.auth_secret = originalSecret;
  });

  it('binds user, chat, media type, exact URL and expiry', async () => {
    const receipt = await createAgentMediaReceipt({
      userId: 'user-1',
      chatId: 's-1777280106721-abcd',
      mediaType: 'image',
      url: 'https://cdn.example.com/a.png',
      now: 1000,
      ttlMs: 100,
    });

    await expect(
      verifyAgentMediaReceipt({
        receipt,
        userId: 'user-1',
        chatId: 's-1777280106721-abcd',
        mediaType: 'image',
        url: 'https://cdn.example.com/a.png',
        now: 1099,
      })
    ).resolves.toEqual({
      mediaType: 'image',
      url: 'https://cdn.example.com/a.png',
    });
    await expect(
      verifyAgentMediaReceipt({
        receipt,
        userId: 'user-2',
        chatId: 's-1777280106721-abcd',
        mediaType: 'image',
        url: 'https://cdn.example.com/a.png',
        now: 1099,
      })
    ).resolves.toBeNull();
    await expect(
      verifyAgentMediaReceipt({
        receipt,
        userId: 'user-1',
        chatId: 's-1777280106721-other',
        mediaType: 'image',
        url: 'https://cdn.example.com/a.png',
        now: 1099,
      })
    ).resolves.toBeNull();
    await expect(
      verifyAgentMediaReceipt({
        receipt,
        userId: 'user-1',
        chatId: 's-1777280106721-abcd',
        mediaType: 'image',
        url: 'https://cdn.example.com/b.png',
        now: 1099,
      })
    ).resolves.toBeNull();
    await expect(
      verifyAgentMediaReceipt({
        receipt,
        userId: 'user-1',
        chatId: 's-1777280106721-abcd',
        mediaType: 'video',
        url: 'https://cdn.example.com/a.png',
        now: 1099,
      })
    ).resolves.toBeNull();
    await expect(
      verifyAgentMediaReceipt({
        receipt,
        userId: 'user-1',
        chatId: 's-1777280106721-abcd',
        mediaType: 'image',
        url: 'https://cdn.example.com/a.png',
        now: 1100,
      })
    ).resolves.toBeNull();
  });

  it('rejects tampered and oversized receipts before trusting their payload', async () => {
    const receipt = await createAgentMediaReceipt({
      userId: 'user-1',
      chatId: 's-1777280106721-abcd',
      mediaType: 'image',
      url: 'https://cdn.example.com/a.png',
    });
    const [encoded, signature] = receipt.split('.');

    await expect(
      verifyAgentMediaReceipt({
        receipt: `${encoded}x.${signature}`,
        userId: 'user-1',
        chatId: 's-1777280106721-abcd',
        mediaType: 'image',
        url: 'https://cdn.example.com/a.png',
      })
    ).resolves.toBeNull();
    await expect(
      verifyAgentMediaReceipt({
        receipt: 'x'.repeat(4_097),
        userId: 'user-1',
        chatId: 's-1777280106721-abcd',
        mediaType: 'image',
        url: 'https://cdn.example.com/a.png',
      })
    ).resolves.toBeNull();
  });

  it.each(['', AUTH_SECRET_PLACEHOLDER])(
    'fails closed when the server secret is %j',
    async (secret) => {
      envConfigs.auth_secret = secret;
      await expect(
        createAgentMediaReceipt({
          userId: 'user-1',
          chatId: 's-1777280106721-abcd',
          mediaType: 'image',
          url: 'https://cdn.example.com/a.png',
        })
      ).rejects.toThrow(/AUTH_SECRET/);
    }
  );
});
