import { describe, expect, it } from 'vitest';

import { parseAgentTurnConflict } from './agent-runs';

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
