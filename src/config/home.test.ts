import { describe, expect, it } from 'vitest';

import { HOME_SECTION_IDS, homeConfig, parseHomeConfig } from './home';

const canonicalSections = HOME_SECTION_IDS.map((id) => ({
  id,
  enabled: true,
}));

describe('home Product Pack config', () => {
  it('keeps the existing visual order and Blog limit by default', () => {
    expect(homeConfig).toEqual({
      schemaVersion: 1,
      sections: canonicalSections,
      blogPostLimit: 3,
    });
  });

  it('allows Product Pack JSON to reorder and disable known sections', () => {
    const sections = canonicalSections.toReversed();
    sections[0] = { ...sections[0], enabled: false };

    expect(
      parseHomeConfig({ schemaVersion: 1, sections, blogPostLimit: 6 }).sections
    ).toEqual(sections);
  });

  it('rejects component paths, props, unknown sections and unknown root keys', () => {
    expect(() =>
      parseHomeConfig({
        schemaVersion: 1,
        sections: canonicalSections.map((section, index) =>
          index === 0
            ? { ...section, component: '@/blocks/custom', props: {} }
            : section
        ),
        blogPostLimit: 3,
      })
    ).toThrow();
    expect(() =>
      parseHomeConfig({
        schemaVersion: 1,
        sections: canonicalSections.map((section, index) =>
          index === 0 ? { ...section, id: 'custom' } : section
        ),
        blogPostLimit: 3,
      })
    ).toThrow();
    expect(() =>
      parseHomeConfig({
        schemaVersion: 1,
        sections: canonicalSections,
        blogPostLimit: 3,
        componentRegistry: {},
      })
    ).toThrow();
  });

  it('requires every closed-registry section exactly once', () => {
    expect(() =>
      parseHomeConfig({
        schemaVersion: 1,
        sections: canonicalSections.slice(0, -1),
        blogPostLimit: 3,
      })
    ).toThrow();
    expect(() =>
      parseHomeConfig({
        schemaVersion: 1,
        sections: [...canonicalSections.slice(0, -1), canonicalSections[0]],
        blogPostLimit: 3,
      })
    ).toThrow(/Duplicate home section|Missing home section/);
  });

  it('bounds the Blog post limit', () => {
    for (const blogPostLimit of [0, 1.5, 13]) {
      expect(() =>
        parseHomeConfig({
          schemaVersion: 1,
          sections: canonicalSections,
          blogPostLimit,
        })
      ).toThrow();
    }
  });

  it('requires the supported Product Pack schema version', () => {
    for (const schemaVersion of [undefined, 0, 2]) {
      expect(() =>
        parseHomeConfig({
          schemaVersion,
          sections: canonicalSections,
          blogPostLimit: 3,
        })
      ).toThrow();
    }
  });
});
