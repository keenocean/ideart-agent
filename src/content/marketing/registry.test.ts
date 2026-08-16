import { describe, expect, it } from 'vitest';

import {
  marketingContentDirectoryKeys,
  marketingContentHomeProjectionLocales,
  marketingContentPageKeys,
} from './index';
import {
  createMarketingContentRegistry,
  MarketingContentUnavailableError,
  MarketingContentValidationError,
  marketingDirectoryObjectKey,
  marketingHomeProjectionObjectKey,
  marketingManifestKey,
  marketingPageObjectKey,
  type MarketingContentObjectStore,
} from './registry';
import type { MarketingContentManifest } from './schema';

type Fixture = {
  releaseId: string;
  objects: Map<string, string>;
};

const SOURCE_SHA256 = '0'.repeat(64);

async function sha256(value: string): Promise<string> {
  const digest = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(value)
  );
  return Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, '0')
  ).join('');
}

function utf8Bytes(value: string): number {
  return new TextEncoder().encode(value).byteLength;
}

async function fixtureFor(
  base: Omit<MarketingContentManifest, 'releaseId'>
): Promise<Fixture> {
  const releaseId = await sha256(JSON.stringify(base));
  const manifest = { releaseId, ...base } satisfies MarketingContentManifest;
  return {
    releaseId,
    objects: new Map([
      [marketingManifestKey(releaseId), JSON.stringify(manifest)],
    ]),
  };
}

async function emptyFixture(): Promise<Fixture> {
  return fixtureFor({
    schemaVersion: 1,
    sourceSha256: SOURCE_SHA256,
    pages: [],
    directories: [],
    projections: [],
  });
}

async function directoryFixture(): Promise<Fixture> {
  const directory = {
    schemaVersion: 1,
    kind: 'tools',
    locale: 'en',
    seo: {
      title: 'Tools',
      description: 'Published tools.',
    },
    hero: {
      title: 'Tools',
      description: 'Published tools.',
    },
    items: [],
  } as const;
  const text = JSON.stringify(directory);
  const fixture = await fixtureFor({
    schemaVersion: 1,
    sourceSha256: SOURCE_SHA256,
    pages: [],
    directories: [
      {
        kind: 'tools',
        locale: 'en',
        itemCount: 0,
        bytes: utf8Bytes(text),
        sha256: await sha256(text),
      },
    ],
    projections: [],
  });
  fixture.objects.set(
    marketingDirectoryObjectKey(fixture.releaseId, 'tools', 'en'),
    text
  );
  return fixture;
}

function store(objects: Map<string, string>): MarketingContentObjectStore {
  return {
    cacheKey: 'fixture',
    async readText(key) {
      return objects.get(key) ?? null;
    },
  };
}

describe('marketing content release registry', () => {
  it('publishes an empty production manifest for Ideart', () => {
    expect(marketingContentPageKeys).toEqual([]);
    expect(marketingContentDirectoryKeys).toEqual([]);
    expect(marketingContentHomeProjectionLocales).toEqual([]);
  });

  it('returns null for every getter when the pinned release is empty', async () => {
    const fixture = await emptyFixture();
    const registry = createMarketingContentRegistry(
      store(fixture.objects),
      fixture.releaseId
    );

    await expect(
      registry.getToolPage('ai-image-generator', 'en')
    ).resolves.toBeNull();
    await expect(
      registry.getModelPage('seedance-2-5', 'en')
    ).resolves.toBeNull();
    await expect(registry.getToolDirectory('en')).resolves.toBeNull();
    await expect(registry.getModelDirectory('en')).resolves.toBeNull();
    await expect(registry.getHomeProjection('en')).resolves.toBeNull();
  });

  it('loads an integrity-checked directory object from a neutral fixture', async () => {
    const fixture = await directoryFixture();
    const registry = createMarketingContentRegistry(
      store(fixture.objects),
      fixture.releaseId
    );

    await expect(registry.getToolDirectory('en')).resolves.toMatchObject({
      kind: 'tools',
      locale: 'en',
      items: [],
    });
  });

  it('treats a missing published object as temporary unavailability', async () => {
    const fixture = await directoryFixture();
    fixture.objects.delete(
      marketingDirectoryObjectKey(fixture.releaseId, 'tools', 'en')
    );
    const registry = createMarketingContentRegistry(
      store(fixture.objects),
      fixture.releaseId
    );

    await expect(registry.getToolDirectory('en')).rejects.toBeInstanceOf(
      MarketingContentUnavailableError
    );
  });

  it('rejects an object body whose hash differs from the pinned manifest', async () => {
    const fixture = await directoryFixture();
    const key = marketingDirectoryObjectKey(fixture.releaseId, 'tools', 'en');
    fixture.objects.set(key, `${fixture.objects.get(key)} `);
    const registry = createMarketingContentRegistry(
      store(fixture.objects),
      fixture.releaseId
    );

    await expect(registry.getToolDirectory('en')).rejects.toBeInstanceOf(
      MarketingContentValidationError
    );
  });

  it('keeps invalid identities out of release object keys', () => {
    expect(() =>
      marketingPageObjectKey(SOURCE_SHA256, 'tool', '../tool', 'en')
    ).toThrow(MarketingContentValidationError);
    expect(() =>
      marketingDirectoryObjectKey(SOURCE_SHA256, 'tools', 'english' as never)
    ).toThrow(MarketingContentValidationError);
    expect(() =>
      marketingHomeProjectionObjectKey(SOURCE_SHA256, 'english' as never)
    ).toThrow(MarketingContentValidationError);
  });
});
