import { describe, expect, it } from 'vitest';

import {
  AGENT_IMAGE_MODEL_OPTIONS,
  AGENT_MODEL_OPTIONS,
  aspectRatiosForModel,
  creditsForGeneration,
  creditsForImageGeneration,
  DEFAULT_IMAGE_MODEL,
  defaultComposerSettings,
  durationsForModel,
  imageProviderModelFor,
  labelForGeneratedModel,
  normalizeClientGenerationSettings,
  normalizeImageAspectRatio,
  normalizeImageQuality,
  normalizeImageResolution,
  providerModelFor,
  resolutionsForModel,
  resolveGenerationSettings,
  settingsForModel,
  VIDEO_GENERATION_KINDS,
  videoModelAttachmentPolicy,
  videoOperationAttachmentPolicy,
  videoOperationInputLimits,
  videoOperationSupported,
} from './agent-settings';

function expectedCredits(rate: number, seconds: number, multiplier = 1) {
  return Math.ceil((rate * seconds * multiplier) / 10) * 10;
}

describe('creditsForGeneration', () => {
  it('prices every model from its lite rate and default settings', () => {
    for (const option of AGENT_MODEL_OPTIONS) {
      expect(
        creditsForGeneration(
          option.value,
          option.defaultDuration,
          option.defaultResolution
        )
      ).toBe(expectedCredits(option.creditsPerSecond, option.defaultDuration));
    }
  });

  it('charges more for a longer clip', () => {
    for (const option of AGENT_MODEL_OPTIONS) {
      expect(
        creditsForGeneration(
          option.value,
          option.durationMax,
          option.defaultResolution
        )
      ).toBeGreaterThan(
        creditsForGeneration(
          option.value,
          option.durationMin,
          option.defaultResolution
        )
      );
    }
  });

  it('uses the catalog resolution multipliers', () => {
    expect(creditsForGeneration('minimax-h3', 5, '768P')).toBe(
      expectedCredits(110, 5, 0.75)
    );
    expect(creditsForGeneration('minimax-h3', 5, '2K')).toBe(
      expectedCredits(110, 5)
    );
    expect(creditsForGeneration('minimax-h3', 5, '4K')).toBe(
      expectedCredits(110, 5, 1.5)
    );
    expect(creditsForGeneration('seedance-2-0', 5, '480p')).toBe(460);
    expect(creditsForGeneration('seedance-2-0', 5, '720p')).toBe(1000);
    expect(creditsForGeneration('seedance-2-0', 5, '1080p')).toBe(2480);
  });

  it('clamps duration to the selected model range', () => {
    expect(creditsForGeneration('minimax-h3', 1, '2K')).toBe(
      creditsForGeneration('minimax-h3', 5, '2K')
    );
    expect(creditsForGeneration('minimax-h3', 99, '2K')).toBe(
      creditsForGeneration('minimax-h3', 15, '2K')
    );
  });

  it('uses the highest rate for an unknown key', () => {
    const rate = Math.max(
      ...AGENT_MODEL_OPTIONS.map((option) => option.creditsPerSecond)
    );
    const expected = expectedCredits(rate, 5);
    expect(creditsForGeneration('not-a-model', 5)).toBe(expected);
    expect(creditsForGeneration(undefined, 5)).toBe(expected);
    expect(creditsForGeneration('', 5)).toBe(expected);
  });
});

