import { describe, expect, it } from 'vitest';

import { AGENT_MODEL_OPTIONS } from '@/lib/agent-settings';

import { checkCredits, insufficientCreditsBody } from './paywall';

const cheapest = [...AGENT_MODEL_OPTIONS].sort(
  (a, b) => a.credits - b.credits
)[0];
const dearest = [...AGENT_MODEL_OPTIONS].sort(
  (a, b) => b.credits - a.credits
)[0];

describe('checkCredits', () => {
  it('allows a turn when the balance covers the model', () => {
    const verdict = checkCredits({
      modelName: cheapest.value,
      balance: cheapest.credits,
    });
    expect(verdict.allowed).toBe(true);
    expect(verdict.required).toBe(cheapest.credits);
  });

  it('refuses one credit short', () => {
    // The boundary is the whole point: off by one here either gives an image
    // away or blocks someone who could pay for it.
    expect(
      checkCredits({ modelName: cheapest.value, balance: cheapest.credits - 1 })
        .allowed
    ).toBe(false);
  });

  it('refuses an empty balance', () => {
    const verdict = checkCredits({ modelName: cheapest.value, balance: 0 });
    expect(verdict.allowed).toBe(false);
    expect(verdict.balance).toBe(0);
  });

  it('prices from the catalog, not from what the caller asked for', () => {
    // The composer sends the model name in a body the user could rewrite, so
    // an unrecognised name must cost the most, never the least.
    const verdict = checkCredits({
      modelName: 'free-please',
      balance: dearest.credits - 1,
    });
    expect(verdict.required).toBe(dearest.credits);
    expect(verdict.allowed).toBe(false);
  });

  it('treats a missing model name the same way', () => {
    expect(checkCredits({ balance: 0 }).required).toBe(dearest.credits);
  });
});

describe('insufficientCreditsBody', () => {
  it('tells the client which paywall to show', () => {
    const verdict = checkCredits({ modelName: dearest.value, balance: 0 });

    const forSubscriber = insufficientCreditsBody(verdict, true);
    expect(forSubscriber).toMatchObject({
      code: 'insufficient_credits',
      required: dearest.credits,
      balance: 0,
      subscribed: true,
    });

    // Someone without a plan is shown plans; someone on one is shown a
    // top-up. The flag is what the client switches on.
    expect(insufficientCreditsBody(verdict, false).subscribed).toBe(false);
  });
});
