export interface AgentPromptSkill {
  name: string;
  label: string;
  description?: string;
}

export type AgentSkillCategory =
  | 'ugc'
  | 'video'
  | 'static'
  | 'product'
  | 'other';

export type AgentSkillCategoryFilter = AgentSkillCategory | 'all';

export interface AgentSkillResponseItem {
  name?: string;
  title?: string;
  summary?: string;
}

export interface AgentSkillDetailResponseItem {
  name: string;
  title: string;
  summary: string;
  instructions: string;
  referencePaths: string[];
}

function isValidSkillName(value: string): boolean {
  return /^[a-zA-Z0-9_.:-]+$/.test(value);
}

const CATEGORY_PATTERNS: ReadonlyArray<{
  category: AgentSkillCategory;
  pattern: RegExp;
}> = [
  {
    category: 'ugc',
    pattern:
      /\b(ugc|testimonial|creator|spokesperson|talking[- ]head|confessional)\b/i,
  },
  {
    category: 'static',
    pattern: /\b(static|image ad|carousel|poster|flyer|feed ad)\b/i,
  },
  {
    category: 'product',
    pattern:
      /\b(product|ecommerce|e-commerce|retail|listing|showcase|unboxing)\b/i,
  },
  {
    category: 'video',
    pattern:
      /\b(video|cinematic|film|reel|shorts?|motion|animated|animation|story)\b/i,
  },
];

export function classifyAgentPromptSkill(
  skill: AgentPromptSkill
): AgentSkillCategory {
  const searchable = `${skill.name} ${skill.label} ${skill.description ?? ''}`;
  return (
    CATEGORY_PATTERNS.find(({ pattern }) => pattern.test(searchable))
      ?.category ?? 'other'
  );
}

export function filterAgentPromptSkills(
  skills: readonly AgentPromptSkill[],
  { category, query }: { category: AgentSkillCategoryFilter; query: string }
): AgentPromptSkill[] {
  const normalizedQuery = query.trim().toLocaleLowerCase();
  return skills.filter((skill) => {
    if (category !== 'all' && classifyAgentPromptSkill(skill) !== category) {
      return false;
    }
    if (!normalizedQuery) return true;
    return `${skill.label} ${skill.description ?? ''} ${skill.name}`
      .toLocaleLowerCase()
      .includes(normalizedQuery);
  });
}

export function normalizeSavedSkillNames(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  const seen = new Set<string>();
  return value.flatMap((item) => {
    if (typeof item !== 'string' || !isValidSkillName(item) || seen.has(item)) {
      return [];
    }
    seen.add(item);
    return [item];
  });
}

/** Stable cover selection without shipping a cover image for every skill. */
export function skillCardTone(name: string): number {
  let hash = 0;
  for (const character of name) {
    hash = (hash * 31 + character.charCodeAt(0)) >>> 0;
  }
  return hash % 6;
}

export function normalizeAgentPromptSkills(
  skills: readonly AgentSkillResponseItem[]
): AgentPromptSkill[] {
  const seen = new Set<string>();
  return skills.flatMap((skill) => {
    const name = skill.name?.trim();
    if (!name || !isValidSkillName(name) || seen.has(name)) {
      return [];
    }
    seen.add(name);
    return [
      {
        name,
        label: skill.title?.trim() || name,
        description: skill.summary?.trim() || undefined,
      },
    ];
  });
}
