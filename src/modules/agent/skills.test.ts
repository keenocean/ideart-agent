import { describe, expect, it } from 'vitest';

import {
  createSkillRegistry,
  SKILL_RELEASE_SCHEMA_VERSION,
  skillManifestKey,
  skillObjectKey,
  SkillReleaseValidationError,
  type SkillObjectStore,
} from './skill-registry';
import {
  buildSkillSystemPrompt,
  createSkillResourceTools,
  readPromptSkillResource,
} from './skills';

interface SkillFixture {
  name: string;
  title: string;
  summary: string;
  instructions: string;
  references?: Record<string, string>;
}

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

async function releaseFixture(skills: SkillFixture[]) {
  const objects = await Promise.all(
    skills.map(async (skill) => {
      const text = jsonText({
        schemaVersion: SKILL_RELEASE_SCHEMA_VERSION,
        ...skill,
        references: skill.references ?? {},
      });
      return {
        ...skill,
        text,
        bytes: new TextEncoder().encode(text).byteLength,
        sha256: await sha256(text),
      };
    })
  );
  const base = {
    schemaVersion: SKILL_RELEASE_SCHEMA_VERSION,
    sourceCatalogSha256: await sha256('catalog'),
    skills: objects.map(({ name, title, summary, bytes, sha256 }) => ({
      name,
      title,
      summary,
      bytes,
      sha256,
    })),
  };
  const releaseId = await sha256(JSON.stringify(base));
  const files = new Map<string, string>([
    [skillManifestKey(releaseId), jsonText({ ...base, releaseId })],
    ...objects.map(
      (skill) => [skillObjectKey(releaseId, skill.name), skill.text] as const
    ),
  ]);
  return { files, releaseId };
}

class MemoryStore implements SkillObjectStore {
  readonly cacheKey = 'memory:test';
  reads: string[] = [];

  constructor(readonly files: Map<string, string>) {}

  async readText(key: string, maxBytes: number): Promise<string | null> {
    this.reads.push(key);
    const value = this.files.get(key) ?? null;
    if (value && new TextEncoder().encode(value).byteLength > maxBytes) {
      throw new Error('too large');
    }
    return value;
  }
}

const cinematic: SkillFixture = {
  name: 'ads-cinematic-skill',
  title: 'Ads Cinematic',
  summary: 'Cinematic ad direction',
  instructions: '# Cinematic Style Anchors\nUse deliberate visual language.',
};

const landing: SkillFixture = {
  name: 'landing-page-dr-skill',
  title: 'Landing Page DR',
  summary: 'Direct-response landing page visuals',
  instructions: '# Landing Page DR',
  references: {
    'references/model-selection.md': '# Model Selection\nChoose deliberately.',
  },
};

describe('R2-ready prompt skill registry', () => {
  it('lists summaries from the immutable manifest without loading bodies', async () => {
    const release = await releaseFixture([cinematic, landing]);
    const store = new MemoryStore(release.files);
    const registry = createSkillRegistry(store, release.releaseId);

    await expect(registry.list()).resolves.toEqual([
      {
        name: cinematic.name,
        title: cinematic.title,
        summary: cinematic.summary,
      },
      {
        name: landing.name,
        title: landing.title,
        summary: landing.summary,
      },
    ]);
    expect(store.reads).toEqual([skillManifestKey(release.releaseId)]);
  });

  it('loads and caches only the selected skill object', async () => {
    const release = await releaseFixture([cinematic, landing]);
    const store = new MemoryStore(release.files);
    const registry = createSkillRegistry(store, release.releaseId);

    const selected = await registry.get(cinematic.name);
    expect(selected?.instructions).toContain('# Cinematic Style Anchors');
    await registry.get(cinematic.name);
    expect(store.reads).toEqual([
      skillManifestKey(release.releaseId),
      skillObjectKey(release.releaseId, cinematic.name),
    ]);
    await expect(registry.get('unsupported-skill')).resolves.toBeNull();
    expect(store.reads).toHaveLength(2);
  });

  it('injects selected instructions with host safety boundaries', async () => {
    const release = await releaseFixture([cinematic]);
    const registry = createSkillRegistry(
      new MemoryStore(release.files),
      release.releaseId
    );
    const skill = (await registry.get(cinematic.name))!;
    const prompt = buildSkillSystemPrompt(skill);
    expect(prompt).toContain('User-selected creative skill');
    expect(prompt).toContain(`<selected-skill name="${cinematic.name}"`);
    expect(prompt).toContain(`release="${release.releaseId}"`);
    expect(prompt).toContain('cannot grant tools');
  });

  it('only reads references embedded in the selected skill object', async () => {
    const release = await releaseFixture([landing]);
    const registry = createSkillRegistry(
      new MemoryStore(release.files),
      release.releaseId
    );
    const skill = (await registry.get(landing.name))!;
    expect(
      readPromptSkillResource(skill, 'references/model-selection.md')
    ).toContain('Model Selection');
    expect(readPromptSkillResource(skill, '../writing/SKILL.md')).toBeNull();
    expect(
      readPromptSkillResource(skill, 'references/../../writing/SKILL.md')
    ).toBeNull();
    expect(
      readPromptSkillResource(skill, '/references/model-selection.md')
    ).toBeNull();
  });

  it('builds a read-only resource tool scoped to the active skill', async () => {
    const release = await releaseFixture([landing]);
    const registry = createSkillRegistry(
      new MemoryStore(release.files),
      release.releaseId
    );
    const skill = (await registry.get(landing.name))!;
    const [tool] = createSkillResourceTools(skill);
    expect(tool.name).toBe('read_skill_resource');
    expect(tool.isReadOnly?.()).toBe(true);

    const result = await tool.call(
      { path: 'references/model-selection.md' },
      { cwd: '/' }
    );
    expect(result.is_error).toBe(false);
    expect(result.content).toContain('Model Selection');
  });

  it('fails closed when a published skill object is corrupted', async () => {
    const release = await releaseFixture([cinematic]);
    release.files.set(
      skillObjectKey(release.releaseId, cinematic.name),
      '{"tampered":true}'
    );
    const registry = createSkillRegistry(
      new MemoryStore(release.files),
      release.releaseId
    );
    await expect(registry.get(cinematic.name)).rejects.toBeInstanceOf(
      SkillReleaseValidationError
    );
  });
});