describe('image generation catalog', () => {
  it('exposes GPT Image 2 under exact provider ids', () => {
    expect(AGENT_IMAGE_MODEL_OPTIONS.map((option) => option.label)).toEqual([
      'GPT Image 2',
    ]);
    expect(
      imageProviderModelFor(DEFAULT_IMAGE_MODEL, 'evolink', 'generate')
    ).toBe('gpt-image-2');
    expect(imageProviderModelFor(DEFAULT_IMAGE_MODEL, 'fal', 'edit')).toBe(
      'openai/gpt-image-2/edit'
    );
    expect(
      imageProviderModelFor(DEFAULT_IMAGE_MODEL, 'replicate', 'generate')
    ).toBe('openai/gpt-image-2');
  });

  it('uses the EvoLink resolution and quality rate card', () => {
    const expected = {
      '1K': { low: 6, medium: 48, high: 190 },
      '2K': { low: 11, medium: 97, high: 386 },
      '4K': { low: 18, medium: 161, high: 641 },
    } as const;
    for (const [resolution, qualities] of Object.entries(expected)) {
      for (const [quality, credits] of Object.entries(qualities)) {
        expect(
          creditsForImageGeneration(DEFAULT_IMAGE_MODEL, resolution, quality)
        ).toBe(credits);
      }
    }
  });

  it('normalizes image options to safe defaults', () => {
    expect(normalizeImageAspectRatio('16:9')).toBe('16:9');
    expect(normalizeImageAspectRatio('invalid')).toBe('1:1');
    expect(normalizeImageResolution('2k')).toBe('2K');
    expect(normalizeImageResolution('8K')).toBe('1K');
    expect(normalizeImageQuality('HIGH')).toBe('high');
    expect(normalizeImageQuality('ultra')).toBe('medium');
  });

  it('fails expensive for an unknown image model', () => {
    expect(creditsForImageGeneration('unknown', '1K', 'low')).toBe(641);
  });
});

describe('composer model capabilities', () => {
  it('lists the current media catalog in order', () => {
    expect(AGENT_MODEL_OPTIONS.map((option) => option.label)).toEqual([
      'MiniMax H3',
      'Seedance 2.5',
      'Seedance 2.0',
    ]);
  });

  it('starts with the video-lite defaults', () => {
    expect(defaultComposerSettings()).toEqual({
      mediaMode: 'auto',
      modelOption: 'minimax-h3',
      imageModelOption: 'gpt-image-2',
      duration: 5,
      resolution: '2K',
      aspectRatio: 'adaptive',
      imageAspectRatio: '1:1',
      imageResolution: '1K',
      imageQuality: 'medium',
    });
  });

  it('exposes model-specific settings', () => {
    expect(durationsForModel('minimax-h3')).toEqual([
      5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15,
    ]);
    expect(durationsForModel('seedance-2-5')).toHaveLength(27);
    expect(durationsForModel('seedance-2-0')).toEqual([
      4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15,
    ]);
    expect(resolutionsForModel('minimax-h3')).toEqual(['768P', '2K', '4K']);
    expect(resolutionsForModel('seedance-2-5')).toEqual(['480p', '720p']);
    expect(resolutionsForModel('seedance-2-0')).toEqual([
      '480p',
      '720p',
      '1080p',
    ]);
    expect(aspectRatiosForModel('minimax-h3')).toContain('adaptive');
    expect(aspectRatiosForModel('seedance-2-5')).toContain('auto');
    expect(aspectRatiosForModel('seedance-2-0')).toContain('adaptive');
  });

  it('resets incompatible values when the model changes', () => {
    expect(
      settingsForModel(
        {
          ...defaultComposerSettings(),
          modelOption: 'seedance-2-5',
          duration: 30,
          resolution: '720p',
          aspectRatio: 'auto',
        },
        'minimax-h3'
      )
    ).toEqual({
      ...defaultComposerSettings(),
      modelOption: 'minimax-h3',
      duration: 5,
      resolution: '2K',
      aspectRatio: 'adaptive',
    });
  });
});

