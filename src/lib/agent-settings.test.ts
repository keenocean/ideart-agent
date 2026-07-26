import { describe, expect, it } from 'vitest';

import {
  AGENT_MODEL_OPTIONS,
  creditsForModelOption,
  defaultComposerSettings,
  labelForGeneratedModel,
  providerModelFor,
  resolveGenerationSettings,
} from './agent-settings';

// What an image costs is the one number a user pays for, and the composer
// sends its own copy of it in the request body. These tests pin the rule that
// the server prices from the catalog instead.
describe('creditsForModelOption', () => {
  it('prices each catalogued model', () => {
    for (const option of AGENT_MODEL_OPTIONS) {
      expect(creditsForModelOption(option.value)).toBe(option.credits);
    }
  });

  it('charges the dearest model for an unknown key', () => {
    const dearest = Math.max(...AGENT_MODEL_OPTIONS.map((o) => o.credits));
    // A request naming a model that isn't sold must never come out cheaper
    // than one that is — that would be a free image for anyone who asked.
    expect(creditsForModelOption('not-a-model')).toBe(dearest);
    expect(creditsForModelOption(undefined)).toBe(dearest);
    expect(creditsForModelOption('')).toBe(dearest);
  });

  it('never prices an image at zero', () => {
    for (const option of AGENT_MODEL_OPTIONS) {
      expect(option.credits).toBeGreaterThan(0);
    }
  });
});

describe('defaultComposerSettings', () => {
  it('starts on a model the catalog still sells', () => {
    const { modelOption } = defaultComposerSettings();
    expect(AGENT_MODEL_OPTIONS.map((o) => o.value)).toContain(modelOption);
  });

  it('starts on the cheapest model', () => {
    const cheapest = [...AGENT_MODEL_OPTIONS].sort(
      (a, b) => a.credits - b.credits
    )[0];
    // A new account's grant is finite and the first attempts usually go on
    // getting the prompt right, so the default should be the cheap one.
    expect(defaultComposerSettings().modelOption).toBe(cheapest.value);
  });
});

describe('resolveGenerationSettings', () => {
  it('sends the picker key, not a provider id', () => {
    const settings = resolveGenerationSettings({
      modelOption: 'gpt-image-2',
      aspectRatio: 'auto',
      resolution: 'auto',
    });
    expect(settings.modelName).toBe('gpt-image-2');
    // "auto" means "say nothing", so the provider applies its own default.
    expect(settings.aspectRatio).toBeUndefined();
    expect(settings.resolution).toBeUndefined();
  });

  it('passes explicit aspect ratio and resolution through', () => {
    const settings = resolveGenerationSettings({
      modelOption: 'gpt-image-2',
      aspectRatio: '16:9',
      resolution: '2k',
    });
    expect(settings.aspectRatio).toBe('16:9');
    expect(settings.resolution).toBe('2k');
  });
});

describe('providerModelFor', () => {
  it('maps every catalogued model for every provider', () => {
    for (const option of AGENT_MODEL_OPTIONS) {
      for (const provider of ['fal', 'replicate', 'grouter'] as const) {
        expect(
          providerModelFor(option.value, provider, 'generate')
        ).toBeTruthy();
        expect(providerModelFor(option.value, provider, 'edit')).toBeTruthy();
      }
    }
  });

  it('lets an override win over the built-in id', () => {
    const id = providerModelFor('gpt-image-2', 'grouter', 'generate', {
      'gpt-image-2': 'my-own-route',
    });
    expect(id).toBe('my-own-route');
  });

  it('returns nothing for a model it cannot map', () => {
    expect(providerModelFor('not-a-model', 'fal', 'generate')).toBeUndefined();
    expect(providerModelFor(undefined, 'fal', 'generate')).toBeUndefined();
  });
});

describe('labelForGeneratedModel', () => {
  it('names a model from any provider id it was recorded under', () => {
    for (const option of AGENT_MODEL_OPTIONS) {
      expect(labelForGeneratedModel(option.value)).toBe(option.label);
      for (const ids of Object.values(option.providers)) {
        expect(labelForGeneratedModel(ids.model)).toBe(option.label);
        expect(labelForGeneratedModel(ids.editModel)).toBe(option.label);
      }
    }
  });

  it('shows the raw id for a model no longer sold', () => {
    // Old images outlive the catalog; a blank label would lose the record.
    expect(labelForGeneratedModel('black-forest-labs/flux-schnell')).toBe(
      'black-forest-labs/flux-schnell'
    );
  });
});
