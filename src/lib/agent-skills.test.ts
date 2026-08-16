import { describe, expect, it } from 'vitest';

import {
  classifyAgentPromptSkill,
  filterAgentPromptSkills,
  normalizeAgentPromptSkills,
  normalizeSavedSkillNames,
  skillCardTone,
} from './agent-skills';

describe('normalizeAgentPromptSkills', () => {
  it('normalizes skill API rows with stable names', () => {
    expect(
      normalizeAgentPromptSkills([
        { name: 'cinematic', title: 'Cinematic', summary: 'Film look' },
        { name: 'rewrite', title: 'Rewrite' },
        { name: '../bad' },
        { name: 'cinematic', title: 'Duplicate' },
      ])
    ).toEqual([
      { name: 'cinematic', label: 'Cinematic', description: 'Film look' },
      { name: 'rewrite', label: 'Rewrite', description: undefined },
    ]);
  });

  it('classifies catalog entries into stable creative groups', () => {
    expect(
      classifyAgentPromptSkill({
        name: 'ugc-curiosity-hook',
        label: 'UGC Curiosity Hook',
        description: 'A creator-to-camera testimonial pattern',
      })
    ).toBe('ugc');
    expect(
      classifyAgentPromptSkill({
        name: 'pregnancy-static-ad',
        label: 'Pregnancy Static Ad',
        description: 'A Meta image ad pattern',
      })
    ).toBe('static');
    expect(
      classifyAgentPromptSkill({
        name: 'luxury-product-reveal',
        label: 'Luxury Product Reveal',
        description: 'A premium product showcase',
      })
    ).toBe('product');
    expect(
      classifyAgentPromptSkill({
        name: 'ads-cinematic-skill',
        label: 'Ads Cinematic',
        description: 'A film-look direction system',
      })
    ).toBe('video');
  });

  it('filters by category and a case-insensitive text query', () => {
    const skills = normalizeAgentPromptSkills([
      {
        name: 'ugc-curiosity-hook',
        title: 'UGC Curiosity Hook',
        summary: 'Creator testimonial',
      },
      {
        name: 'ads-cinematic-skill',
        title: 'Ads Cinematic',
        summary: 'Premium film look',
      },
    ]);

    expect(
      filterAgentPromptSkills(skills, {
        category: 'ugc',
        query: 'TESTIMONIAL',
      }).map((skill) => skill.name)
    ).toEqual(['ugc-curiosity-hook']);
    expect(
      filterAgentPromptSkills(skills, {
        category: 'all',
        query: 'premium',
      }).map((skill) => skill.name)
    ).toEqual(['ads-cinematic-skill']);
  });

  it('normalizes saved skill storage and assigns deterministic cover tones', () => {
    expect(
      normalizeSavedSkillNames([
        'ugc-curiosity-hook',
        '../bad',
        'ugc-curiosity-hook',
        42,
      ])
    ).toEqual(['ugc-curiosity-hook']);
    expect(skillCardTone('ugc-curiosity-hook')).toBe(
      skillCardTone('ugc-curiosity-hook')
    );
    expect(skillCardTone('ugc-curiosity-hook')).toBeGreaterThanOrEqual(0);
    expect(skillCardTone('ugc-curiosity-hook')).toBeLessThan(6);
  });
});
