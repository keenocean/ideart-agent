export const SKILL_RELEASE_SCHEMA_VERSION = 1;
export const SKILL_RELEASE_PREFIX = 'agent-skills/releases';

export const MAX_SKILL_MANIFEST_BYTES = 512 * 1024;
export const MAX_SKILL_OBJECT_BYTES = 512 * 1024;

const RELEASE_ID_PATTERN = /^[a-f0-9]{64}$/;
const SKILL_NAME_PATTERN = /^[a-z0-9][a-z0-9-]{0,127}$/;
const RESOURCE_PATH_PATTERN = /^[a-zA-Z0-9._/-]+$/;

export interface PromptSkillSummary {
  name: string;
  title: string;
  summary: string;
}

export interface PromptSkill extends PromptSkillSummary {
  instructions: string;
  references: Readonly<Record<string, string>>;
  releaseId: string;
}

export interface SkillReleaseManifestEntry extends PromptSkillSummary {
  bytes: number;
  sha256: string;
}

export interface SkillReleaseManifest {
  schemaVersion: typeof SKILL_RELEASE_SCHEMA_VERSION;
  releaseId: string;
  sourceCatalogSha256: string;
  skills: SkillReleaseManifestEntry[];
}

interface SkillReleaseObject extends PromptSkillSummary {
  schemaVersion: typeof SKILL_RELEASE_SCHEMA_VERSION;
  instructions: string;
  references: Record<string, string>;
}

export interface SkillObjectStore {
  readonly cacheKey: string;
  readText(key: string, maxBytes: number): Promise<string | null>;
}

export class SkillRegistryUnavailableError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = 'SkillRegistryUnavailableError';
  }
}

