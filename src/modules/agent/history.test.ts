import { describe, expect, it } from 'vitest';

import type { AgentMessageMetadata } from '@/core/agent/types';
import type { StoredPart } from '@/modules/chats/service';

import {
  collectAllowedMediaAttachments,
  completeInterruptedMediaCalls,
  mapRowsToHistory,
} from './history';

// The runtime is stateless: every turn replays the conversation from these
// rows. If the mapping drops a tool call or detaches it from its result, the
// model either forgets what it just did or the provider rejects the request.
type Row = {
  id?: string;
  role: 'user' | 'assistant';
  parts: StoredPart[];
  metadata?: AgentMessageMetadata | null;
};

const text = (t: string): StoredPart => ({ type: 'text', text: t });
const call = (
  id: string,
  name: string,
  args: string,
  result?: string
): StoredPart => ({ type: 'tool_call', id, name, arguments: args, result });

const userAudit: AgentMessageMetadata = {
  schemaVersion: 1,
  kind: 'user',
  turnId: 'turn-1',
  agentDefinitionId: 'primary',
  businessPromptHash: 'business-hash',
  effectivePromptHash: 'effective-hash',
  promptSource: 'default',
  llmProvider: 'openai',
  llmModel: 'model-1',
  skillName: null,
  skillReleaseId: null,
  toolNames: ['generate_image'],
  longRunningToolNames: ['generate_image'],
};

const assistantAudit: AgentMessageMetadata = {
  schemaVersion: 1,
  kind: 'assistant',
  turnId: 'turn-1',
  parentUserMessageId: 'user-1',
  roundIndex: 0,
};

function linkedToolRows(parts: StoredPart[]): Row[] {
  return [
    {
      id: 'user-1',
      role: 'user',
      parts: [text('draw a cat')],
      metadata: userAudit,
    },
    {
      id: 'assistant-1',
      role: 'assistant',
      parts,
      metadata: assistantAudit,
    },
  ];
}

describe('mapRowsToHistory', () => {
  it('carries a plain exchange through in order', () => {
    const rows: Row[] = [
      { role: 'user', parts: [text('draw a cat')] },
      { role: 'assistant', parts: [text('here you go')] },
    ];
    expect(mapRowsToHistory(rows)).toEqual([
      { role: 'user', content: 'draw a cat' },
      { role: 'assistant', content: [{ type: 'text', text: 'here you go' }] },
    ]);
  });

  it('excludes only the persisted current user turn from replay', () => {
    const rows: Array<Row & { id: string }> = [
      { id: 'previous-user', role: 'user', parts: [text('draw a cat')] },
      {
        id: 'previous-assistant',
        role: 'assistant',
        parts: [text('what style?')],
      },
      { id: 'current-user', role: 'user', parts: [text('draw a cat')] },
    ];

    expect(mapRowsToHistory(rows, 'current-user')).toEqual([
      { role: 'user', content: 'draw a cat' },
      {
        role: 'assistant',
        content: [{ type: 'text', text: 'what style?' }],
      },
    ]);
  });

  it('splits a tool call into tool_use and a following tool_result', () => {
    const rows = linkedToolRows([
      text('on it'),
      call('c1', 'generate_image', '{"prompt":"a cat"}', '{"files":["a"]}'),
    ]);

    const history = mapRowsToHistory(rows, undefined, ['generate_image']);

    expect(history).toHaveLength(3);
    expect(history[1]).toEqual({
      role: 'assistant',
      content: [
        { type: 'text', text: 'on it' },
        {
          type: 'tool_use',
          id: 'c1',
          name: 'generate_image',
          input: { prompt: 'a cat' },
        },
      ],
    });
    // The result belongs to the *user* turn — that is the shape providers
    // expect, and the id has to match or the call dangles.
    expect(history[2]).toEqual({
      role: 'user',
      content: [
        { type: 'tool_result', tool_use_id: 'c1', content: '{"files":["a"]}' },
      ],
    });
  });

  it('marks a call that never got a result as an error', () => {
    const rows = linkedToolRows([call('c1', 'generate_image', '{}')]);
    const [, assistant, result] = mapRowsToHistory(rows, undefined, [
      'generate_image',
    ]);
    expect(assistant.role).toBe('assistant');
    // Leaving it out would strand the tool_use; leaving it blank would let the
    // model believe the call succeeded.
    expect(result).toEqual({
      role: 'user',
      content: [
        {
          type: 'tool_result',
          tool_use_id: 'c1',
          content: expect.stringContaining('"status":"interrupted"'),
          is_error: true,
        },
      ],
    });
  });

  it('keeps several calls in one turn together, results in step', () => {
    const rows = linkedToolRows([
      call('c1', 'generate_image', '{"prompt":"a"}', 'ok-a'),
      call('c2', 'generate_image', '{"prompt":"b"}', 'ok-b'),
    ]);
    const [, assistant, results] = mapRowsToHistory(rows, undefined, [
      'generate_image',
    ]);
    expect((assistant.content as unknown[]).length).toBe(2);
    expect(results.content).toEqual([
      { type: 'tool_result', tool_use_id: 'c1', content: 'ok-a' },
      { type: 'tool_result', tool_use_id: 'c2', content: 'ok-b' },
    ]);
  });

  it('survives arguments that are not valid JSON', () => {
    const rows = linkedToolRows([call('c1', 'generate_image', '{oops', 'r')]);
    const [, assistant] = mapRowsToHistory(rows, undefined, ['generate_image']);
    // An empty object still lets the turn replay; throwing would lose the
    // whole conversation over one malformed row.
    expect((assistant.content as Array<{ input: unknown }>)[0].input).toEqual(
      {}
    );
  });

  it('drops empty text rather than sending a blank message', () => {
    const rows: Row[] = [
      { role: 'user', parts: [text('   ')] },
      { role: 'assistant', parts: [text('')] },
    ];
    expect(mapRowsToHistory(rows)).toEqual([]);
  });

  it('downgrades a completed legacy tool call to bounded text', () => {
    const hugeResult = 'x'.repeat(10_000);
    const history = mapRowsToHistory(
      [
        {
          role: 'assistant',
          parts: [call('c1', 'legacy_tool', '{}', hugeResult)],
        },
      ],
      undefined,
      ['legacy_tool']
    );

    expect(history).toHaveLength(1);
    const content = history[0].content as Array<{ type: string; text: string }>;
    expect(content[0].type).toBe('text');
    expect(content[0].text).toContain('Historical tool record: legacy_tool');
    expect(content[0].text.length).toBeLessThanOrEqual(2_000);
  });

  it('fails closed for a broken parent link or duplicate round', () => {
    const rows = linkedToolRows([call('c1', 'generate_image', '{}', 'ok')]);
    rows.push({
      id: 'assistant-duplicate',
      role: 'assistant',
      parts: [call('c2', 'generate_image', '{}', 'ok')],
      metadata: assistantAudit,
    });

    const history = mapRowsToHistory(rows, undefined, ['generate_image']);
    expect(JSON.stringify(history)).not.toContain('"type":"tool_use"');
    expect(JSON.stringify(history)).toContain('Historical tool record');
  });

  it('fails closed when a previously authorized tool is not registered now', () => {
    const history = mapRowsToHistory(
      linkedToolRows([call('c1', 'generate_image', '{}', 'ok')]),
      undefined,
      []
    );
    expect(JSON.stringify(history)).not.toContain('"type":"tool_use"');
  });

  it('never exposes audit metadata as model-visible history content', () => {
    const history = mapRowsToHistory(
      linkedToolRows([call('c1', 'generate_image', '{}', 'ok')]),
      undefined,
      ['generate_image']
    );
    const serialized = JSON.stringify(history);
    expect(serialized).not.toContain('business-hash');
    expect(serialized).not.toContain('effective-hash');
    expect(serialized).not.toContain('turn-1');
  });
});

