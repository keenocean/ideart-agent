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

  it('keeps upstream agent workflows aligned with the Product Pack', () => {
    const readProjectFile = (path: string) =>
      readFileSync(new URL(`../../../${path}`, import.meta.url), 'utf8');
    const quickStart = readProjectFile('.claude/skills/quick-start/SKILL.md');
    const newPage = readProjectFile('.claude/skills/new-page/SKILL.md');
    const cloneWebsite = readProjectFile(
      '.claude/skills/clone-website/SKILL.md'
    );
    const marketingAdapter = readProjectFile(
      '.claude/skills/marketing-seo/references/shipany-tanstack.md'
    );
    const syncUpstream = readProjectFile(
      '.claude/skills/sync-upstream/SKILL.md'
    );

    expect(quickStart).toContain('product/brand.json');
    expect(quickStart).toContain('product/home.json');
    expect(quickStart).toContain('product/catalog/');
    expect(quickStart).toContain('product/messages/');
    expect(quickStart).toContain('pnpm product:validate');
    expect(quickStart).toContain('template/main');
    expect(quickStart).not.toMatch(/(?<!product\/)messages\/en\.json/);
    expect(quickStart).not.toContain('shipany-ai/shipany-tanstack');
    expect(quickStart).not.toContain('src/app/globals.css');

    expect(newPage).toContain('product/messages/en.json');
    expect(cloneWebsite).toContain('product/brand.json');
    expect(cloneWebsite).toContain('product/research/');
    expect(marketingAdapter).toContain('product/messages/<locale>.json');
    expect(marketingAdapter).toContain('product/marketing/**');
    expect(syncUpstream).toContain('docs/template-upgrades.md');
    expect(syncUpstream).toContain('template/main');

    const adaptedSkills = [newPage, cloneWebsite, marketingAdapter].join('\n');
    expect(adaptedSkills).not.toMatch(/(?<!product\/)messages\/en\.json/);
    expect(adaptedSkills).not.toContain('messages/marketing');
    expect(syncUpstream).not.toContain('shipany-ai/shipany-next');
  });
});
