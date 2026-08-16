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

const imageTool: CatalogDefinition = {
  kind: 'tool',
  entityId: 'sample-image-generator',
  publication: 'listed',
  availability: 'live',
  localePages: {
    en: {
      slug: catalogRouteSegment('sample-image-generator'),
      indexing: 'noindex',
    },
    zh: {
      slug: catalogRouteSegment('sample-image-generator-zh'),
      indexing: 'noindex',
    },
  },
  placement: { directoryOrder: 1, home: { featured: true, order: 1 } },
  related: ['sample-image-editor', 'sample-image-model'],
  archetype: 'image-generator',
  execution: {
    kind: 'agent-preset',
    mediaMode: 'image',
    inputPolicy: { minimum: 0, maximum: 16, accepts: ['image'] },
  },
};

const imageEditor: CatalogDefinition = {
  kind: 'tool',
  entityId: 'sample-image-editor',
  publication: 'listed',
  availability: 'live',
  localePages: {
    en: {
      slug: catalogRouteSegment('sample-image-editor'),
      indexing: 'noindex',
    },
  },
  placement: { directoryOrder: 4 },
  archetype: 'image-editor',
  execution: {
    kind: 'agent-preset',
    mediaMode: 'image',
    inputPolicy: { minimum: 1, maximum: 16, accepts: ['image'] },
  },
};

const textToVideoTool: CatalogDefinition = {
  kind: 'tool',
  entityId: 'sample-text-to-video',
  publication: 'listed',
  availability: 'live',
  localePages: {
    en: {
      slug: catalogRouteSegment('sample-text-to-video'),
      indexing: 'noindex',
    },
  },
  placement: { directoryOrder: 2, home: { featured: true, order: 2 } },
  archetype: 'text-to-video',
  execution: {
    kind: 'agent-preset',
    mediaMode: 'video',
    videoOperation: 'generate',
  },
};

const imageToVideoTool: CatalogDefinition = {
  kind: 'tool',
  entityId: 'sample-image-to-video',
  publication: 'listed',
  availability: 'live',
  localePages: {
    en: {
      slug: catalogRouteSegment('sample-image-to-video'),
      indexing: 'noindex',
    },
  },
  placement: { directoryOrder: 3, home: { featured: true, order: 3 } },
  archetype: 'image-to-video',
  execution: {
    kind: 'agent-preset',
    mediaMode: 'video',
    videoOperation: 'animate',
    inputPolicy: { minimum: 1, maximum: 1, accepts: ['image'] },
  },
};

const referenceTool: CatalogDefinition = {
  kind: 'tool',
  entityId: 'sample-reference-to-video',
  publication: 'listed',
  availability: 'live',
  localePages: {
    en: {
      slug: catalogRouteSegment('sample-reference-to-video'),
      indexing: 'noindex',
    },
  },
  placement: { directoryOrder: 5 },
  archetype: 'reference-to-video',
  execution: {
    kind: 'agent-preset',
    mediaMode: 'video',
    videoOperation: 'reference',
  },
};

const imageModel: CatalogDefinition = {
  kind: 'model',
  entityId: 'sample-image-model',
  publication: 'listed',
  availability: 'live',
  localePages: {
    en: {
      slug: catalogRouteSegment('sample-image-model'),
      indexing: 'noindex',
    },
  },
  placement: { directoryOrder: 6, home: { featured: true, order: 1 } },
  modality: 'image',
  runtimeModelKey: 'gpt-image-2',
};

const videoModel: CatalogDefinition = {
  kind: 'model',
  entityId: 'sample-video-model',
  publication: 'listed',
  availability: 'live',
  localePages: {
    en: {
      slug: catalogRouteSegment('sample-video-model'),
      indexing: 'noindex',
    },
  },
  placement: { directoryOrder: 7, home: { featured: true, order: 2 } },
  modality: 'video',
  runtimeModelKey: 'seedance-2-5',
};

const toolFixtures = [
  imageTool,
  textToVideoTool,
  imageToVideoTool,
  imageEditor,
  referenceTool,
];
const modelFixtures = [imageModel, videoModel];
const catalogFixtures = [...toolFixtures, ...modelFixtures];

