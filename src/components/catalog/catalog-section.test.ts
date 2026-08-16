import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { CatalogSection } from '@/components/catalog/catalog-section';

describe('CatalogSection', () => {
  it('applies the shared plain section rhythm by default', () => {
    const html = renderToStaticMarkup(
      createElement(CatalogSection, { id: 'examples', children: 'content' })
    );

    expect(html).toContain('id="examples"');
    expect(html).toContain('px-4 py-16 sm:px-6');
    expect(html).toContain('max-w-6xl');
    expect(html).not.toContain('bg-muted/35');
  });

  it('limits alternate surfaces and widths to named variants', () => {
    const html = renderToStaticMarkup(
      createElement(CatalogSection, {
        surface: 'muted',
        width: 'narrow',
        children: 'content',
      })
    );

    expect(html).toContain('bg-muted/35');
    expect(html).toContain('border-y');
    expect(html).toContain('max-w-5xl');
  });

  it('keeps marketing Blocks from reintroducing page-level style drift', () => {
    const blocksDirectory = join(process.cwd(), 'src/blocks');
    const marketingBlockName =
      /^(?:home-|tool-|model-|use-cases|how-it-works|featured-catalog)/;
    const forbiddenOneOffStyle =
      /\b(?:bg-muted\/(?:35|45)|(?:sm:)?py-(?:20|24|28)|max-w-7xl)\b/;
    const violations = readdirSync(blocksDirectory)
      .filter((name) => name.endsWith('.tsx') && marketingBlockName.test(name))
      .filter((name) =>
        forbiddenOneOffStyle.test(
          readFileSync(join(blocksDirectory, name), 'utf8')
        )
      );

    expect(violations).toEqual([]);
  });
});
