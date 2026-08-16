import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

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

type Fixture = {
  releaseId: string;
  objects: Map<string, string>;
};

async function releaseFixture(): Promise<Fixture> {
  const root = path.resolve('.marketing-content');
  const pointer = JSON.parse(
    await readFile(path.join(root, 'current.json'), 'utf8')
  ) as { releaseId: string };
  const keys = [
    marketingManifestKey(pointer.releaseId),
    marketingPageObjectKey(
      pointer.releaseId,
      'tool',
      'ai-image-generator',
      'en'
    ),
    marketingDirectoryObjectKey(pointer.releaseId, 'tools', 'en'),
    marketingPageObjectKey(pointer.releaseId, 'model', 'seedance-2-5', 'en'),
    marketingDirectoryObjectKey(pointer.releaseId, 'models', 'en'),
    marketingHomeProjectionObjectKey(pointer.releaseId, 'en'),
  ];
  return {
    releaseId: pointer.releaseId,
    objects: new Map(
      await Promise.all(
        keys.map(
          async (key) =>
            [key, await readFile(path.join(root, key), 'utf8')] as const
        )
      )
    ),
  };
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
  it('loads integrity-checked page and directory objects', async () => {
    const fixture = await releaseFixture();
    const registry = createMarketingContentRegistry(
      store(fixture.objects),
      fixture.releaseId
    );

    await expect(
      registry.getToolPage('ai-image-generator', 'en')
    ).resolves.toMatchObject({
      entityId: 'ai-image-generator',
      locale: 'en',
      content: {
        template: 'image-generator',
        directory: { title: 'AI Image Generator' },
      },
    });
    await expect(registry.getToolDirectory('en')).resolves.toMatchObject({
      kind: 'tools',
      locale: 'en',
      items: [{ entityId: 'ai-image-generator' }],
    });
    await expect(
      registry.getModelPage('seedance-2-5', 'en')
    ).resolves.toMatchObject({
      kind: 'model',
      entityId: 'seedance-2-5',
      content: { template: 'video-model' },
    });
    await expect(registry.getModelDirectory('en')).resolves.toMatchObject({
      kind: 'models',
      items: [{ entityId: 'seedance-2-5' }],
    });
    const home = await registry.getHomeProjection('en');
    expect(home).toMatchObject({
      kind: 'home',
      locale: 'en',
      media: {
        hero: { kind: 'video' },
        og: { kind: 'image' },
      },
      featured: {
        tools: [{ entityId: 'ai-image-generator' }],
        models: [],
      },
    });
    expect(home?.media.examples).toHaveLength(8);
    expect(home?.media.marquee).toHaveLength(8);
    expect(home?.media.useCases).toHaveLength(3);
    await expect(registry.getToolPage('unknown', 'en')).resolves.toBeNull();
  });

  it('treats a missing published object as temporary unavailability', async () => {
    const fixture = await releaseFixture();
    fixture.objects.delete(
      marketingPageObjectKey(
        fixture.releaseId,
        'tool',
        'ai-image-generator',
        'en'
      )
    );
    const registry = createMarketingContentRegistry(
      store(fixture.objects),
      fixture.releaseId
    );

    await expect(
      registry.getToolPage('ai-image-generator', 'en')
    ).rejects.toBeInstanceOf(MarketingContentUnavailableError);
  });

  it('rejects a page body whose hash differs from the pinned manifest', async () => {
    const fixture = await releaseFixture();
    const key = marketingPageObjectKey(
      fixture.releaseId,
      'tool',
      'ai-image-generator',
      'en'
    );
    fixture.objects.set(key, `${fixture.objects.get(key)} `);
    const registry = createMarketingContentRegistry(
      store(fixture.objects),
      fixture.releaseId
    );

    await expect(
      registry.getToolPage('ai-image-generator', 'en')
    ).rejects.toBeInstanceOf(MarketingContentValidationError);
  });

  it('treats a missing published homepage projection as temporary unavailability', async () => {
    const fixture = await releaseFixture();
    fixture.objects.delete(
      marketingHomeProjectionObjectKey(fixture.releaseId, 'en')
    );
    const registry = createMarketingContentRegistry(
      store(fixture.objects),
      fixture.releaseId
    );

    await expect(registry.getHomeProjection('en')).rejects.toBeInstanceOf(
      MarketingContentUnavailableError
    );
  });
});
