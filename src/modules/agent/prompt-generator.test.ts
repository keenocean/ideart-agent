import { beforeEach, describe, expect, it, vi } from 'vitest';

import { DEFAULT_AGENT_SYSTEM_PROMPT } from '@/config/agent';

import {
  AgentPromptGenerationError,
  generateAgentSystemPrompt,
  generatedPromptValidationErrors,
  measureAgentPrompt,
} from './prompt-generator';

const mocks = vi.hoisted(() => ({
  createMessage: vi.fn(),
  createProvider: vi.fn(),
  getAllConfigs: vi.fn(async () => ({ agent_model: 'model-1' })),
  resolveLlm: vi.fn(),
}));

vi.mock('@keenocean/open-agent-sdk', () => ({
  createProvider: mocks.createProvider,
}));

vi.mock('@/modules/config/service', () => ({
  getAllConfigs: mocks.getAllConfigs,
}));

vi.mock('./service', () => ({
  resolveLlm: mocks.resolveLlm,
}));

const input = {
  targetRole: 'Commercial video director',
  primaryObjective: 'Turn product ideas into production-ready creative.',
  targetAudience: 'Ecommerce teams',
};

function llmResponse(text: string, stopReason = 'end_turn') {
  return {
    content: [{ type: 'text' as const, text }],
    stopReason,
    usage: { input_tokens: 100, output_tokens: 500 },
  };
}

describe('Agent Prompt generation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.createProvider.mockReturnValue({
      apiType: 'openai-completions',
      createMessage: mocks.createMessage,
    });
    mocks.resolveLlm.mockReturnValue({
      provider: 'openai',
      apiKey: 'test-key',
      apiType: 'openai-completions',
      model: 'model-1',
    });
  });

  it('measures and accepts the upstream Prompt as the structural baseline', () => {
    expect(measureAgentPrompt(DEFAULT_AGENT_SYSTEM_PROMPT)).toMatchObject({
      words: 547,
      characters: 3456,
      lines: 20,
      bullets: 17,
    });
    expect(
      generatedPromptValidationErrors(DEFAULT_AGENT_SYSTEM_PROMPT)
    ).toEqual([]);
  });

  it('uses the saved LLM and returns a structurally valid candidate', async () => {
    mocks.createMessage.mockResolvedValue(
      llmResponse(DEFAULT_AGENT_SYSTEM_PROMPT)
    );

    const result = await generateAgentSystemPrompt(input);

    expect(result.prompt).toBe(DEFAULT_AGENT_SYSTEM_PROMPT);
    expect(result.metrics).toEqual(result.sourceMetrics);
    expect(mocks.createProvider).toHaveBeenCalledWith('openai-completions', {
      apiKey: 'test-key',
      baseURL: undefined,
    });
    expect(mocks.createMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        model: 'model-1',
        maxTokens: 1800,
        system: expect.stringContaining('exactly 17 single-line rules'),
        messages: [
          expect.objectContaining({
            role: 'user',
            content: expect.stringContaining('Commercial video director'),
          }),
        ],
      })
    );
  });

  it('gives the model one repair attempt with deterministic feedback', async () => {
    mocks.createMessage
      .mockResolvedValueOnce(llmResponse('Too short'))
      .mockResolvedValueOnce(llmResponse(DEFAULT_AGENT_SYSTEM_PROMPT));

    await expect(generateAgentSystemPrompt(input)).resolves.toMatchObject({
      prompt: DEFAULT_AGENT_SYSTEM_PROMPT,
    });
    expect(mocks.createMessage).toHaveBeenCalledTimes(2);
    const repairMessage = mocks.createMessage.mock.calls[1][0].messages[0]
      .content as string;
    expect(repairMessage).toContain('<validation_errors>');
    expect(repairMessage).toContain('Word count must be');
    expect(repairMessage).toContain('<previous_candidate>\nToo short');
  });

  it('fails without calling a provider when chat credentials are missing', async () => {
    mocks.resolveLlm.mockReturnValue(null);

    await expect(generateAgentSystemPrompt(input)).rejects.toMatchObject({
      name: 'AgentPromptGenerationError',
      status: 400,
    } satisfies Partial<AgentPromptGenerationError>);
    expect(mocks.createProvider).not.toHaveBeenCalled();
  });

  it('does not expose provider error details to the caller', async () => {
    mocks.createMessage.mockRejectedValue(
      new Error('upstream body containing private diagnostics')
    );

    await expect(generateAgentSystemPrompt(input)).rejects.toMatchObject({
      name: 'AgentPromptGenerationError',
      status: 502,
      message:
        'Prompt generation failed. Check the saved provider credentials and model, then try again.',
    });
  });
});
