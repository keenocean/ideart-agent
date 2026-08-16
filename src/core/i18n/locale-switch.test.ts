import { describe, expect, it } from 'vitest';

import { getLocaleSwitchDestination } from './locale-switch';

describe('locale switch destination', () => {
  it('keeps the current route when the translation exists', () => {
    expect(
      getLocaleSwitchDestination('zh', {
        availableLocales: ['en', 'zh'],
        fallbackHref: '/blog',
      })
    ).toBeUndefined();
  });

  it('uses the target locale directory when the translation is absent', () => {
    expect(
      getLocaleSwitchDestination('zh', {
        availableLocales: ['en'],
        fallbackHref: '/blog',
      })
    ).toBe('/blog');
  });

  it('uses the registered target path when translated slugs differ', () => {
    expect(
      getLocaleSwitchDestination('zh', {
        localeHrefs: {
          en: '/tools/english-tool',
          zh: '/tools/zhongwen-tool',
        },
        fallbackHref: '/tools',
      })
    ).toBe('/tools/zhongwen-tool');
  });

  it('preserves the default global language-switch behavior', () => {
    expect(getLocaleSwitchDestination('zh')).toBeUndefined();
  });
});
