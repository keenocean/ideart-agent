import { createServerFn } from '@tanstack/react-start';

import { isSupportedLocale, type AppLocale } from '@/config/locale';

function homeLocale(data: { locale: string }): AppLocale {
  if (!isSupportedLocale(data.locale)) {
    throw new Error('Invalid homepage locale');
  }
  return data.locale;
}

export const getHomeProjectionFn = createServerFn()
  .inputValidator((data: { locale: string }) => ({
    locale: homeLocale(data),
  }))
  .handler(async ({ data }) => {
    const { MarketingContentUnavailableError } =
      await import('@/content/marketing/registry');
    const { getDefaultMarketingContentRegistry } =
      await import('@/content/marketing/store');
    const registry = await getDefaultMarketingContentRegistry();
    const projection = await registry.getHomeProjection(data.locale);
    if (!projection) {
      throw new MarketingContentUnavailableError(
        `Homepage projection is absent from the pinned release: ${data.locale}`
      );
    }
    return projection;
  });
