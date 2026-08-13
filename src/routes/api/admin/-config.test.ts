import { beforeEach, describe, expect, it, vi } from 'vitest';

import { GET, POST } from './config';

const mocks = vi.hoisted(() => ({
  getAdminConfigs: vi.fn(async () => ({ agent_model: 'model-1' })),
  getConfigLatest: vi.fn(async () => 'Latest prompt'),
  getSession: vi.fn(),
  hasPermission: vi.fn(),
  saveConfigs: vi.fn(async () => undefined),
}));

vi.mock('@tanstack/react-router', () => ({
  createFileRoute: vi.fn(() => (options: unknown) => options),
}));

vi.mock('@/core/auth', () => ({
  getAuth: () => ({ api: { getSession: mocks.getSession } }),
}));

vi.mock('@/modules/rbac/service', () => ({
  hasPermission: mocks.hasPermission,
}));

vi.mock('@/modules/config/service', () => ({
  getAdminConfigs: mocks.getAdminConfigs,
  getConfigLatest: mocks.getConfigLatest,
  saveConfigs: mocks.saveConfigs,
}));

const request = (body?: unknown) =>
  new Request('http://localhost/api/admin/config', {
    method: body === undefined ? 'GET' : 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

describe('admin Agent Prompt config authorization', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getSession.mockResolvedValue({ user: { id: 'user-1' } });
    mocks.hasPermission.mockResolvedValue(true);
  });

  it.each([
    ['GET', () => GET({ request: request() })],
    ['POST', () => POST({ request: request({ agent_system_prompt: 'x' }) })],
  ])('returns HTTP 401 for unauthenticated %s', async (_method, call) => {
    mocks.getSession.mockResolvedValue(null);
    const response = await call();
    expect(response.status).toBe(401);
    expect(mocks.saveConfigs).not.toHaveBeenCalled();
  });

  it('requires the read permission before reading configs', async () => {
    mocks.hasPermission.mockResolvedValue(false);
    const response = await GET({ request: request() });
    expect(response.status).toBe(403);
    expect(mocks.hasPermission).toHaveBeenCalledWith(
      'user-1',
      'admin.settings.read'
    );
    expect(mocks.getAdminConfigs).not.toHaveBeenCalled();
  });

  it('overlays the uncached latest Prompt in the authorized response', async () => {
    const response = await GET({ request: request() });
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      code: 0,
      data: {
        agent_model: 'model-1',
        agent_system_prompt: 'Latest prompt',
      },
    });
  });

  it('requires the write permission and has no denied-write side effect', async () => {
    mocks.hasPermission.mockResolvedValue(false);
    const response = await POST({
      request: request({ agent_system_prompt: 'x' }),
    });
    expect(response.status).toBe(403);
    expect(mocks.hasPermission).toHaveBeenCalledWith(
      'user-1',
      'admin.settings.write'
    );
    expect(mocks.saveConfigs).not.toHaveBeenCalled();
  });
});

describe('admin Agent Prompt config validation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getSession.mockResolvedValue({ user: { id: 'admin-1' } });
    mocks.hasPermission.mockResolvedValue(true);
  });

  it.each([
    ['array body', []],
    ['non-string value', { agent_system_prompt: 42 }],
    ['unknown variable', { agent_system_prompt: 'Hello {{secret}}' }],
    ['oversized value', { agent_system_prompt: 'a'.repeat(20 * 1024 + 1) }],
  ])('rejects %s with HTTP 400 and does not write', async (_name, body) => {
    const response = await POST({ request: request(body) });
    expect(response.status).toBe(400);
    expect(mocks.saveConfigs).not.toHaveBeenCalled();
  });

  it('rejects malformed JSON with HTTP 400 and does not write', async () => {
    const response = await POST({
      request: new Request('http://localhost/api/admin/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{bad',
      }),
    });
    expect(response.status).toBe(400);
    expect(mocks.saveConfigs).not.toHaveBeenCalled();
  });

  it('writes a valid or blank Prompt unchanged', async () => {
    for (const value of ['Hello {{agent_name}}', '']) {
      const response = await POST({
        request: request({ agent_system_prompt: value }),
      });
      expect(response.status).toBe(200);
      expect(mocks.saveConfigs).toHaveBeenLastCalledWith({
        agent_system_prompt: value,
      });
    }
  });
});
