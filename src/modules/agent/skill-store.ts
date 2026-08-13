import {
  createSkillRegistry,
  SkillRegistryUnavailableError,
  type SkillObjectStore,
} from './skill-registry';

const LOCAL_RELEASE_ROOT = '.agent-skills';
const LOCAL_POINTER_FILE = 'current.json';
const R2_BINDING_NAME = 'AGENT_SKILLS';

interface R2ObjectBodyLike {
  size?: number;
  text(): Promise<string>;
}

interface R2BucketLike {
  get(key: string): Promise<R2ObjectBodyLike | null>;
}

interface CloudflareSkillEnv {
  AGENT_SKILLS?: R2BucketLike;
  AGENT_SKILLS_RELEASE?: string;
}

interface LocalReleasePointer {
  schemaVersion: number;
  releaseId: string;
}

const registries = new Map<string, ReturnType<typeof createSkillRegistry>>();

function rememberRegistry(
  key: string,
  registry: ReturnType<typeof createSkillRegistry>
) {
  if (registries.size >= 8) {
    const oldest = registries.keys().next().value;
    if (oldest) registries.delete(oldest);
  }
  registries.set(key, registry);
  return registry;
}

function utf8Bytes(value: string): number {
  return new TextEncoder().encode(value).byteLength;
}

function cloudflareEnv(): CloudflareSkillEnv | undefined {
  const runtime = globalThis as typeof globalThis & {
    __CF_ENV__?: CloudflareSkillEnv;
    __env__?: CloudflareSkillEnv;
  };
  return runtime.__CF_ENV__ ?? runtime.__env__;
}

function isCloudflareWorkerRuntime(): boolean {
  return (
    (typeof navigator !== 'undefined' &&
      navigator.userAgent === 'Cloudflare-Workers') ||
    (typeof globalThis !== 'undefined' && 'Cloudflare' in globalThis)
  );
}

function releaseFromEnvironment(env?: CloudflareSkillEnv): string | undefined {
  const processRelease =
    typeof process !== 'undefined'
      ? process.env.AGENT_SKILLS_RELEASE
      : undefined;
  return (
    env?.AGENT_SKILLS_RELEASE?.trim() || processRelease?.trim() || undefined
  );
}

function r2Store(bucket: R2BucketLike, releaseId: string): SkillObjectStore {
  return {
    cacheKey: `r2:${releaseId}`,
    async readText(key, maxBytes) {
      let object: R2ObjectBodyLike | null;
      try {
        object = await bucket.get(key);
      } catch (error) {
        throw new SkillRegistryUnavailableError(
          `Failed to read skill object "${key}" from R2`,
          { cause: error }
        );
      }
      if (!object) return null;
      if (typeof object.size === 'number' && object.size > maxBytes) {
        throw new SkillRegistryUnavailableError(
          `Skill object "${key}" exceeds the runtime size limit`
        );
      }
      let text: string;
      try {
        text = await object.text();
      } catch (error) {
        throw new SkillRegistryUnavailableError(
          `Failed to read skill object body "${key}" from R2`,
          { cause: error }
        );
      }
      if (utf8Bytes(text) > maxBytes) {
        throw new SkillRegistryUnavailableError(
          `Skill object "${key}" exceeds the runtime size limit`
        );
      }
      return text;
    },
  };
}

async function nodeModules() {
  // Keep Node filesystem modules behind runtime-only, non-literal imports so
  // the Cloudflare build cannot traverse or bundle the local release files.
  const fsSpecifier = 'node:fs/promises';
  const pathSpecifier = 'node:path';
  const [fs, path] = await Promise.all([
    import(/* @vite-ignore */ fsSpecifier),
    import(/* @vite-ignore */ pathSpecifier),
  ]);
  return { fs, path };
}

async function localReleaseRoot() {
  const configured =
    typeof process !== 'undefined'
      ? process.env.AGENT_SKILLS_LOCAL_ROOT?.trim()
      : undefined;
  const { path } = await nodeModules();
  return path.resolve(configured || LOCAL_RELEASE_ROOT);
}

async function localReleaseId(root: string): Promise<string> {
  const { fs, path } = await nodeModules();
  const pointerPath = path.join(root, LOCAL_POINTER_FILE);
  let text: string;
  try {
    text = await fs.readFile(pointerPath, 'utf8');
  } catch (error) {
    throw new SkillRegistryUnavailableError(
      `Local skill release is missing. Run "pnpm skills:build" first.`,
      { cause: error }
    );
  }
  try {
    const pointer = JSON.parse(text) as LocalReleasePointer;
    if (pointer.schemaVersion !== 1 || typeof pointer.releaseId !== 'string') {
      throw new Error('invalid pointer');
    }
    return pointer.releaseId;
  } catch (error) {
    throw new SkillRegistryUnavailableError(
      `Local skill release pointer "${pointerPath}" is invalid`,
      { cause: error }
    );
  }
}

function localStore(root: string, releaseId: string): SkillObjectStore {
  return {
    cacheKey: `local:${root}:${releaseId}`,
    async readText(key, maxBytes) {
      const { fs, path } = await nodeModules();
      const resolved = path.resolve(root, key);
      const relative = path.relative(root, resolved);
      if (relative.startsWith('..') || path.isAbsolute(relative)) {
        throw new SkillRegistryUnavailableError(
          `Rejected skill object path "${key}"`
        );
      }
      try {
        const stat = await fs.stat(resolved);
        if (!stat.isFile()) return null;
        if (stat.size > maxBytes) {
          throw new SkillRegistryUnavailableError(
            `Skill object "${key}" exceeds the runtime size limit`
          );
        }
        const text = await fs.readFile(resolved, 'utf8');
        if (utf8Bytes(text) > maxBytes) {
          throw new SkillRegistryUnavailableError(
            `Skill object "${key}" exceeds the runtime size limit`
          );
        }
        return text;
      } catch (error) {
        const code = (error as { code?: string }).code;
        if (code === 'ENOENT' || code === 'ENOTDIR') return null;
        if (error instanceof SkillRegistryUnavailableError) throw error;
        throw new SkillRegistryUnavailableError(
          `Failed to read local skill object "${key}"`,
          { cause: error }
        );
      }
    },
  };
}

export async function getDefaultSkillRegistry() {
  const env = cloudflareEnv();
  const releaseId = releaseFromEnvironment(env);

  if (isCloudflareWorkerRuntime()) {
    if (!env?.AGENT_SKILLS) {
      throw new SkillRegistryUnavailableError(
        `R2 binding "${R2_BINDING_NAME}" is not configured`
      );
    }
    if (!releaseId) {
      throw new SkillRegistryUnavailableError(
        'AGENT_SKILLS_RELEASE is not configured'
      );
    }
    const store = r2Store(env.AGENT_SKILLS, releaseId);
    const cached = registries.get(store.cacheKey);
    if (cached) return cached;
    const registry = createSkillRegistry(store, releaseId);
    return rememberRegistry(store.cacheKey, registry);
  }

  const root = await localReleaseRoot();
  const localId = releaseId || (await localReleaseId(root));
  const store = localStore(root, localId);
  const cached = registries.get(store.cacheKey);
  if (cached) return cached;
  const registry = createSkillRegistry(store, localId);
  return rememberRegistry(store.cacheKey, registry);
}
