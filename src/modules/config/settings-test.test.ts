import { afterEach, describe, expect, it, vi } from 'vitest';

import { runTest } from './settings-test';

describe('EvoLink settings test', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('checks credits without queueing a paid generation', async () => {
    const request = vi.fn(
      async (_input: string | URL | Request, _init?: RequestInit) =>
        new Response(
          JSON.stringify({
            success: true,
            data: {
              token: { remaining_credits: '12.5' },
              user: { remaining_credits: '20.0' },
            },
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        )
    );
    vi.stubGlobal('fetch', request);

    const result = await runTest(
      'evolink',
      {},
      {
        evolink_api_key: 'test-credential',
        evolink_base_url: 'https://api.evolink.example/',
      }
    );

    expect(result).toEqual({
      success: true,
      message: 'EvoLink accepted the request',
      details: {
        'Token credits': '12.5',
        'Account credits': '20.0',
      },
    });
    expect(request).toHaveBeenCalledOnce();
    const [url, init] = request.mock.calls[0];
    expect(String(url)).toBe('https://api.evolink.example/v1/credits');
    expect(init?.method).toBe('GET');
    expect((init?.headers as Record<string, string>).Authorization).toBe(
      'Bearer test-credential'
    );
    expect(init?.body).toBeUndefined();
  });

  it('fails locally when the API key is missing', async () => {
    const request = vi.fn();
    vi.stubGlobal('fetch', request);

    await expect(runTest('evolink', {}, {})).resolves.toEqual({
      success: false,
      message: 'Missing config: evolink_api_key',
    });
    expect(request).not.toHaveBeenCalled();
  });
});
