import { afterEach, describe, expect, it } from 'vitest';

import {
  SKILL_RELEASE_SCHEMA_VERSION,
  skillManifestKey,
  skillObjectKey,
  SkillRegistryUnavailableError,
} from './skill-registry';
import { getDefaultSkillRegistry } from './skill-store';

async function sha256(value: string): Promise<string> {
  const digest = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(value)
  );
  return Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, '0')
  ).join('');
}

function jsonText(value: unknown): string {
  return `${JSON.stringify(value, null, 2)}\n`;
}

async function r2Fixture() {
  const objectText = jsonText({
    schemaVersion: SKILL_RELEASE_SCHEMA_VERSION,
    name: 'cinematic',
    title: 'Cinematic',
    summary: 'Film direction',
    instructions: '# Cinematic',
    references: {},
  });
  const base = {
    schemaVersion: SKILL_RELEASE_SCHEMA_VERSION,
    sourceCatalogSha256: await sha256('catalog'),
    skills: [
      {
        name: 'cinematic',
        title: 'Cinematic',
        summary: 'Film direction',
        bytes: new TextEncoder().encode(objectText).byteLength,
        sha256: await sha256(objectText),
      },
    ],
  };
  const releaseId = await sha256(JSON.stringify(base));
  return {
    releaseId,
    files: new Map([
      [skillManifestKey(releaseId), jsonText({ ...base, releaseId })],
      [skillObjectKey(releaseId, 'cinematic'), objectText],
    ]),
  };
}

function installCloudflareEnv(env: Record<string, unknown>) {
  const runtime = globalThis as typeof globalThis & {
    Cloudflare?: unknown;
    __CF_ENV__?: unknown;
  };
  runtime.Cloudflare = {};
  runtime.__CF_ENV__ = env;
}

afterEach(() => {
  const runtime = globalThis as typeof globalThis & {
    Cloudflare?: unknown;
    __CF_ENV__?: unknown;
  };
  delete runtime.Cloudflare;
  delete runtime.__CF_ENV__;
});

describe('Cloudflare Agent Skill store', () => {
  it('reads the pinned manifest and selected object through the private R2 binding', async () => {
    const fixture = await r2Fixture();
    const reads: string[] = [];
    installCloudflareEnv({
      AGENT_SKILLS_RELEASE: fixture.releaseId,
      AGENT_SKILLS: {
        async get(key: string) {
          reads.push(key);
          const text = fixture.files.get(key);
          return text
            ? {
                size: new TextEncoder().encode(text).byteLength,
                async text() {
                  return text;
                },
              }
            : null;
        },
      },
    });

    const registry = await getDefaultSkillRegistry();
    await expect(registry.list()).resolves.toHaveLength(1);
    await expect(registry.get('cinematic')).resolves.toMatchObject({
      name: 'cinematic',
      releaseId: fixture.releaseId,
    });
    expect(reads).toEqual([
      skillManifestKey(fixture.releaseId),
      skillObjectKey(fixture.releaseId, 'cinematic'),
    ]);
  });

  it('fails closed when a Worker has no private R2 binding', async () => {
    installCloudflareEnv({ AGENT_SKILLS_RELEASE: 'a'.repeat(64) });
    await expect(getDefaultSkillRegistry()).rejects.toBeInstanceOf(
      SkillRegistryUnavailableError
    );
  });

  it('classifies R2 read failures as registry unavailability', async () => {
    installCloudflareEnv({
      AGENT_SKILLS_RELEASE: 'b'.repeat(64),
      AGENT_SKILLS: {
        async get() {
          throw new Error('temporary R2 failure');
        },
      },
    });
    const registry = await getDefaultSkillRegistry();
    await expect(registry.list()).rejects.toBeInstanceOf(
      SkillRegistryUnavailableError
    );
  });
});