export class SkillReleaseValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SkillReleaseValidationError';
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function utf8Bytes(value: string): number {
  return new TextEncoder().encode(value).byteLength;
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

function isSha256(value: unknown): value is string {
  return typeof value === 'string' && RELEASE_ID_PATTERN.test(value);
}

export function isSkillName(value: unknown): value is string {
  return typeof value === 'string' && SKILL_NAME_PATTERN.test(value);
}

export function normalizeSkillResourcePath(
  requestedPath: string
): string | null {
  const path = requestedPath.trim().replace(/^\.\//, '');
  const parts = path.split('/');
  if (
    !path.startsWith('references/') ||
    parts.some((part) => !part || part === '.' || part === '..') ||
    path.includes('\\') ||
    !RESOURCE_PATH_PATTERN.test(path)
  ) {
    return null;
  }
  return path;
}

function releaseBase(manifest: SkillReleaseManifest) {
  return {
    schemaVersion: manifest.schemaVersion,
    sourceCatalogSha256: manifest.sourceCatalogSha256,
    skills: manifest.skills,
  };
}

function parseManifest(value: unknown, expectedReleaseId: string) {
  if (!isRecord(value)) {
    throw new SkillReleaseValidationError('Skill manifest must be an object');
  }
  if (value.schemaVersion !== SKILL_RELEASE_SCHEMA_VERSION) {
    throw new SkillReleaseValidationError('Unsupported skill manifest schema');
  }
  if (
    value.releaseId !== expectedReleaseId ||
    !isSha256(value.releaseId) ||
    !isSha256(value.sourceCatalogSha256) ||
    !Array.isArray(value.skills)
  ) {
    throw new SkillReleaseValidationError('Invalid skill manifest metadata');
  }

  const seen = new Set<string>();
  const skills = value.skills.map((entry): SkillReleaseManifestEntry => {
    if (
      !isRecord(entry) ||
      !isSkillName(entry.name) ||
      typeof entry.title !== 'string' ||
      !entry.title.trim() ||
      typeof entry.summary !== 'string' ||
      !Number.isSafeInteger(entry.bytes) ||
      (entry.bytes as number) <= 0 ||
      (entry.bytes as number) > MAX_SKILL_OBJECT_BYTES ||
      !isSha256(entry.sha256) ||
      seen.has(entry.name)
    ) {
      throw new SkillReleaseValidationError('Invalid skill manifest entry');
    }
    seen.add(entry.name);
    return {
      name: entry.name,
      title: entry.title,
      summary: entry.summary,
      bytes: entry.bytes as number,
      sha256: entry.sha256,
    };
  });

  return {
    schemaVersion: SKILL_RELEASE_SCHEMA_VERSION,
    releaseId: value.releaseId,
    sourceCatalogSha256: value.sourceCatalogSha256,
    skills,
  } satisfies SkillReleaseManifest;
}

function parseSkillObject(
  value: unknown,
  entry: SkillReleaseManifestEntry,
  releaseId: string
): PromptSkill {
  if (
    !isRecord(value) ||
    value.schemaVersion !== SKILL_RELEASE_SCHEMA_VERSION ||
    value.name !== entry.name ||
    value.title !== entry.title ||
    value.summary !== entry.summary ||
    typeof value.instructions !== 'string' ||
    !value.instructions.trim() ||
    !isRecord(value.references)
  ) {
    throw new SkillReleaseValidationError(
      `Invalid skill object for "${entry.name}"`
    );
  }

  const references: Record<string, string> = {};
  for (const [path, contents] of Object.entries(value.references)) {
    if (
      normalizeSkillResourcePath(path) !== path ||
      typeof contents !== 'string'
    ) {
      throw new SkillReleaseValidationError(
        `Invalid skill resource for "${entry.name}"`
      );
    }
    references[path] = contents;
  }

  return {
    name: entry.name,
    title: entry.title,
    summary: entry.summary,
    instructions: value.instructions,
    references,
    releaseId,
  };
}

export function skillManifestKey(releaseId: string): string {
  if (!RELEASE_ID_PATTERN.test(releaseId)) {
    throw new SkillReleaseValidationError('Invalid skill release id');
  }
  return `${SKILL_RELEASE_PREFIX}/${releaseId}/manifest.json`;
}

export function skillObjectKey(releaseId: string, name: string): string {
  if (!RELEASE_ID_PATTERN.test(releaseId) || !isSkillName(name)) {
    throw new SkillReleaseValidationError('Invalid skill object identity');
  }
  return `${SKILL_RELEASE_PREFIX}/${releaseId}/skills/${name}.json`;
}

export function createSkillRegistry(
  store: SkillObjectStore,
  releaseId: string
) {
  if (!RELEASE_ID_PATTERN.test(releaseId)) {
    throw new SkillRegistryUnavailableError(
      'AGENT_SKILLS_RELEASE must be a 64-character SHA-256 release id'
    );
  }

  let manifestPromise: Promise<SkillReleaseManifest> | null = null;
  const skillPromises = new Map<string, Promise<PromptSkill>>();

  async function loadManifest(): Promise<SkillReleaseManifest> {
    if (manifestPromise) return manifestPromise;

    manifestPromise = (async () => {
      const text = await store.readText(
        skillManifestKey(releaseId),
        MAX_SKILL_MANIFEST_BYTES
      );
      if (text === null) {
        throw new SkillRegistryUnavailableError(
          `Skill release "${releaseId}" was not found`
        );
      }
      let parsed: unknown;
      try {
        parsed = JSON.parse(text);
      } catch (error) {
        throw new SkillReleaseValidationError('Skill manifest is not JSON');
      }
      const manifest = parseManifest(parsed, releaseId);
      const actualReleaseId = await sha256(
        JSON.stringify(releaseBase(manifest))
      );
      if (actualReleaseId !== releaseId) {
        throw new SkillReleaseValidationError(
          'Skill manifest does not match its release id'
        );
      }
      return manifest;
    })().catch((error) => {
      manifestPromise = null;
      throw error;
    });

    return manifestPromise;
  }

  async function list(): Promise<PromptSkillSummary[]> {
    const manifest = await loadManifest();
    return manifest.skills.map(({ name, title, summary }) => ({
      name,
      title,
      summary,
    }));
  }

  async function get(name: string | undefined): Promise<PromptSkill | null> {
    const normalized = name?.trim();
    if (!normalized || !isSkillName(normalized)) return null;

    const manifest = await loadManifest();
    const entry = manifest.skills.find((skill) => skill.name === normalized);
    if (!entry) return null;

    const cached = skillPromises.get(entry.name);
    if (cached) return cached;

    const promise = (async () => {
      const text = await store.readText(
        skillObjectKey(releaseId, entry.name),
        MAX_SKILL_OBJECT_BYTES
      );
      if (text === null) {
        throw new SkillRegistryUnavailableError(
          `Skill object "${entry.name}" was not found`
        );
      }
      if (
        utf8Bytes(text) !== entry.bytes ||
        (await sha256(text)) !== entry.sha256
      ) {
        throw new SkillReleaseValidationError(
          `Skill object "${entry.name}" failed integrity validation`
        );
      }
      let parsed: unknown;
      try {
        parsed = JSON.parse(text) as SkillReleaseObject;
      } catch {
        throw new SkillReleaseValidationError(
          `Skill object "${entry.name}" is not JSON`
        );
      }
      return parseSkillObject(parsed, entry, releaseId);
    })().catch((error) => {
      skillPromises.delete(entry.name);
      throw error;
    });

    // The prompt-only catalog is intentionally small. Bound the isolate cache
    // so a future dynamic catalog cannot grow memory without limit.
    if (skillPromises.size >= 64) {
      const oldest = skillPromises.keys().next().value;
      if (oldest) skillPromises.delete(oldest);
    }
    skillPromises.set(entry.name, promise);
    return promise;
  }

  return { get, list, releaseId, storeKey: store.cacheKey };
}
