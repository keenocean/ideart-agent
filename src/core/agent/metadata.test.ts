import { describe, expect, it } from 'vitest';

import { parseAgentMessageMetadata } from './metadata';

const userMetadata = {
  schemaVersion: 1,
  kind: 'user',
  turnId: 'turn-1',
  agentDefinitionId: 'primary',
  businessPromptHash: 'business-hash',
  effectivePromptHash: 'effective-hash',
  promptSource: 'admin',
  llmProvider: 'openai',
  llmModel: 'model-1',
  skillName: null,
  skillReleaseId: null,
  toolNames: ['generate_image'],
  longRunningToolNames: ['generate_image'],
};

describe('Agent message metadata decoder', () => {
  it('accepts complete user and assistant metadata', () => {
    expect(parseAgentMessageMetadata(userMetadata)).toEqual(userMetadata);
    expect(
      parseAgentMessageMetadata({
        schemaVersion: 1,
        kind: 'assistant',
        turnId: 'turn-1',
        parentUserMessageId: 'message-1',
        roundIndex: 0,
      })
    ).toMatchObject({ kind: 'assistant', turnId: 'turn-1' });
  });

  it.each([
    null,
    [],
    { ...userMetadata, schemaVersion: 2 },
    { ...userMetadata, toolNames: ['generate_image', 'generate_image'] },
    { ...userMetadata, longRunningToolNames: ['not_authorized'] },
    {
      schemaVersion: 1,
      kind: 'assistant',
      turnId: 'turn-1',
      parentUserMessageId: '',
      roundIndex: -1,
    },
  ])('rejects malformed or internally inconsistent metadata', (value) => {
    expect(parseAgentMessageMetadata(value)).toBeNull();
  });
});
