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

describe('Product Catalog JSON', () => {
  it('parses the checked-in product Catalog', () => {
    const parsed = parseProductCatalog(productSource());

    expect(parsed.tools.map((entry) => entry.entityId)).toEqual([
      'ai-image-generator',
      'ai-image-editor',
      'text-to-video',
      'image-to-video',
      'reference-to-video',
      'background-remover',
    ]);
    expect(parsed.models.map((entry) => entry.entityId)).toEqual([
      'gpt-image-2',
      'minimax-h3',
      'seedance-2-5',
      'seedance-2-0',
    ]);
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
    const duplicated = productSource();
    duplicated.tools.tools.push(structuredClone(duplicated.tools.tools[0]!));
    expect(() => parseProductCatalog(duplicated)).toThrow(
      /Duplicate Catalog entityId/
    );

    const brokenReference = productSource();
    brokenReference.tools.tools[0]!.related = ['missing-entry'];
    expect(() => parseProductCatalog(brokenReference)).toThrow(
      /Unknown related Catalog entry/
    );
  });

  it('rejects unknown executable model references', () => {
    const source = productSource();
    source.models.models[0]!.runtimeModelKey = 'not-a-runtime-model';

    expect(() => parseProductCatalog(source)).toThrow(
      /Unknown image runtime model/
    );
  });

  it('rejects unknown JSON fields at the structural boundary', () => {
    const source = productSource();
    const invalid = source.tools
      .tools[0]! as (typeof source.tools.tools)[number] & {
      reactComponent?: string;
    };
    invalid.reactComponent = 'ArbitraryCode';

    expect(() => parseProductCatalog(source)).toThrow();
  });
});
