import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'agent-saas:composer-skill';

function readStoredSkillName(): string | undefined {
  try {
    const value = window.sessionStorage.getItem(STORAGE_KEY);
    return value || undefined;
  } catch {
    return undefined;
  }
}

export function useComposerSkill(): [
  string | undefined,
  (skillName: string | undefined) => void,
] {
  const [skillName, setSkillName] = useState<string | undefined>();

  useEffect(() => {
    setSkillName(readStoredSkillName());
  }, []);

  const update = useCallback((next: string | undefined) => {
    const normalized = next?.trim() || undefined;
    setSkillName(normalized);
    try {
      if (normalized) window.sessionStorage.setItem(STORAGE_KEY, normalized);
      else window.sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      // storage unavailable — the choice just won't persist for this session
    }
  }, []);

  return [skillName, update];
}