describe('collectAllowedMediaAttachments', () => {
  it('collects audit media and associated successful generated files only', () => {
    const rows = linkedToolRows([
      call(
        'c1',
        'generate_image',
        '{"prompt":"a"}',
        JSON.stringify({
          status: 'success',
          files: ['https://cdn.example.com/generated.png'],
        })
      ),
    ]);
    rows[0].metadata = {
      ...userAudit,
      media: [{ mediaType: 'image', url: 'https://cdn.example.com/input.png' }],
    };

    expect(collectAllowedMediaAttachments(rows)).toEqual([
      { mediaType: 'image', url: 'https://cdn.example.com/input.png' },
      { mediaType: 'image', url: 'https://cdn.example.com/generated.png' },
    ]);
  });

  it('fails closed for broken association, unknown tool, malformed result and non-success status', () => {
    const associated = linkedToolRows([
      call(
        'c1',
        'generate_image',
        '{}',
        JSON.stringify({
          status: 'error',
          files: ['https://cdn.example.com/error.png'],
        })
      ),
      call(
        'c2',
        'generate_image',
        '{}',
        JSON.stringify({
          files: ['https://cdn.example.com/missing-status.png'],
        })
      ),
      call('c3', 'generate_image', '{}', '{broken'),
      call(
        'c4',
        'generate_image',
        '{}',
        JSON.stringify({
          status: 'success',
          files: ['https://cdn.example.com/not-an-image.mp4'],
        })
      ),
      call(
        'c5',
        'generate_image',
        '{}',
        JSON.stringify({
          status: 'success',
          files: ['http://127.0.0.1/private.png'],
        })
      ),
      call(
        'c6',
        'future_tool',
        '{}',
        JSON.stringify({
          status: 'success',
          files: ['https://cdn.example.com/future.png'],
        })
      ),
    ]);
    const brokenAssociation: Row[] = [
      {
        id: 'assistant-orphan',
        role: 'assistant',
        parts: [
          call(
            'c7',
            'generate_image',
            '{}',
            JSON.stringify({
              status: 'success',
              files: ['https://cdn.example.com/orphan.png'],
            })
          ),
        ],
        metadata: assistantAudit,
      },
    ];

    expect(
      collectAllowedMediaAttachments([...associated, ...brokenAssociation])
    ).toEqual([]);
  });
});

describe('completeInterruptedMediaCalls', () => {
  it.each(['generate_image', 'generate_video', 'animate_image'])(
    'terminates an unfinished %s call when no task is active',
    (name) => {
      const [part] = completeInterruptedMediaCalls(
        [call('c1', name, '{}')],
        false
      );

      expect(part).toMatchObject({
        type: 'tool_call',
        name,
      });
      expect(
        JSON.parse(
          (part as Extract<StoredPart, { type: 'tool_call' }>).result ?? '{}'
        )
      ).toMatchObject({ status: 'interrupted' });
    }
  );

  it('preserves unfinished calls while a durable task is active', () => {
    const parts = [call('c1', 'generate_image', '{}')];
    expect(completeInterruptedMediaCalls(parts, true)).toBe(parts);
  });

  it('terminates unknown legacy calls instead of leaving a spinner dangling', () => {
    const parts = [call('c1', 'future_tool', '{}')];
    const [completed] = completeInterruptedMediaCalls(parts, false);
    expect(completed).toMatchObject({
      type: 'tool_call',
      name: 'future_tool',
      result: expect.stringContaining('"status":"interrupted"'),
    });
  });
});
