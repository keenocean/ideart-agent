import { z } from 'zod';

import agentJson from '../../../product/agent.json';
import { parseProductFile } from './validation';

export const productAgentSchema = z
  .object({
    schemaVersion: z.literal(1),
    id: z
      .string()
      .trim()
      .regex(/^[a-z][a-z0-9-]{0,63}$/),
    name: z.string().trim().min(1).max(80),
    defaultSystemPrompt: z
      .string()
      .trim()
      .min(1)
      .max(64 * 1024),
    maxTurns: z.number().int().min(1).max(100),
  })
  .strict();

export type ProductAgent = z.infer<typeof productAgentSchema>;

export function parseProductAgent(value: unknown): ProductAgent {
  return parseProductFile('product/agent.json', productAgentSchema, value);
}

export const productAgent = Object.freeze(parseProductAgent(agentJson));
