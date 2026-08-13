import { describe, expect, it } from 'vitest';

import {
  AGENT_MODEL_OPTIONS,
  creditsForGeneration,
  creditsForImageGeneration,
  DEFAULT_IMAGE_MODEL,
} from '@/lib/agent-settings';

import { checkCredits, insufficientCreditsBody } from './paywall';

const priced = AGENT_MODEL_OPTIONS.map((option) => ({
  option,
  cost: creditsForGeneration(option.value, option.defaultDuration),
}));
const cheapest = [...priced].sort((a, b) => a.cost - b.cost)[0];
const imageCost = creditsForImageGeneration(
  DEFAULT_IMAGE_MODEL,
  '1K',
  'medium'
);

describe('checkCredits', () => {
  it('allows a turn when the balance covers the cheapest media operation', () => {
    const verdict = checkCredits({
      modelName: cheapest.option.value,
      duration: cheapest.option.defaultDuration,
      balance: imageCost,
    });
    expect(verdict.allowed).toBe(true);
    expect(verdict.required).toBe(Math.min(cheapest.cost, imageCost));
  });

  it('refuses one credit short', () => {
    const verdict = checkCredits({
      modelName: cheapest.option.value,
      duration: cheapest.option.defaultDuration,
      balance: Math.min(cheapest.cost, imageCost) - 1,
    });
    expect(verdict.allowed).toBe(false);
  });

  it('leaves exact longer-clip billing to the selected tool', () => {
    const kling = AGENT_MODEL_OPTIONS[0];
    const shortCost = creditsForGeneration(kling.value, 5);
    const longCost = creditsForGeneration(kling.value, 10);
    const verdict = checkCredits({
      modelName: kling.value,
      duration: 10,
      balance: imageCost,
    });
    expect(longCost).toBeGreaterThan(shortCost);
    expect(verdict.required).toBe(Math.min(imageCost, longCost));
    expect(verdict.allowed).toBe(true);
  });

  it('requires the exact selected image settings in image mode', () => {
    const required = creditsForImageGeneration(
      DEFAULT_IMAGE_MODEL,
      '4K',
      'high'
    );
    const verdict = checkCredits({
      mediaMode: 'image',
      imageResolution: '4K',
      imageQuality: 'high',
      balance: required - 1,
    });
    expect(verdict).toEqual({
      allowed: false,
      required,
      balance: required - 1,
    });
  });

  it('requires the exact selected clip settings in video mode', () => {
    const option = AGENT_MODEL_OPTIONS[0];
    const required = creditsForGeneration(option.value, 10, '4K');
    const verdict = checkCredits({
      mediaMode: 'video',
      modelName: option.value,
      duration: 10,
      resolution: '4K',
      balance: required - 1,
    });
    expect(verdict).toEqual({
      allowed: false,
      required,
      balance: required - 1,
    });
  });

  it('uses the highest rate for an unrecognised model', () => {
    const required = creditsForGeneration('free-please', 5);
    const verdict = checkCredits({
      modelName: 'free-please',
      duration: 5,
      balance: Math.min(required, imageCost) - 1,
    });
    expect(verdict.required).toBe(Math.min(required, imageCost));
    expect(verdict.allowed).toBe(false);
  });

  it('bills missing model and duration instead of rounding to free', () => {
    expect(checkCredits({ balance: 0 }).required).toBeGreaterThan(0);
    expect(
      checkCredits({ modelName: cheapest.option.value, balance: 0 }).required
    ).toBe(Math.min(cheapest.cost, imageCost));
  });
});

describe('insufficientCreditsBody', () => {
  it('tells the client which paywall to show', () => {
    const verdict = checkCredits({
      modelName: cheapest.option.value,
      duration: cheapest.option.defaultDuration,
      balance: 0,
    });
    expect(insufficientCreditsBody(verdict, true)).toMatchObject({
      code: 'insufficient_credits',
      required: Math.min(cheapest.cost, imageCost),
      balance: 0,
      subscribed: true,
    });
    expect(insufficientCreditsBody(verdict, false).subscribed).toBe(false);
  });
});
