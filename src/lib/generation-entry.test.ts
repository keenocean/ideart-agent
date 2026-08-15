import { describe, expect, it } from 'vitest';

import { defaultComposerSettings } from './agent-settings';
import {
  applyGenerationPreset,
  generationEntrySource,
  normalizeGenerationEntryContext,
  validateGenerationAttachments,
  type GenerationPreset,
} from './generation-entry';

describe('generation entry presets', () => {
  it('keeps valid persisted choices when a page only supplies defaults', () => {
    const preset: GenerationPreset = {
      target: { mediaMode: 'video', modelKey: 'minimax-h3' },
      settings: { duration: 10 },
    };
    const persisted = {
      ...defaultComposerSettings(),
      mediaMode: 'image' as const,
      imageQuality: 'high',
    };

    const applied = applyGenerationPreset(persisted, preset);
    expect(applied.settings.mediaMode).toBe('image');
    expect(applied.settings.imageQuality).toBe('high');
    expect(applied.sources.mediaMode).toBe('persisted');
  });

  it('applies modality-safe page locks after persisted settings', () => {
    const imagePreset: GenerationPreset = {
      target: { mediaMode: 'image', modelKey: 'gpt-image-2' },
      locks: { mediaMode: true, model: true },
    };
    const image = applyGenerationPreset(
      { ...defaultComposerSettings(), mediaMode: 'video' },
      imagePreset
    );
    expect(image.settings.mediaMode).toBe('image');
    expect(image.settings.imageModelOption).toBe('gpt-image-2');
    expect(image.sources.mediaMode).toBe('page-lock');
    expect(image.sources.imageModelOption).toBe('page-lock');

    const videoPreset: GenerationPreset = {
      target: { mediaMode: 'video', modelKey: 'seedance-2-0' },
      locks: { mediaMode: true, model: true },
    };
    const video = applyGenerationPreset(defaultComposerSettings(), videoPreset);
    expect(video.settings.mediaMode).toBe('video');
    expect(video.settings.modelOption).toBe('seedance-2-0');
    expect(video.settings.resolution).toBe('720p');
  });

  it('does not let invalid persisted fields suppress page defaults', () => {
    const applied = applyGenerationPreset(
      {
        ...defaultComposerSettings(),
        duration: 999,
        imageQuality: 'ultra',
      },
      {
        target: { mediaMode: 'video', modelKey: 'minimax-h3' },
        settings: { duration: 10, imageQuality: 'high' },
      }
    );
    expect(applied.settings.duration).toBe(10);
    expect(applied.settings.imageQuality).toBe('high');
    expect(applied.sources.duration).toBe('page-default');
  });
});

describe('generation entry context', () => {
  it('accepts only stable home or catalog identity fields', () => {
    expect(normalizeGenerationEntryContext({ kind: 'home' })).toEqual({
      kind: 'home',
    });
    expect(
      normalizeGenerationEntryContext({
        kind: 'model',
        entityId: 'gpt-image-2',
        locale: 'zh',
      })
    ).toEqual({ kind: 'model', entityId: 'gpt-image-2', locale: 'zh' });
    expect(
      normalizeGenerationEntryContext({
        kind: 'tool',
        entityId: '',
        locale: 'en',
      })
    ).toBeNull();
    expect(normalizeGenerationEntryContext({ kind: 'campaign' })).toBeNull();
  });

  it('derives source tracking from the stable identity', () => {
    expect(generationEntrySource({ kind: 'home' })).toBe('home');
    expect(
      generationEntrySource({
        kind: 'tool',
        entityId: 'image-to-video',
        locale: 'en',
      })
    ).toBe('tool:image-to-video');
  });
});

describe('generation attachment policy', () => {
  it('enforces accepted media and minimum/maximum without widening limits', () => {
    const policy = {
      minimum: 1,
      maximum: 2,
      accepts: ['image'] as const,
    };
    expect(validateGenerationAttachments([], policy)).toMatch(/at least 1/);
    expect(
      validateGenerationAttachments(
        [{ mediaType: 'video', url: 'https://cdn.example.com/a.mp4' }],
        policy
      )
    ).toMatch(/does not accept video/);
    expect(
      validateGenerationAttachments(
        [
          { mediaType: 'image', url: 'https://cdn.example.com/a.png' },
          { mediaType: 'image', url: 'https://cdn.example.com/b.png' },
          { mediaType: 'image', url: 'https://cdn.example.com/c.png' },
        ],
        policy
      )
    ).toMatch(/at most 2/);
    expect(
      validateGenerationAttachments(
        [{ mediaType: 'image', url: 'https://cdn.example.com/a.png' }],
        policy
      )
    ).toBeNull();
  });
});
