import { describe, expect, it } from 'vitest';

import modelCatalogSource from '../../../product/catalog/models.json';
import toolCatalogSource from '../../../product/catalog/tools.json';
import { parseProductCatalog } from './product-catalog';

function productSource() {
  return {
    tools: structuredClone(toolCatalogSource),
    models: structuredClone(modelCatalogSource),
  };
}

function fixtureSource() {
  return {
    tools: {
      schemaVersion: 1,
      tools: [
        {
          kind: 'tool',
          entityId: 'fixture-tool',
          publication: 'hidden',
          availability: 'beta',
          related: ['fixture-model'],
          archetype: 'image-generator',
          execution: {
            kind: 'agent-preset',
            mediaMode: 'image',
            inputPolicy: {
              minimum: 0,
              maximum: 1,
              accepts: ['image'],
            },
          },
        },
      ],
    },
    models: {
      schemaVersion: 1,
      models: [
        {
          kind: 'model',
          entityId: 'fixture-model',
          publication: 'hidden',
          availability: 'beta',
          related: ['fixture-tool'],
          modality: 'image',
          runtimeModelKey: 'gpt-image-2',
        },
      ],
    },
  };
}

describe('Product Catalog JSON', () => {
  it('keeps the checked-in Ideart Product Catalog empty', () => {
    const parsed = parseProductCatalog(productSource());

    expect(parsed).toEqual({ tools: [], models: [] });
  });

  it('accepts empty tool and model Catalogs', () => {
    expect(
      parseProductCatalog({
        tools: { schemaVersion: 1, tools: [] },
        models: { schemaVersion: 1, models: [] },
      })
    ).toEqual({ tools: [], models: [] });
  });

  it('requires the supported schema version and a strict file envelope', () => {
    const source = productSource();
    expect(() =>
      parseProductCatalog({
        ...source,
        tools: { ...source.tools, schemaVersion: 2 },
      })
    ).toThrow();
    expect(() =>
      parseProductCatalog({
        ...source,
        models: { ...source.models, generatedCode: true },
      })
    ).toThrow();
  });

  it('rejects duplicate entries and broken related references', () => {
    const duplicated = fixtureSource();
    duplicated.tools.tools.push(structuredClone(duplicated.tools.tools[0]!));
    expect(() => parseProductCatalog(duplicated)).toThrow(
      /Duplicate Catalog entityId/
    );

    const brokenReference = fixtureSource();
    brokenReference.tools.tools[0]!.related = ['missing-entry'];
    expect(() => parseProductCatalog(brokenReference)).toThrow(
      /Unknown related Catalog entry/
    );
  });

  it('rejects unknown executable model references', () => {
    const source = fixtureSource();
    source.models.models[0]!.runtimeModelKey = 'not-a-runtime-model';

    expect(() => parseProductCatalog(source)).toThrow(
      /Unknown image runtime model/
    );
  });

  it('rejects unknown JSON fields at the structural boundary', () => {
    const source = fixtureSource();
    const invalid = source.tools
      .tools[0]! as (typeof source.tools.tools)[number] & {
      reactComponent?: string;
    };
    invalid.reactComponent = 'ArbitraryCode';

    expect(() => parseProductCatalog(source)).toThrow();
  });
});
