import { createServerFn } from '@tanstack/react-start';

import { isSupportedLocale, type AppLocale } from '@/config/locale';

function toolLocale(data: { locale: string }): AppLocale {
  if (!isSupportedLocale(data.locale)) {
    throw new Error('Invalid tool locale');
  }
  return data.locale;
}

export const getToolDirectoryPageFn = createServerFn()
  .inputValidator((data: { locale: string }) => ({
    locale: toolLocale(data),
  }))
  .handler(async ({ data }) => {
    const { loadToolDirectoryPage } = await import('./listing');
    return loadToolDirectoryPage(data.locale);
  });

export const getToolDetailRouteDataFn = createServerFn()
  .inputValidator((data: { locale: string; slug: string }) => {
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(data.slug)) {
      throw new Error('Invalid tool slug');
    }
    return { locale: toolLocale(data), slug: data.slug };
  })
  .handler(async ({ data }) => {
    const { loadToolDetailPage, loadToolDirectoryPage } =
      await import('./listing');
    const page = await loadToolDetailPage(data.locale, data.slug);
    if (!page) return null;
    const directory = await loadToolDirectoryPage(data.locale);
    if (!directory) {
      const { MarketingContentUnavailableError } =
        await import('../marketing/registry');
      throw new MarketingContentUnavailableError(
        `Parent tools directory is not published for ${data.locale}`
      );
    }
    return { page, directory };
  });

export const getToolReadinessFn = createServerFn()
  .inputValidator((data: { entityId: string }) => {
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(data.entityId)) {
      throw new Error('Invalid tool entity id');
    }
    return data;
  })
  .handler(async ({ data }) => {
    const { getToolDeploymentReadiness } =
      await import('@/modules/agent/readiness');
    return getToolDeploymentReadiness(data.entityId);
  });
