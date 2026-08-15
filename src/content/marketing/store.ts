import {
  createMarketingContentRegistry,
  MarketingContentUnavailableError,
  type MarketingContentObjectStore,
} from './registry';

const LOCAL_RELEASE_ROOT = '.marketing-content';
const LOCAL_POINTER_FILE = 'current.json';
const R2_BINDING_NAME = 'MARKETING_CONTENT';

interface R2ObjectBodyLike {
  size?: number;
  text(): Promise<string>;
}

interface R2BucketLike {
  get(key: string): Promise<R2ObjectBodyLike | null>;
}

interface CloudflareMarketingEnv {
  MARKETING_CONTENT?: R2BucketLike;
  MARKETING_CONTENT_RELEASE?: string;
}

interface LocalReleasePointer {
  schemaVersion: number;
  releaseId: string;
}

interface CacheLike {
  match(request: Request): Promise<Response | undefined>;
  put(request: Request, response: Response): Promise<void>;
}

const registries = new Map<
  string,
  ReturnType<typeof createMarketingContentRegistry>
>();

function rememberRegistry(
  key: string,
  registry: ReturnType<typeof createMarketingContentRegistry>
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

function cloudflareEnv(): CloudflareMarketingEnv | undefined {
  const runtime = globalThis as typeof globalThis & {
    __CF_ENV__?: CloudflareMarketingEnv;
    __env__?: CloudflareMarketingEnv;
  };
  return runtime.__CF_ENV__ ?? runtime.__env__;
}

function cloudflareCache(): CacheLike | undefined {
  const runtime = globalThis as typeof globalThis & {
    caches?: { default?: CacheLike };
  };
  return runtime.caches?.default;
}

function isCloudflareWorkerRuntime(): boolean {
  return (
    (typeof navigator !== 'undefined' &&
      navigator.userAgent === 'Cloudflare-Workers') ||
    (typeof globalThis !== 'undefined' && 'Cloudflare' in globalThis)
  );
}

function releaseFromEnvironment(
  env?: CloudflareMarketingEnv
): string | undefined {
  const processRelease =
    typeof process !== 'undefined'
      ? process.env.MARKETING_CONTENT_RELEASE
      : undefined;
  return (
    env?.MARKETING_CONTENT_RELEASE?.trim() ||
    processRelease?.trim() ||
    undefined
  );
}

function cacheRequest(releaseId: string, key: string): Request {
  return new Request(
    `https://marketing-content.internal/${releaseId}/${encodeURIComponent(key)}`
  );
}

function r2Store(
  bucket: R2BucketLike,
  releaseId: string
): MarketingContentObjectStore {
  const cache = cloudflareCache();
  return {
    cacheKey: `r2:${releaseId}`,
    async readText(key, maxBytes) {
      const request = cacheRequest(releaseId, key);
      if (cache) {
        const cached = await cache.match(request).catch(() => undefined);
        if (cached) {
          const text = await cached.text();
          if (utf8Bytes(text) > maxBytes) {
            throw new MarketingContentUnavailableError(
              `Cached marketing object "${key}" exceeds the runtime size limit`
            );
          }
          return text;
        }
      }

      let object: R2ObjectBodyLike | null;
      try {
        object = await bucket.get(key);
      } catch (error) {
        throw new MarketingContentUnavailableError(
          `Failed to read marketing object "${key}" from R2`,
          { cause: error }
        );
      }
      if (!object) return null;
      if (typeof object.size === 'number' && object.size > maxBytes) {
        throw new MarketingContentUnavailableError(
          `Marketing object "${key}" exceeds the runtime size limit`
        );
      }
      let text: string;
      try {
        text = await object.text();
      } catch (error) {
        throw new MarketingContentUnavailableError(
          `Failed to read marketing object body "${key}" from R2`,
          { cause: error }
        );
      }
      if (utf8Bytes(text) > maxBytes) {
        throw new MarketingContentUnavailableError(
          `Marketing object "${key}" exceeds the runtime size limit`
        );
      }
      if (cache) {
        await cache
          .put(
            request,
            new Response(text, {
              headers: {
                'Cache-Control': 'public, max-age=31536000, immutable',
                'Content-Type': 'application/json; charset=utf-8',
              },
            })
          )
          .catch(() => undefined);
      }
      return text;
    },
  };
}

async function nodeModules() {
  // Non-literal runtime imports keep local release files outside Worker builds.
  const fsSpecifier = 'node:fs/promises';
  const pathSpecifier = 'node:path';
  const [fs, path] = await Promise.all([
    import(/* @vite-ignore */ fsSpecifier),
    import(/* @vite-ignore */ pathSpecifier),
  ]);
  return { fs, path };
}

async function localReleaseRoot(): Promise<string> {
  const configured =
    typeof process !== 'undefined'
      ? process.env.MARKETING_CONTENT_LOCAL_ROOT?.trim()
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
    throw new MarketingContentUnavailableError(
      'Local marketing release is missing. Run "pnpm marketing:build-content-release" first.',
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
    throw new MarketingContentUnavailableError(
      `Local marketing release pointer "${pointerPath}" is invalid`,
      { cause: error }
    );
  }
}

function localStore(
  root: string,
  releaseId: string
): MarketingContentObjectStore {
  return {
    cacheKey: `local:${root}:${releaseId}`,
    async readText(key, maxBytes) {
      const { fs, path } = await nodeModules();
      const resolved = path.resolve(root, key);
      const relative = path.relative(root, resolved);
      if (relative.startsWith('..') || path.isAbsolute(relative)) {
        throw new MarketingContentUnavailableError(
          `Rejected marketing object path "${key}"`
        );
      }
      try {
        const stat = await fs.stat(resolved);
        if (!stat.isFile()) return null;
        if (stat.size > maxBytes) {
          throw new MarketingContentUnavailableError(
            `Marketing object "${key}" exceeds the runtime size limit`
          );
        }
        const text = await fs.readFile(resolved, 'utf8');
        if (utf8Bytes(text) > maxBytes) {
          throw new MarketingContentUnavailableError(
            `Marketing object "${key}" exceeds the runtime size limit`
          );
        }
        return text;
      } catch (error) {
        const code = (error as { code?: string }).code;
        if (code === 'ENOENT' || code === 'ENOTDIR') return null;
        if (error instanceof MarketingContentUnavailableError) throw error;
        throw new MarketingContentUnavailableError(
          `Failed to read local marketing object "${key}"`,
          { cause: error }
        );
      }
    },
  };
}

export async function getDefaultMarketingContentRegistry() {
  const env = cloudflareEnv();
  const releaseId = releaseFromEnvironment(env);

  if (isCloudflareWorkerRuntime()) {
    if (!env?.MARKETING_CONTENT) {
      throw new MarketingContentUnavailableError(
        `R2 binding "${R2_BINDING_NAME}" is not configured`
      );
    }
    if (!releaseId) {
      throw new MarketingContentUnavailableError(
        'MARKETING_CONTENT_RELEASE is not configured'
      );
    }
    const store = r2Store(env.MARKETING_CONTENT, releaseId);
    const cached = registries.get(store.cacheKey);
    if (cached) return cached;
    return rememberRegistry(
      store.cacheKey,
      createMarketingContentRegistry(store, releaseId)
    );
  }

  const root = await localReleaseRoot();
  const localId = releaseId || (await localReleaseId(root));
  const store = localStore(root, localId);
  const cached = registries.get(store.cacheKey);
  if (cached) return cached;
  return rememberRegistry(
    store.cacheKey,
    createMarketingContentRegistry(store, localId)
  );
}
