import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

import { DEFAULT_AGENT_SYSTEM_PROMPT, getAgentDefinition } from '../agent';
import { parseProductAgent, productAgent, productAgentSchema } from './agent';
import {
  parseProductBrand,
  productBrand,
  productBrandSchema,
  resolveProductBrandEnv,
} from './brand';

describe('product pack identity', () => {
  it('loads the checked-in brand and agent through strict versioned schemas', () => {
    expect(productBrandSchema.parse(productBrand)).toEqual(productBrand);
    expect(productAgentSchema.parse(productAgent)).toEqual(productAgent);
    expect(productBrand.schemaVersion).toBe(1);
    expect(productAgent.schemaVersion).toBe(1);
    expect(DEFAULT_AGENT_SYSTEM_PROMPT).toBe(productAgent.defaultSystemPrompt);
    expect(getAgentDefinition()).toEqual({
      id: productAgent.id,
      name: productAgent.name,
      defaultSystemPrompt: productAgent.defaultSystemPrompt,
      maxTurns: productAgent.maxTurns,
    });
  });

  it('rejects unknown, unsafe, and malformed product values with file context', () => {
    expect(() =>
      parseProductBrand({ ...productBrand, unexpected: true })
    ).toThrow(/Invalid product\/brand\.json.*Unrecognized key/);
    expect(() =>
      parseProductBrand({ ...productBrand, logo: 'http://x' })
    ).toThrow(/root-relative path or an HTTPS URL/);
    expect(() => parseProductAgent({ ...productAgent, maxTurns: 0 })).toThrow(
      /Invalid product\/agent\.json.*maxTurns:.*>=1/
    );
    expect(() =>
      parseProductAgent({ ...productAgent, defaultSystemPrompt: '   ' })
    ).toThrow(/Invalid product\/agent\.json/);
  });

  it('uses product defaults while preserving VITE brand overrides', () => {
    expect(resolveProductBrandEnv(() => undefined)).toEqual({
      name: productBrand.name,
      description: productBrand.description,
      logo: productBrand.logo,
    });

    const overrides: Record<string, string> = {
      VITE_APP_NAME: 'Acme Agent',
      VITE_APP_DESCRIPTION: 'Acme product description',
      VITE_APP_LOGO: 'https://cdn.example.test/logo.svg',
    };
    expect(resolveProductBrandEnv((key) => overrides[key])).toEqual({
      name: 'Acme Agent',
      description: 'Acme product description',
      logo: 'https://cdn.example.test/logo.svg',
    });
  });

  it('keeps tracked templates free of source-product deployment identity', () => {
    const trackedTemplates = [
      '../../../package.json',
      '../../../.env.example',
      '../../../wrangler.example.jsonc',
    ]
      .map((path) => readFileSync(new URL(path, import.meta.url), 'utf8'))
      .join('\n');

    expect(trackedTemplates).not.toMatch(/ugcmind|sjun-zhu\.workers\.dev/i);
    expect(trackedTemplates).not.toMatch(/[0-9a-f]{64}/i);
    expect(trackedTemplates).toContain('agent-saas-template');
  });
});
