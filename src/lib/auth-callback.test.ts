import { describe, expect, it } from 'vitest';

import {
  parseEmailVerificationSignal,
  sanitizeAuthCallback,
  verificationCompletionPath,
} from './auth-callback';

describe('sanitizeAuthCallback', () => {
  it('keeps safe locale-free or localized paths and queries', () => {
    expect(sanitizeAuthCallback('/chat/session-1?source=home')).toBe(
      '/chat/session-1?source=home'
    );
    expect(sanitizeAuthCallback('/zh/chat/session-1')).toBe(
      '/zh/chat/session-1'
    );
    expect(sanitizeAuthCallback('%2Fchat%2Fsession-1')).toBe('/chat/session-1');
  });

  it('rejects external, protocol-relative, encoded and auth-loop targets', () => {
    for (const target of [
      'https://evil.example/path',
      '//evil.example/path',
      '%252F%252Fevil.example',
      '/\\evil.example',
      '/sign-in?callbackUrl=/chat',
      '/zh/sign-up',
      '/en/chat/session-1',
      '/verify-email',
      '/chat#token',
    ]) {
      expect(sanitizeAuthCallback(target)).toBeNull();
    }
  });

  it('uses the caller-provided safe fallback', () => {
    expect(sanitizeAuthCallback('https://evil.example', '/chat')).toBe('/chat');
    expect(
      sanitizeAuthCallback('https://evil.example', 'https://also-evil.example')
    ).toBeNull();
  });
});

describe('email verification callback contract', () => {
  it('routes the verification tab through a completion page without payload data', () => {
    const path = verificationCompletionPath('/chat/s-1234-abcd?source=home');
    expect(path).toBe(
      '/verify-email?verified=1&callbackUrl=%2Fchat%2Fs-1234-abcd%3Fsource%3Dhome'
    );
    expect(path).not.toContain('prompt');
    expect(path).not.toContain('attachments');
  });

  it('accepts only a completion signal for the expected safe callback', () => {
    expect(
      parseEmailVerificationSignal(
        { type: 'verified', callbackUrl: '/chat/s-1234-abcd' },
        '/chat/s-1234-abcd'
      )
    ).toEqual({ type: 'verified', callbackUrl: '/chat/s-1234-abcd' });
    expect(
      parseEmailVerificationSignal(
        { type: 'verified', callbackUrl: 'https://evil.example' },
        '/chat/s-1234-abcd'
      )
    ).toBeNull();
    expect(
      parseEmailVerificationSignal(
        { type: 'verified', callbackUrl: '/chat/other' },
        '/chat/s-1234-abcd'
      )
    ).toBeNull();
  });
});
