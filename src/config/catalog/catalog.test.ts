import { describe, expect, it } from 'vitest';

import { generationPresetFor } from './generation';
import { catalog } from './index';
import { legacyCatalogRoutes } from './legacy-routes';
import { modelCatalog } from './models';
import {
  catalogPath,
  catalogRouteSegment,
  catalogUrl,
  findCatalogRoute,
} from './paths';
import { deriveDeploymentReadiness } from './readiness';
import { resolveCatalogRoute } from './resolver';
import {
  selectDirectoryEntries,
  selectHomeEntries,
  selectIndexableUrls,
  selectLlmsEntries,
  selectRelatedEntries,
} from './selectors';
import { toolCatalog } from './tools';
import type { CatalogDefinition } from './types';
import { validateCatalog } from './validate';

const everyCatalogPageAvailable = () => true;

describe('Catalog contract', () => {
  it('validates the initial tool/model Catalog and keeps every locale noindex', () => {
    expect(() => validateCatalog(catalog, legacyCatalogRoutes)).not.toThrow();
    expect(selectIndexableUrls(catalog, everyCatalogPageAvailable)).toEqual([]);
    expect(selectLlmsEntries(catalog, 'en', everyCatalogPageAvailable)).toEqual(
      []
    );
    expect(
      catalog.flatMap((entry) =>
        Object.values(entry.localePages ?? {}).map((page) =>
          'indexing' in page! ? page!.indexing : 'noindex'
        )
      )
    ).toEqual(expect.arrayContaining(['noindex']));
  });

  it('uses locale-specific slugs without falling back across languages', () => {
    const fixture: CatalogDefinition = {
      kind: 'tool',
      entityId: 'localized-tool',
      publication: 'listed',
      availability: 'live',
      localePages: {
        en: {
          slug: catalogRouteSegment('english-tool'),
          indexing: 'noindex',
        },
        zh: {
          slug: catalogRouteSegment('zhongwen-tool'),
          indexing: 'noindex',
        },
      },
      placement: { directoryOrder: 1 },
      archetype: 'image-generator',
      execution: {
        kind: 'agent-preset',
        mediaMode: 'image',
        inputPolicy: { minimum: 0, accepts: ['image'] },
      },
    };

    expect(
      findCatalogRoute([fixture], 'tool', 'zh', 'zhongwen-tool')?.path
    ).toBe('/tools/zhongwen-tool');
    expect(
      findCatalogRoute([fixture], 'tool', 'zh', 'english-tool')
    ).toBeNull();
    expect(findCatalogRoute([fixture], 'tool', 'en', 'missing')).toBeNull();
    expect(resolveCatalogRoute('tool', 'en', 'ai-image-generator').path).toBe(
      '/tools/ai-image-generator'
    );
    expect(() => resolveCatalogRoute('tool', 'zh', 'missing')).toThrow(
      /not found/
    );
  });

  it('rejects unsafe route segments and locale-prefixed input', () => {
    expect(catalogPath('tool', 'ai-image-generator')).toBe(
      '/tools/ai-image-generator'
    );
    expect(catalogUrl('tool', 'en', 'ai-image-generator')).toBe(
      'http://localhost:3000/tools/ai-image-generator'
    );
    expect(catalogUrl('tool', 'zh', 'ai-image-generator')).toBe(
      'http://localhost:3000/zh/tools/ai-image-generator'
    );
    for (const unsafe of [
      'zh/ai-image-generator',
      '../secret',
      'a%2Fb',
      'tool?x=1',
      'tool#x',
      '.hidden',
    ]) {
      expect(() => catalogRouteSegment(unsafe)).toThrow();
    }
  });

  it('exposes only a safe deployment-readiness snapshot', () => {
    expect(
      deriveDeploymentReadiness({
        providerConfigured: true,
        modelRouteAvailable: true,
        storageConfigured: false,
      })
    ).toEqual({ executable: false, reason: 'storage-unconfigured' });
    expect(
      deriveDeploymentReadiness({
        providerConfigured: true,
        modelRouteAvailable: true,
        storageConfigured: true,
      })
    ).toEqual({ executable: true });
  });

  it('keeps home, directory, related and discovery semantics separate', () => {
    const imageGenerator = catalog.find(
      (entry) => entry.entityId === 'ai-image-generator'
    )!;
    expect(
      selectHomeEntries(toolCatalog, 'en', everyCatalogPageAvailable).map(
        (entry) => entry.entityId
      )
    ).toEqual(['ai-image-generator', 'text-to-video', 'image-to-video']);
    expect(
      selectHomeEntries(modelCatalog, 'en', everyCatalogPageAvailable).map(
        (entry) => entry.entityId
      )
    ).toEqual(['gpt-image-2', 'minimax-h3']);
    expect(
      selectDirectoryEntries(catalog, 'en', everyCatalogPageAvailable)
    ).toHaveLength(catalog.length);
    expect(
      selectRelatedEntries(
        catalog,
        imageGenerator,
        'en',
        everyCatalogPageAvailable
      ).map((entry) => entry.entityId)
    ).toEqual(['ai-image-editor', 'gpt-image-2']);
    expect(selectIndexableUrls(catalog, everyCatalogPageAvailable)).toEqual([]);
  });

  it('projects modality-safe UI presets without making them authoritative', () => {
    const imageTool = catalog.find(
      (entry) => entry.entityId === 'ai-image-editor'
    )!;
    const imageModel = catalog.find(
      (entry) => entry.entityId === 'gpt-image-2'
    )!;
    expect(generationPresetFor(imageTool)).toMatchObject({
      target: { mediaMode: 'image', modelKey: 'gpt-image-2' },
      locks: { mediaMode: true, model: false },
      inputPolicy: { minimum: 1, maximum: 16, accepts: ['image'] },
    });
    expect(generationPresetFor(imageModel)).toMatchObject({
      target: { mediaMode: 'image', modelKey: 'gpt-image-2' },
      locks: { mediaMode: true, model: true },
    });
  });

  it('rejects duplicate locale slugs and broken related references', () => {
    const original = catalog[0];
    const duplicate = {
      ...catalog[1],
      entityId: 'duplicate-fixture',
      localePages: original.localePages,
      related: ['missing-entry'],
    } as CatalogDefinition;
    expect(() => validateCatalog([original, duplicate], [])).toThrow(
      /Duplicate Catalog slug|Unknown related/
    );
  });

  it('enforces publication, availability, placement and input-policy states', () => {
    const base = catalog.find(
      (entry) => entry.entityId === 'ai-image-generator'
    )!;
    const comingSoonIndexable = {
      ...base,
      entityId: 'coming-soon-fixture',
      availability: 'coming-soon',
      localePages: {
        en: {
          slug: catalogRouteSegment('coming-soon-fixture'),
          indexing: 'index',
        },
      },
      related: [],
    } as CatalogDefinition;
    expect(() => validateCatalog([comingSoonIndexable], [])).toThrow(
      /Coming-soon/
    );

    const invalidRange = {
      ...base,
      entityId: 'invalid-range-fixture',
      localePages: {
        en: {
          slug: catalogRouteSegment('invalid-range-fixture'),
          indexing: 'noindex',
        },
      },
      related: [],
      execution: {
        ...base.execution,
        inputPolicy: { minimum: 2, maximum: 1, accepts: ['image'] },
      },
    } as CatalogDefinition;
    expect(() => validateCatalog([invalidRange], [])).toThrow(/input range/);

    const invalidArchetypeMode = {
      ...base,
      entityId: 'invalid-archetype-mode',
      localePages: {
        en: {
          slug: catalogRouteSegment('invalid-archetype-mode'),
          indexing: 'noindex',
        },
      },
      related: [],
      execution: { ...base.execution, mediaMode: 'video' },
    } as CatalogDefinition;
    expect(() => validateCatalog([invalidArchetypeMode], [])).toThrow(
      /archetype\/media mode mismatch/
    );
  });

  it('validates legacy sources and current-locale redirect targets', () => {
    const oldSlug = catalogRouteSegment('old-image-generator');
    expect(() =>
      validateCatalog(catalog, [
        {
          kind: 'tool',
          locale: 'en',
          fromSlug: oldSlug,
          action: 'redirect',
          toEntityId: 'ai-image-generator',
        },
      ])
    ).not.toThrow();
    expect(() =>
      validateCatalog(catalog, [
        {
          kind: 'tool',
          locale: 'en',
          fromSlug: oldSlug,
          action: 'redirect',
          toEntityId: 'missing-target',
        },
      ])
    ).toThrow(/Invalid legacy redirect target/);
    expect(() =>
      validateCatalog(catalog, [
        {
          kind: 'tool',
          locale: 'en',
          fromSlug: oldSlug,
          action: 'gone',
        },
        {
          kind: 'tool',
          locale: 'en',
          fromSlug: oldSlug,
          action: 'gone',
        },
      ])
    ).toThrow(/Duplicate legacy Catalog route/);
  });
});
