export interface AgentPromptSkill {
  name: string;
  label: string;
  description?: string;
}

export interface AgentSkillResponseItem {
  name?: string;
  title?: string;
  summary?: string;
}

function isValidSkillName(value: string): boolean {
  return /^[a-zA-Z0-9_.:-]+$/.test(value);
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
