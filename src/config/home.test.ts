import { describe, expect, it } from 'vitest';

import {
  HOME_SCHEMA_VERSION,
  HOME_SECTION_IDS,
  homeConfig,
  parseHomeConfig,
} from './home';

const canonicalSections = HOME_SECTION_IDS.map((id) => ({
  id,
  enabled: true,
}));

describe('home Product Pack config', () => {
  it('keeps Ideart on its existing Hero and Blog homepage', () => {
    expect(homeConfig.schemaVersion).toBe(HOME_SCHEMA_VERSION);
    expect(homeConfig.sections.map(({ id }) => id)).toEqual(HOME_SECTION_IDS);
    expect(
      homeConfig.sections.filter(({ enabled }) => enabled).map(({ id }) => id)
    ).toEqual(['hero', 'blog']);
    expect(homeConfig.blogPostLimit).toBe(3);
  });

  it('only exposes sections backed by Ideart zero-config blocks', () => {
    expect(HOME_SECTION_IDS).toEqual([
      'hero',
      'stats',
      'gallery',
      'features',
      'models',
      'pricing',
      'faq',
      'blog',
      'cta',
    ]);
  });

  it('allows Product Pack JSON to reorder and disable known sections', () => {
    const sections = canonicalSections.toReversed();
    sections[0] = { ...sections[0], enabled: false };

    expect(
      parseHomeConfig({
        schemaVersion: HOME_SCHEMA_VERSION,
        sections,
        blogPostLimit: 6,
      }).sections
    ).toEqual(sections);
  });

  it('rejects component paths, props, unknown sections and unknown root keys', () => {
    expect(() =>
      parseHomeConfig({
        schemaVersion: HOME_SCHEMA_VERSION,
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
        schemaVersion: HOME_SCHEMA_VERSION,
        sections: canonicalSections.map((section, index) =>
          index === 0 ? { ...section, id: 'custom' } : section
        ),
        blogPostLimit: 3,
      })
    ).toThrow();
    expect(() =>
      parseHomeConfig({
        schemaVersion: HOME_SCHEMA_VERSION,
        sections: canonicalSections,
        blogPostLimit: 3,
        componentRegistry: {},
      })
    ).toThrow();
  });

  it('requires every closed-registry section exactly once', () => {
    expect(() =>
      parseHomeConfig({
        schemaVersion: HOME_SCHEMA_VERSION,
        sections: canonicalSections.slice(0, -1),
        blogPostLimit: 3,
      })
    ).toThrow();
    expect(() =>
      parseHomeConfig({
        schemaVersion: HOME_SCHEMA_VERSION,
        sections: [...canonicalSections.slice(0, -1), canonicalSections[0]],
        blogPostLimit: 3,
      })
    ).toThrow(/Duplicate home section|Missing home section/);
  });

  it('bounds the Blog post limit', () => {
    for (const blogPostLimit of [0, 1.5, 13]) {
      expect(() =>
        parseHomeConfig({
          schemaVersion: HOME_SCHEMA_VERSION,
          sections: canonicalSections,
          blogPostLimit,
        })
      ).toThrow();
    }
  });

  it('requires the supported Product Pack schema version', () => {
    for (const schemaVersion of [undefined, 0, 1, 3]) {
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
