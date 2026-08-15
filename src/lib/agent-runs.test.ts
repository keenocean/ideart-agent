import { describe, expect, it } from 'vitest';

import {
  buildAgentChatRequestPayload,
  parseAgentTurnConflict,
} from './agent-runs';

describe('parseAgentTurnConflict', () => {
  it.each(['turn_in_progress', 'stale_run_requires_stop'] as const)(
    'recognizes the 409 machine code %s',
    (code) => {
      expect(parseAgentTurnConflict(409, JSON.stringify({ code }))).toBe(code);
    }
  );

  it('does not treat other statuses, codes, or invalid JSON as a conflict', () => {
    expect(
      parseAgentTurnConflict(400, JSON.stringify({ code: 'turn_in_progress' }))
    ).toBeNull();
    expect(
      parseAgentTurnConflict(409, JSON.stringify({ code: 'other' }))
    ).toBeNull();
    expect(parseAgentTurnConflict(409, 'bad')).toBeNull();
  });
});

describe('buildAgentChatRequestPayload', () => {
  it('sends stable entry identity and structured uploaded attachments', () => {
    expect(
      buildAgentChatRequestPayload({
        sessionId: 's-1234567890-abcd',
        text: 'Animate this',
        attachments: [
          {
            id: 'a',
            name: 'start.png',
            kind: 'image',
            preview: 'https://cdn.example.com/start.png',
            url: 'https://cdn.example.com/start.png',
            status: 'uploaded',
          },
        ],
        settings: { mediaMode: 'video' },
        skillName: 'storyboard',
        entryContext: {
          kind: 'tool',
          entityId: 'image-to-video',
          locale: 'en',
        },
      })
    ).toMatchObject({
      sessionId: 's-1234567890-abcd',
      message:
        'Animate this\n\nAttached media:\n- image 1: https://cdn.example.com/start.png',
      attachments: [
        {
          mediaType: 'image',
          url: 'https://cdn.example.com/start.png',
        },
      ],
      skillName: 'storyboard',
      entryContext: {
        kind: 'tool',
        entityId: 'image-to-video',
        locale: 'en',
      },
    });
  });
});
