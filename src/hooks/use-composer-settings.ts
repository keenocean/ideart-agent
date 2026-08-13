import { useCallback, useEffect, useState } from 'react';

import {
  defaultComposerSettings,
  isModelOptionValue,
  normalizeComposerSettings,
  type AgentComposerSettings,
} from '@/lib/agent-settings';

const STORAGE_KEY = 'ideart-agent:composer-settings';

function readStored(): AgentComposerSettings | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<AgentComposerSettings>;
    // A model that's since been retired must not resurrect itself.
    if (!isModelOptionValue(parsed?.modelOption)) return null;
    return normalizeComposerSettings(parsed);
  } catch {
    return null;
  }
}

/**
 * Composer settings (model, aspect ratio, resolution, duration) that outlive
 * a reload.
 *
 * Starts from the defaults so server and client render the same markup, then
 * swaps in the stored choice right after mount.
 */
export function useComposerSettings(): [
  AgentComposerSettings,
  (settings: AgentComposerSettings) => void,
] {
  const [settings, setSettings] = useState<AgentComposerSettings>(
    defaultComposerSettings
  );

  useEffect(() => {
    const stored = readStored();
    if (stored) setSettings(stored);
  }, []);

  const update = useCallback((next: AgentComposerSettings) => {
    setSettings(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // storage unavailable (private mode, quota) — the choice just won't stick
    }
  }, []);

  return [settings, update];
}
