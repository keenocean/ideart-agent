import { describe, expect, it } from 'vitest';

import { buildAgentSystemPrompt, withGenerationSettings } from './service';

describe('agent generation instructions', () => {
  it('requires an explicit image request and forbids same-turn retries', () => {
    const prompt = buildAgentSystemPrompt({ mediaMode: 'image' });

    expect(prompt).toContain(
      'Only call generate_image when the user explicitly requests an image result.'
    );
    expect(prompt).toContain(
      'If a generation tool returns an error, do not retry it in the same turn.'
    );
    expect(prompt).toContain(
      'Selecting Image mode alone is not a request to generate.'
    );
    expect(prompt).not.toContain('Always generate or edit one still image');
  });

  it('does not turn Image mode settings into a generation command', () => {
    const message = withGenerationSettings('How do I create an image?', {
      mediaMode: 'image',
      imageModelName: 'gpt-image-2',
      imageAspectRatio: '1:1',
      imageResolution: '1K',
      imageQuality: 'medium',
      imageCreditCost: 48,
    });

    expect(message).toContain(
      'If the user explicitly requests an image result, call generate_image; otherwise answer without calling a tool.'
    );
    expect(message).not.toContain('You must call generate_image');
  });
});
