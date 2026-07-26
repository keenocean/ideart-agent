import { creditsForModelOption } from '@/lib/agent-settings';

/**
 * Whether a turn can go ahead, and what to say when it can't.
 *
 * Kept apart from the route so the rule can be exercised directly: the tool
 * call refuses on its own, but only after a full LLM turn has been paid for
 * and the user has watched the agent promise an image it cannot deliver.
 */
export interface CreditVerdict {
  allowed: boolean;
  required: number;
  balance: number;
}

export function checkCredits(params: {
  modelName?: string;
  balance: number;
}): CreditVerdict {
  const required = creditsForModelOption(params.modelName);
  return {
    allowed: params.balance >= required,
    required,
    balance: params.balance,
  };
}

/**
 * The 402 body. `subscribed` decides which paywall the client shows — someone
 * without a plan needs to subscribe, someone on a plan has simply run dry —
 * and the server answers it because a client-side lookup can be stale at
 * exactly the moment the paywall appears.
 */
export function insufficientCreditsBody(
  verdict: CreditVerdict,
  subscribed: boolean
) {
  return {
    code: 'insufficient_credits' as const,
    message: 'insufficient credits',
    required: verdict.required,
    balance: verdict.balance,
    subscribed,
  };
}
