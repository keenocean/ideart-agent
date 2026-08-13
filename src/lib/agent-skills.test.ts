import { describe, expect, it } from 'vitest';

import { normalizeAgentPromptSkills } from './agent-skills';

describe('normalizeAgentPromptSkills', () => {
  it('normalizes skill API rows with stable names', () => {
    expect(
      normalizeAgentPromptSkills([
        { name: 'cinematic', title: 'Cinematic', summary: 'Film look' },
        { name: 'rewrite', title: 'Rewrite' },
        { name: '../bad' },
        { name: 'cinematic', title: 'Duplicate' },
      ])
    ).toEqual([
      { name: 'cinematic', label: 'Cinematic', description: 'Film look' },
      { name: 'rewrite', label: 'Rewrite', description: undefined },
    ]);
  });
});
