import { useCallback, useEffect, useMemo, useState } from 'react';

import { normalizeSavedSkillNames } from '@/lib/agent-skills';

const STORAGE_KEY = 'ideart-agent:saved-skills';

function readSavedSkills(): string[] {
  try {
    return normalizeSavedSkillNames(
      JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? '[]')
    );
  } catch {
    return [];
  }
}

export function useSavedAgentSkills() {
  const [savedNames, setSavedNames] = useState<string[]>([]);

  useEffect(() => {
    setSavedNames(readSavedSkills());
  }, []);

  const saved = useMemo(() => new Set(savedNames), [savedNames]);
  const toggle = useCallback((name: string) => {
    setSavedNames((current) => {
      const next = current.includes(name)
        ? current.filter((item) => item !== name)
        : [...current, name];
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        // Local persistence is optional; the current view still updates.
      }
      return next;
    });
  }, []);

  return { saved, savedNames, toggle };
}
