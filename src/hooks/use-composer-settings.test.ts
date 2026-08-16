import { describe, expect, it } from 'vitest';

import { defaultComposerSettings } from '@/lib/agent-settings';

import {
  persistComposerSettings,
  readStoredComposerSettings,
} from './use-composer-settings';

function memoryStorage() {
  const values = new Map<string, string>();
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
  };
}

describe('composer settings persistence actions', () => {
  it('writes only when the explicit persistence action is called', () => {
    const storage = memoryStorage();
    expect(readStoredComposerSettings(storage)).toBeNull();
    const settings = {
      ...defaultComposerSettings(),
      mediaMode: 'image' as const,
    };
    persistComposerSettings(settings, storage);
    expect(readStoredComposerSettings(storage)).toEqual(settings);
  });

  it('ignores retired image or video picker keys', () => {
    const videoStorage = memoryStorage();
    videoStorage.setItem(
      'agent-saas:composer-settings',
      JSON.stringify({
        ...defaultComposerSettings(),
        modelOption: 'retired-video',
      })
    );
    expect(readStoredComposerSettings(videoStorage)).toBeNull();

    const imageStorage = memoryStorage();
    imageStorage.setItem(
      'agent-saas:composer-settings',
      JSON.stringify({
        ...defaultComposerSettings(),
        imageModelOption: 'retired-image',
      })
    );
    expect(readStoredComposerSettings(imageStorage)).toBeNull();
  });
});
