import { afterEach, describe, expect, it, vi } from 'vitest';

import { createD1PrimarySession } from './d1';

afterEach(() => {
  delete (globalThis as any).__CF_ENV__;
});

describe('createD1PrimarySession', () => {
  it('starts every latest-read session at first-primary', () => {
    const session = { prepare: vi.fn() };
    const withSession = vi.fn(() => session);
    (globalThis as any).__CF_ENV__ = { DB: { withSession } };

    expect(createD1PrimarySession()).toBe(session);
    expect(withSession).toHaveBeenCalledWith('first-primary');
  });
});
