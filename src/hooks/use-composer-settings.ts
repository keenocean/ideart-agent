import { useCallback, useEffect, useState } from 'react';

import {
  defaultComposerSettings,
  isImageModelOptionValue,
  isModelOptionValue,
  normalizeComposerSettings,
  type AgentComposerSettings,
} from '@/lib/agent-settings';

export const COMPOSER_SETTINGS_STORAGE_KEY = 'agent-saas:composer-settings';

export function readStoredComposerSettings(
  storage: Pick<Storage, 'getItem'> = window.localStorage
): AgentComposerSettings | null {
  try {
    const raw = storage.getItem(COMPOSER_SETTINGS_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<AgentComposerSettings>;
    // A model that's since been retired must not resurrect itself.
    if (!isModelOptionValue(parsed?.modelOption)) return null;
    if (
      parsed.imageModelOption !== undefined &&
      !isImageModelOptionValue(parsed.imageModelOption)
    )
      return null;
    return normalizeComposerSettings(parsed);
  } catch {
    return null;
  }
}

export function persistComposerSettings(
  settings: AgentComposerSettings,
  storage: Pick<Storage, 'setItem'> = window.localStorage
): void {
  storage.setItem(COMPOSER_SETTINGS_STORAGE_KEY, JSON.stringify(settings));
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
  (settings: AgentComposerSettings) => void,
] {
  const [settings, setSettings] = useState<AgentComposerSettings>(
    defaultComposerSettings
  );

  useEffect(() => {
    const stored = readStoredComposerSettings();
    if (stored) setSettings(stored);
  }, []);

  const update = useCallback((next: AgentComposerSettings) => {
    setSettings(next);
    try {
      persistComposerSettings(next);
    } catch {
      // storage unavailable (private mode, quota) — the choice just won't stick
    }
  }, []);

  const updateTemporary = useCallback((next: AgentComposerSettings) => {
    setSettings(normalizeComposerSettings(next));
  }, []);

  return [settings, update, updateTemporary];
}
