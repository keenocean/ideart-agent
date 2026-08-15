import { describe, expect, it } from 'vitest';

import { sanitizeAuthCallback } from './auth-callback';

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
