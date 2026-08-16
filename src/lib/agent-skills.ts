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

export interface AgentSkillPreviewMetadata {
  bestFor: string[];
  style: string[];
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
  const identity = `${skill.name} ${skill.label}`;
  const identityCategory = CATEGORY_PATTERNS.find(({ pattern }) =>
    pattern.test(identity)
  )?.category;
  if (identityCategory) return identityCategory;

  return (
    CATEGORY_PATTERNS.find(({ pattern }) =>
      pattern.test(skill.description ?? '')
    )?.category ?? 'other'
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

const BEST_FOR_BY_CATEGORY = {
  ugc: [
    'TikTok UGC',
    'Instagram Reels',
    'testimonial videos',
    'POV creator ads',
  ],
  video: ['video ads', 'TikTok', 'Instagram Reels', 'YouTube Shorts'],
  static: ['image ads', 'social feeds', 'display creative', 'carousels'],
  product: ['ecommerce', 'product launches', 'marketplace ads', 'retail'],
  other: ['creative workflows', 'campaign concepts', 'production briefs'],
} satisfies Record<AgentSkillCategory, string[]>;

const STYLE_TAG_RULES: ReadonlyArray<{
  pattern: RegExp;
  label: string;
}> = [
  { pattern: /\b(vertical|9:16)\b/i, label: 'vertical 9:16' },
  {
    pattern: /\b(creator[- ]to[- ]camera|talking[- ]head|spokesperson)\b/i,
    label: 'creator-to-camera',
  },
  { pattern: /\b(fast[- ]?cuts?|rapid[- ]?cuts?)\b/i, label: 'fast cuts' },
  {
    pattern: /\b(iphone|authentic texture|phone[- ]shot)\b/i,
    label: 'authentic iPhone texture',
  },
  {
    pattern: /\b(cinematic|film[- ]look|film look)\b/i,
    label: 'cinematic',
  },
  { pattern: /\b(animated|animation|3d)\b/i, label: 'animated' },
  { pattern: /\b(luxury|editorial|premium)\b/i, label: 'editorial' },
  { pattern: /\b(split[- ]screen)\b/i, label: 'split screen' },
  { pattern: /\b(static|image ad|carousel)\b/i, label: 'static composition' },
];

const FALLBACK_STYLE_BY_CATEGORY = {
  ugc: ['authentic', 'creator-led'],
  video: ['story-driven', 'motion-first'],
  static: ['feed-native', 'graphic-led'],
  product: ['product-led', 'conversion-focused'],
  other: ['guided workflow'],
} satisfies Record<AgentSkillCategory, string[]>;

export function getAgentSkillPreviewMetadata(
  skill: AgentPromptSkill
): AgentSkillPreviewMetadata {
  const category = classifyAgentPromptSkill(skill);
  const searchable = `${skill.name} ${skill.label} ${skill.description ?? ''}`;
  const derivedStyle = STYLE_TAG_RULES.filter(({ pattern }) =>
    pattern.test(searchable)
  ).map(({ label }) => label);

  return {
    bestFor: BEST_FOR_BY_CATEGORY[category].slice(0, 4),
    style: (derivedStyle.length > 0
      ? derivedStyle
      : FALLBACK_STYLE_BY_CATEGORY[category]
    ).slice(0, 4),
  };
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
