import { describe, expect, it } from 'vitest';

import {
  buildCanonicalOriginRedirect,
  resolveRequestScheme,
} from './canonical-origin';

const CANONICAL = 'https://example.com';

function request(
  url: string,
  init: { method?: string; headers?: Record<string, string> } = {}
): Request {
  return new Request(url, {
    method: init.method ?? 'GET',
    headers: init.headers,
  });
}

describe('resolveRequestScheme', () => {
  it('prefers the Cloudflare edge signal over the request URL', () => {
    const url = new URL('https://example.com/');
    const req = request(url.href, {
      headers: { 'cf-visitor': '{"scheme":"http"}' },
    });
    expect(resolveRequestScheme(req, url)).toBe('http');
  });

  it('falls back to x-forwarded-proto behind a terminating proxy', () => {
    const url = new URL('http://example.com/');
    const req = request(url.href, {
      headers: { 'x-forwarded-proto': 'https, http' },
    });
    expect(resolveRequestScheme(req, url)).toBe('https');
  });

  it('ignores a malformed cf-visitor header', () => {
    const url = new URL('http://example.com/');
    const req = request(url.href, { headers: { 'cf-visitor': 'not-json' } });
    expect(resolveRequestScheme(req, url)).toBe('http');
  });
});

describe('buildCanonicalOriginRedirect', () => {
  it('leaves a request that is already canonical alone', () => {
    const req = request('https://example.com/tools?page=2');
    expect(buildCanonicalOriginRedirect(req, CANONICAL)).toBeNull();
  });

  it('upgrades HTTP to HTTPS, keeping path and query', () => {
    const req = request('http://example.com/tools?page=2');
    const response = buildCanonicalOriginRedirect(req, CANONICAL);
    expect(response?.status).toBe(301);
    expect(response?.headers.get('Location')).toBe(
      'https://example.com/tools?page=2'
    );
  });

  it('upgrades HTTP reported only by the Cloudflare edge', () => {
    const req = request('https://example.com/tools', {
      headers: { 'cf-visitor': '{"scheme":"http"}' },
    });
    expect(buildCanonicalOriginRedirect(req, CANONICAL)?.status).toBe(301);
  });

  it('folds www onto the canonical apex host', () => {
    const req = request('https://www.example.com/guides/face-shape-styling');
    const response = buildCanonicalOriginRedirect(req, CANONICAL);
    expect(response?.headers.get('Location')).toBe(
      'https://example.com/guides/face-shape-styling'
    );
  });

  it('folds any other host that reaches the app onto the canonical one', () => {
    const req = request('https://legacy.example.net/pricing');
    expect(
      buildCanonicalOriginRedirect(req, CANONICAL)?.headers.get('Location')
    ).toBe('https://example.com/pricing');
  });

  it('preserves method and body semantics for a non-GET request', () => {
    const req = request('http://example.com/api/payment/notify/stripe', {
      method: 'POST',
    });
    expect(buildCanonicalOriginRedirect(req, CANONICAL)?.status).toBe(308);
  });

  it('does nothing when the canonical origin is not production HTTPS', () => {
    const req = request('http://192.168.1.5:3000/');
    expect(
      buildCanonicalOriginRedirect(req, 'http://localhost:3000')
    ).toBeNull();
  });

  it('never redirects local or sandbox preview hosts', () => {
    for (const url of [
      'http://localhost:3000/',
      'http://127.0.0.1:3000/tools',
      'https://3000-abc123.e2b.app/',
    ]) {
      expect(buildCanonicalOriginRedirect(request(url), CANONICAL)).toBeNull();
    }
  });

  it('folds the default workers.dev URL onto a configured custom domain', () => {
    const req = request('http://app.team.workers.dev/zh/skills?page=2');
    expect(
      buildCanonicalOriginRedirect(req, CANONICAL)?.headers.get('Location')
    ).toBe('https://example.com/zh/skills?page=2');
  });

  it('leaves a deployment still on its workers.dev URL alone', () => {
    const canonical = 'https://app.team.workers.dev';
    const req = request('https://app.team.workers.dev/skills');
    expect(buildCanonicalOriginRedirect(req, canonical)).toBeNull();
  });

  it('ignores an unparseable canonical origin instead of throwing', () => {
    expect(
      buildCanonicalOriginRedirect(request('http://example.com/'), 'not a url')
    ).toBeNull();
  });
});