describe('resolveGenerationSettings', () => {
  it('sends the picker key and explicit lite defaults', () => {
    expect(resolveGenerationSettings(defaultComposerSettings())).toEqual({
      mediaMode: 'auto',
      modelName: 'minimax-h3',
      aspectRatio: 'adaptive',
      resolution: '2K',
      duration: 5,
      creditCost: creditsForGeneration('minimax-h3', 5, '2K'),
      imageModelName: 'gpt-image-2',
      imageAspectRatio: '1:1',
      imageResolution: '1K',
      imageQuality: 'medium',
      imageCreditCost: creditsForImageGeneration(
        DEFAULT_IMAGE_MODEL,
        '1K',
        'medium'
      ),
    });
  });

  it('passes supported explicit settings through', () => {
    const settings = resolveGenerationSettings({
      ...defaultComposerSettings(),
      mediaMode: 'video',
      modelOption: 'seedance-2-5',
      aspectRatio: '16:9',
      resolution: '480p',
      duration: 8,
    });
    expect(settings).toEqual({
      mediaMode: 'video',
      modelName: 'seedance-2-5',
      aspectRatio: '16:9',
      resolution: '480p',
      duration: 8,
      creditCost: creditsForGeneration('seedance-2-5', 8, '480p'),
      imageModelName: 'gpt-image-2',
      imageAspectRatio: '1:1',
      imageResolution: '1K',
      imageQuality: 'medium',
      imageCreditCost: creditsForImageGeneration(
        DEFAULT_IMAGE_MODEL,
        '1K',
        'medium'
      ),
    });
  });

  it('carries the selected image picker key through composer and API normalization', () => {
    const composer = {
      ...defaultComposerSettings(),
      mediaMode: 'image' as const,
      imageModelOption: 'gpt-image-2' as const,
    };

    expect(resolveGenerationSettings(composer).imageModelName).toBe(
      'gpt-image-2'
    );
    expect(
      normalizeClientGenerationSettings({
        ...resolveGenerationSettings(composer),
        imageModelName: 'gpt-image-2',
      })?.imageModelName
    ).toBe('gpt-image-2');
    expect(
      normalizeClientGenerationSettings({
        mediaMode: 'image',
        imageModelName: 'retired-image-model' as 'gpt-image-2',
      })
    ).toBeNull();
  });

  it('does not trust client pricing or unsupported values', () => {
    expect(
      normalizeClientGenerationSettings({
        mediaMode: 'image',
        modelName: 'seedance-2-5',
        duration: 99,
        resolution: '4K',
        aspectRatio: 'adaptive',
        creditCost: 0,
        imageResolution: '4k',
        imageQuality: 'HIGH',
        imageCreditCost: 0,
      })
    ).toEqual({
      mediaMode: 'image',
      modelName: 'seedance-2-5',
      duration: 30,
      aspectRatio: 'auto',
      resolution: '720p',
      creditCost: creditsForGeneration('seedance-2-5', 30, '720p'),
      imageModelName: 'gpt-image-2',
      imageAspectRatio: '1:1',
      imageResolution: '4K',
      imageQuality: 'high',
      imageCreditCost: creditsForImageGeneration(
        DEFAULT_IMAGE_MODEL,
        '4K',
        'high'
      ),
    });
    expect(
      normalizeClientGenerationSettings({ modelName: 'free-video' })
    ).toBeNull();
    expect(
      normalizeClientGenerationSettings({
        mediaMode: 'audio' as 'auto',
      })
    ).toBeNull();
  });
});

describe('providerModelFor', () => {
  it('matches the current provider routes', () => {
    expect(providerModelFor('minimax-h3', 'grouter', 'generate', '2K')).toBe(
      'minimax-h3'
    );
    expect(providerModelFor('seedance-2-5', 'fal', 'animate', '720p')).toBe(
      'bytedance/seedance-2.5/image-to-video'
    );
    expect(providerModelFor('minimax-h3', 'fal', 'generate', '768P')).toBe(
      'fal-ai/minimax/hailuo-2.3/standard/text-to-video'
    );
    expect(providerModelFor('minimax-h3', 'fal', 'animate', '4K')).toBe(
      'fal-ai/minimax/hailuo-2.3/pro/image-to-video'
    );
    expect(
      providerModelFor('seedance-2-0', 'evolink', 'generate', '720p')
    ).toBe('seedance-2.0-text-to-video');
    expect(providerModelFor('seedance-2-0', 'evolink', 'animate', '720p')).toBe(
      'seedance-2.0-image-to-video'
    );
    expect(
      providerModelFor('seedance-2-5', 'evolink', 'generate', '720p')
    ).toBe('seedance-2.5-text-to-video');
    expect(providerModelFor('seedance-2-5', 'evolink', 'animate', '720p')).toBe(
      'seedance-2.5-image-to-video'
    );
    expect(
      providerModelFor('seedance-2-5', 'evolink', 'reference', '720p')
    ).toBe('seedance-2.5-reference-to-video');
    expect(providerModelFor('seedance-2-5', 'evolink', 'edit', '720p')).toBe(
      'seedance-2.5-video-edit'
    );
    expect(providerModelFor('seedance-2-5', 'evolink', 'extend', '720p')).toBe(
      'seedance-2.5-video-extend'
    );
    expect(
      providerModelFor('seedance-2-0', 'evolink', 'reference', '720p')
    ).toBe('seedance-2.0-reference-to-video');
  });

  it('does not downgrade Seedance on Replicate', () => {
    expect(
      providerModelFor('seedance-2-5', 'replicate', 'generate', '720p')
    ).toBeUndefined();
  });

  it('returns nothing for a model it cannot map', () => {
    expect(providerModelFor('not-a-model', 'fal', 'generate')).toBeUndefined();
    expect(providerModelFor(undefined, 'fal', 'generate')).toBeUndefined();
  });
});