describe('Catalog contract', () => {
  it('allows Ideart to ship an empty production Catalog fail-closed', () => {
    expect(toolCatalog).toEqual([]);
    expect(modelCatalog).toEqual([]);
    expect(catalog).toEqual([]);
    expect(() => validateCatalog(catalog, legacyCatalogRoutes)).not.toThrow();
    expect(selectIndexableUrls(catalog, everyCatalogPageAvailable)).toEqual([]);
    expect(selectLlmsEntries(catalog, 'en', everyCatalogPageAvailable)).toEqual(
      []
    );
    expect(() =>
      resolveCatalogRoute('tool', 'en', 'sample-image-generator')
    ).toThrow(/not found/);
  });

  it('uses locale-specific slugs without falling back across languages', () => {
    expect(
      findCatalogRoute([imageTool], 'tool', 'zh', 'sample-image-generator-zh')
        ?.path
    ).toBe('/tools/sample-image-generator-zh');
    expect(
      findCatalogRoute([imageTool], 'tool', 'zh', 'sample-image-generator')
    ).toBeNull();
    expect(findCatalogRoute([imageTool], 'tool', 'en', 'missing')).toBeNull();
  });

  it('rejects unsafe route segments and locale-prefixed input', () => {
    expect(catalogPath('tool', 'sample-image-generator')).toBe(
      '/tools/sample-image-generator'
    );
    expect(catalogUrl('tool', 'en', 'sample-image-generator')).toBe(
      'http://localhost:3000/tools/sample-image-generator'
    );
    expect(catalogUrl('tool', 'zh', 'sample-image-generator')).toBe(
      'http://localhost:3000/zh/tools/sample-image-generator'
    );
    for (const unsafe of [
      'zh/sample-image-generator',
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
    expect(
      selectHomeEntries(toolFixtures, 'en', everyCatalogPageAvailable).map(
        (entry) => entry.entityId
      )
    ).toEqual([
      'sample-image-generator',
      'sample-text-to-video',
      'sample-image-to-video',
    ]);
    expect(
      selectHomeEntries(modelFixtures, 'en', everyCatalogPageAvailable).map(
        (entry) => entry.entityId
      )
    ).toEqual(['sample-image-model', 'sample-video-model']);
    expect(
      selectDirectoryEntries(catalogFixtures, 'en', everyCatalogPageAvailable)
    ).toHaveLength(catalogFixtures.length);
    expect(
      selectRelatedEntries(
        catalogFixtures,
        imageTool,
        'en',
        everyCatalogPageAvailable
      ).map((entry) => entry.entityId)
    ).toEqual(['sample-image-editor', 'sample-image-model']);
    expect(
      selectIndexableUrls(catalogFixtures, everyCatalogPageAvailable)
    ).toEqual([]);
  });

  it('projects modality-safe UI presets without making them authoritative', () => {
    expect(generationPresetFor(imageEditor)).toMatchObject({
      target: { mediaMode: 'image', modelKey: 'gpt-image-2' },
      locks: { mediaMode: true, model: false },
      inputPolicy: { minimum: 1, maximum: 16, accepts: ['image'] },
    });
    expect(generationPresetFor(imageModel)).toMatchObject({
      target: { mediaMode: 'image', modelKey: 'gpt-image-2' },
      locks: { mediaMode: true, model: true },
    });
    expect(generationPresetFor(referenceTool)).toMatchObject({
      target: {
        mediaMode: 'video',
        modelKey: 'seedance-2-5',
        operation: 'reference',
      },
      locks: { mediaMode: true, model: false },
      inputPolicy: {
        minimum: 1,
        maximum: 50,
        accepts: ['image', 'video', 'audio'],
      },
    });
  });

  it('rejects duplicate locale slugs and broken related references', () => {
    const duplicate = {
      ...imageEditor,
      entityId: 'duplicate-fixture',
      localePages: imageTool.localePages,
      related: ['missing-entry'],
    } as CatalogDefinition;
    expect(() => validateCatalog([imageTool, duplicate], [])).toThrow(
      /Duplicate Catalog slug|Unknown related/
    );
  });

  it('enforces publication, availability, placement and input-policy states', () => {
    const comingSoonIndexable = {
      ...imageTool,
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
      ...imageTool,
      entityId: 'invalid-range-fixture',
      localePages: {
        en: {
          slug: catalogRouteSegment('invalid-range-fixture'),
          indexing: 'noindex',
        },
      },
      related: [],
      execution: {
        ...imageTool.execution,
        inputPolicy: { minimum: 2, maximum: 1, accepts: ['image'] },
      },
    } as CatalogDefinition;
    expect(() => validateCatalog([invalidRange], [])).toThrow(/input range/);

    const invalidArchetypeMode = {
      ...imageTool,
      entityId: 'invalid-archetype-mode',
      localePages: {
        en: {
          slug: catalogRouteSegment('invalid-archetype-mode'),
          indexing: 'noindex',
        },
      },
      related: [],
      execution: {
        ...imageTool.execution,
        mediaMode: 'video',
        videoOperation: 'generate',
      },
    } as CatalogDefinition;
    expect(() => validateCatalog([invalidArchetypeMode], [])).toThrow(
      /archetype\/media mode mismatch/
    );

    const invalidOperation = {
      ...textToVideoTool,
      entityId: 'invalid-operation',
      localePages: {
        en: {
          slug: catalogRouteSegment('invalid-operation'),
          indexing: 'noindex',
        },
      },
      related: [],
      execution: { ...textToVideoTool.execution, videoOperation: 'extend' },
    } as CatalogDefinition;
    expect(() => validateCatalog([invalidOperation], [])).toThrow(
      /archetype\/video operation mismatch/
    );

    const widenedInput = {
      ...imageToVideoTool,
      entityId: 'widened-input',
      localePages: {
        en: {
          slug: catalogRouteSegment('widened-input'),
          indexing: 'noindex',
        },
      },
      related: [],
      execution: {
        ...imageToVideoTool.execution,
        inputPolicy: { minimum: 0, maximum: 3, accepts: ['image'] },
      },
    } as CatalogDefinition;
    expect(() => validateCatalog([widenedInput], [])).toThrow(
      /input policy widens runtime/
    );
  });

  it('validates legacy sources and current-locale redirect targets', () => {
    const oldSlug = catalogRouteSegment('old-image-generator');
    expect(() =>
      validateCatalog(catalogFixtures, [
        {
          kind: 'tool',
          locale: 'en',
          fromSlug: oldSlug,
          action: 'redirect',
          toEntityId: 'sample-image-generator',
        },
      ])
    ).not.toThrow();
    expect(() =>
      validateCatalog(catalogFixtures, [
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
      validateCatalog(catalogFixtures, [
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
