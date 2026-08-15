import type { AppLocale } from '@/config/locale';

import {
  MARKETING_CONTENT_RELEASE_PREFIX,
  marketingContentManifestSchema,
  MAX_MARKETING_DIRECTORY_BYTES,
  MAX_MARKETING_MANIFEST_BYTES,
  MAX_MARKETING_PAGE_BYTES,
  parseToolDirectoryReleaseObject,
  parseToolPageReleaseObject,
  type MarketingContentManifest,
  type ToolDirectoryReleaseObject,
  type ToolPageReleaseObject,
} from './schema';

const RELEASE_ID_PATTERN = /^[a-f0-9]{64}$/;
const ENTITY_ID_PATTERN = /^[a-z0-9](?:[a-z0-9-]{0,126}[a-z0-9])?$/;
const LOCALE_PATTERN = /^[a-z]{2}(?:-[A-Z]{2})?$/;

export interface MarketingContentObjectStore {
  readonly cacheKey: string;
  readText(key: string, maxBytes: number): Promise<string | null>;
}

export class MarketingContentUnavailableError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = 'MarketingContentUnavailableError';
  }
}

export class MarketingContentValidationError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = 'MarketingContentValidationError';
  }
}

export function isMarketingContentFailure(
  error: unknown
): error is MarketingContentUnavailableError | MarketingContentValidationError {
  return (
    error instanceof MarketingContentUnavailableError ||
    error instanceof MarketingContentValidationError
  );
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

function releaseBase(manifest: MarketingContentManifest) {
  return {
    schemaVersion: manifest.schemaVersion,
    sourceSha256: manifest.sourceSha256,
    pages: manifest.pages,
    directories: manifest.directories,
  };
}

export function marketingManifestKey(releaseId: string): string {
  if (!RELEASE_ID_PATTERN.test(releaseId)) {
    throw new MarketingContentValidationError(
      'Invalid marketing content release id'
    );
  }
  return `${MARKETING_CONTENT_RELEASE_PREFIX}/${releaseId}/manifest.json`;
}

export function marketingPageObjectKey(
  releaseId: string,
  kind: 'tool',
  entityId: string,
  locale: AppLocale
): string {
  if (
    !RELEASE_ID_PATTERN.test(releaseId) ||
    !ENTITY_ID_PATTERN.test(entityId) ||
    !LOCALE_PATTERN.test(locale)
  ) {
    throw new MarketingContentValidationError(
      'Invalid marketing page identity'
    );
  }
  return `${MARKETING_CONTENT_RELEASE_PREFIX}/${releaseId}/pages/${kind}/${entityId}/${locale}.json`;
}

export function marketingDirectoryObjectKey(
  releaseId: string,
  kind: 'tools',
  locale: AppLocale
): string {
  if (!RELEASE_ID_PATTERN.test(releaseId) || !LOCALE_PATTERN.test(locale)) {
    throw new MarketingContentValidationError(
      'Invalid marketing directory identity'
    );
  }
  return `${MARKETING_CONTENT_RELEASE_PREFIX}/${releaseId}/directories/${kind}/${locale}.json`;
}

async function parseJson(text: string, label: string): Promise<unknown> {
  try {
    return JSON.parse(text) as unknown;
  } catch (error) {
    throw new MarketingContentValidationError(`${label} is not JSON`, {
      cause: error,
    });
  }
}

function boundedRemember<T>(
  cache: Map<string, Promise<T>>,
  key: string,
  value: Promise<T>,
  limit: number
): Promise<T> {
  if (cache.size >= limit) {
    const oldest = cache.keys().next().value;
    if (oldest) cache.delete(oldest);
  }
  cache.set(key, value);
  return value;
}

export function createMarketingContentRegistry(
  store: MarketingContentObjectStore,
  releaseId: string
) {
  if (!RELEASE_ID_PATTERN.test(releaseId)) {
    throw new MarketingContentUnavailableError(
      'MARKETING_CONTENT_RELEASE must be a 64-character SHA-256 release id'
    );
  }

  let manifestPromise: Promise<MarketingContentManifest> | null = null;
  const pagePromises = new Map<string, Promise<ToolPageReleaseObject>>();
  const directoryPromises = new Map<
    string,
    Promise<ToolDirectoryReleaseObject>
  >();

  async function loadManifest(): Promise<MarketingContentManifest> {
    if (manifestPromise) return manifestPromise;
    manifestPromise = (async () => {
      const text = await store.readText(
        marketingManifestKey(releaseId),
        MAX_MARKETING_MANIFEST_BYTES
      );
      if (text === null) {
        throw new MarketingContentUnavailableError(
          `Marketing content release "${releaseId}" was not found`
        );
      }
      let manifest: MarketingContentManifest;
      try {
        manifest = marketingContentManifestSchema.parse(
          await parseJson(text, 'Marketing content manifest')
        );
      } catch (error) {
        if (isMarketingContentFailure(error)) throw error;
        throw new MarketingContentValidationError(
          'Marketing content manifest failed schema validation',
          { cause: error }
        );
      }
      if (manifest.releaseId !== releaseId) {
        throw new MarketingContentValidationError(
          'Marketing content manifest release id mismatch'
        );
      }
      if ((await sha256(JSON.stringify(releaseBase(manifest)))) !== releaseId) {
        throw new MarketingContentValidationError(
          'Marketing content manifest does not match its release id'
        );
      }
      return manifest;
    })().catch((error) => {
      manifestPromise = null;
      throw error;
    });
    return manifestPromise;
  }

  async function verifiedObject(
    key: string,
    entry: { bytes: number; sha256: string },
    maxBytes: number,
    label: string
  ): Promise<unknown> {
    const text = await store.readText(key, maxBytes);
    if (text === null) {
      throw new MarketingContentUnavailableError(`${label} was not found`);
    }
    if (
      utf8Bytes(text) !== entry.bytes ||
      (await sha256(text)) !== entry.sha256
    ) {
      throw new MarketingContentValidationError(
        `${label} failed integrity validation`
      );
    }
    return parseJson(text, label);
  }

  async function getToolPage(
    entityId: string,
    locale: AppLocale
  ): Promise<ToolPageReleaseObject | null> {
    if (!ENTITY_ID_PATTERN.test(entityId) || !LOCALE_PATTERN.test(locale)) {
      return null;
    }
    const manifest = await loadManifest();
    const entry = manifest.pages.find(
      (page) =>
        page.kind === 'tool' &&
        page.entityId === entityId &&
        page.locale === locale
    );
    if (!entry) return null;
    const cacheKey = `tool:${entityId}:${locale}`;
    const cached = pagePromises.get(cacheKey);
    if (cached) return cached;
    const promise = (async () => {
      const value = await verifiedObject(
        marketingPageObjectKey(releaseId, 'tool', entityId, locale),
        entry,
        MAX_MARKETING_PAGE_BYTES,
        `Marketing page "${cacheKey}"`
      );
      let page: ToolPageReleaseObject;
      try {
        page = parseToolPageReleaseObject(value);
      } catch (error) {
        throw new MarketingContentValidationError(
          `Marketing page "${cacheKey}" failed schema validation`,
          { cause: error }
        );
      }
      if (
        page.kind !== 'tool' ||
        page.entityId !== entityId ||
        page.locale !== locale ||
        page.contentModifiedAt !== entry.contentModifiedAt
      ) {
        throw new MarketingContentValidationError(
          `Marketing page "${cacheKey}" identity mismatch`
        );
      }
      return page;
    })().catch((error) => {
      pagePromises.delete(cacheKey);
      throw error;
    });
    return boundedRemember(pagePromises, cacheKey, promise, 128);
  }

  async function getToolDirectory(
    locale: AppLocale
  ): Promise<ToolDirectoryReleaseObject | null> {
    if (!LOCALE_PATTERN.test(locale)) return null;
    const manifest = await loadManifest();
    const entry = manifest.directories.find(
      (directory) => directory.kind === 'tools' && directory.locale === locale
    );
    if (!entry) return null;
    const cacheKey = `tools:${locale}`;
    const cached = directoryPromises.get(cacheKey);
    if (cached) return cached;
    const promise = (async () => {
      const value = await verifiedObject(
        marketingDirectoryObjectKey(releaseId, 'tools', locale),
        entry,
        MAX_MARKETING_DIRECTORY_BYTES,
        `Marketing directory "${cacheKey}"`
      );
      let directory: ToolDirectoryReleaseObject;
      try {
        directory = parseToolDirectoryReleaseObject(value);
      } catch (error) {
        throw new MarketingContentValidationError(
          `Marketing directory "${cacheKey}" failed schema validation`,
          { cause: error }
        );
      }
      if (
        directory.kind !== 'tools' ||
        directory.locale !== locale ||
        directory.items.length !== entry.itemCount
      ) {
        throw new MarketingContentValidationError(
          `Marketing directory "${cacheKey}" identity mismatch`
        );
      }
      return directory;
    })().catch((error) => {
      directoryPromises.delete(cacheKey);
      throw error;
    });
    return boundedRemember(directoryPromises, cacheKey, promise, 32);
  }

  return {
    getToolPage,
    getToolDirectory,
    loadManifest,
    releaseId,
    storeKey: store.cacheKey,
  };
}