describe('labelForGeneratedModel', () => {
  it('names picker and provider ids', () => {
    for (const option of AGENT_MODEL_OPTIONS) {
      expect(labelForGeneratedModel(option.value)).toBe(option.label);
      for (const provider of [
        'evolink',
        'grouter',
        'fal',
        'replicate',
      ] as const) {
        for (const operation of VIDEO_GENERATION_KINDS) {
          for (const resolution of option.resolutions) {
            const providerModelId = providerModelFor(
              option.value,
              provider,
              operation,
              resolution
            );
            if (providerModelId) {
              expect(labelForGeneratedModel(providerModelId)).toBe(
                option.label
              );
            }
          }
        }
      }
    }
    expect(
      labelForGeneratedModel('fal-ai/minimax/hailuo-2.3/pro/image-to-video')
    ).toBe('MiniMax H3');
    expect(labelForGeneratedModel('gpt-image-2')).toBe('GPT Image 2');
    expect(labelForGeneratedModel('openai/gpt-image-2/edit')).toBe(
      'GPT Image 2'
    );
  });

  it('shows the raw id for a model no longer sold', () => {
    expect(labelForGeneratedModel('retired/video-model')).toBe(
      'retired/video-model'
    );
  });
});

describe('video operation capabilities', () => {
  it('exposes only routes implemented by the selected model', () => {
    expect(videoOperationSupported('minimax-h3', 'reference')).toBe(false);
    expect(videoOperationSupported('seedance-2-0', 'reference')).toBe(true);
    expect(videoOperationSupported('seedance-2-0', 'edit')).toBe(false);
    expect(videoOperationSupported('seedance-2-5', 'edit')).toBe(true);
    expect(videoOperationSupported('seedance-2-5', 'extend')).toBe(true);
  });

  it('keeps operation-specific source limits separate from the composer union', () => {
    expect(videoOperationInputLimits('seedance-2-5', 'reference')).toEqual({
      minimum: 1,
      maximum: 50,
      accepts: ['image', 'video', 'audio'],
      maximumByType: { image: 30, video: 10, audio: 10 },
    });
    expect(videoOperationInputLimits('seedance-2-5', 'edit')).toEqual({
      minimum: 1,
      maximum: 1,
      accepts: ['video'],
      maximumByType: { video: 1 },
    });
    expect(videoModelAttachmentPolicy('seedance-2-5')).toEqual({
      minimum: 0,
      maximum: 50,
      accepts: ['image', 'video', 'audio'],
    });
    expect(videoOperationAttachmentPolicy('animate')).toMatchObject({
      minimum: 1,
      maximum: 2,
      accepts: ['image'],
      maximumByType: { image: 2 },
    });
    expect(videoOperationAttachmentPolicy('reference')).toMatchObject({
      minimum: 1,
      maximum: 50,
      accepts: ['image', 'video', 'audio'],
      maximumByType: { image: 30, video: 10, audio: 10 },
    });
  });
});
