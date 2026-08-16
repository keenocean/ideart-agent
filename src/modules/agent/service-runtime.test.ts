import { beforeEach, describe, expect, it, vi } from 'vitest';

import { runAgentTurn } from './service';

const mocks = vi.hoisted(() => ({
  close: vi.fn(async () => undefined),
  createAgent: vi.fn(),
  createAgentTools: vi.fn(() => []),
  getAllConfigs: vi.fn(async () => ({
    openai_api_key: 'test-key',
    agent_model: 'test-model',
  })),
  loadAgentHistory: vi.fn(async () => [
    { role: 'user' as const, content: 'previous message' },
  ]),
  query: vi.fn(),
}));

vi.mock('@keenocean/open-agent-sdk', () => ({
  createAgent: mocks.createAgent,
}));

vi.mock('@/modules/config/service', () => ({
  getAllConfigs: mocks.getAllConfigs,
  getConfigLatest: vi.fn(async () => undefined),
}));

vi.mock('./history', () => ({
  loadAgentHistory: mocks.loadAgentHistory,
  LONG_RUNNING_MEDIA_TOOL_NAMES: [
    'generate_image',
    'generate_video',
    'animate_image',
  ],
}));

vi.mock('./tools', () => ({
  createAgentTools: mocks.createAgentTools,
}));

vi.mock('./skills', () => ({
  buildSkillSystemPrompt: vi.fn(() => ''),
}));

describe('runAgentTurn', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.query.mockImplementation(() =>
      (async function* () {
        yield {
          type: 'result',
          subtype: 'success',
          is_error: false,
          result: '',
        };
      })()
    );
    mocks.createAgent.mockReturnValue({
      query: mocks.query,
      close: mocks.close,
    });
  });

  it('excludes the persisted current message from history and sends it once as the query', async () => {
    const events = [];
    for await (const event of runAgentTurn({
      sessionId: 'session-1',
      userId: 'user-1',
      message: 'current message',
      persistedUserMessageId: 'message-current',
    })) {
      events.push(event);
    }

    expect(mocks.loadAgentHistory).toHaveBeenCalledWith(
      'session-1',
      'user-1',
      'message-current',
      [],
      undefined
    );
    expect(events.find((event) => event.type === 'error')).toBeUndefined();
    expect(mocks.createAgent).toHaveBeenCalledWith(
      expect.objectContaining({
        history: [{ role: 'user', content: 'previous message' }],
        includePartialMessages: true,
      })
    );
    expect(mocks.query).toHaveBeenCalledTimes(1);
    expect(mocks.query).toHaveBeenCalledWith('current message');
    expect(events.at(-1)).toEqual({ type: 'done' });
  });

  it('forwards text partials without repeating the final assistant text', async () => {
    mocks.query.mockImplementation(() =>
      (async function* () {
        yield {
          type: 'partial_message',
          partial: { type: 'text', text: 'Hello ' },
        };
        yield {
          type: 'partial_message',
          partial: { type: 'thinking', thinking: 'Internal reasoning' },
        };
        yield {
          type: 'partial_message',
          partial: { type: 'text', text: 'world' },
        };
        yield {
          type: 'assistant',
          message: {
            role: 'assistant',
            content: [{ type: 'text', text: 'Hello world' }],
          },
        };
        yield {
          type: 'result',
          subtype: 'success',
          is_error: false,
          result: '',
        };
      })()
    );

    const events = [];
    for await (const event of runAgentTurn({
      sessionId: 'session-1',
      userId: 'user-1',
      message: 'current message',
      persistedUserMessageId: 'message-current',
    })) {
      events.push(event);
    }

    expect(events.filter((event) => event.type === 'content')).toEqual([
      { type: 'content', data: { content: 'Hello ' } },
      { type: 'content', data: { content: 'world' } },
    ]);
    expect(events.at(-1)).toEqual({ type: 'done' });
  });
});
