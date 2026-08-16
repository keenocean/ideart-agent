import { createServerFn } from '@tanstack/react-start';

import { isSupportedLocale, type AppLocale } from '@/config/locale';

function modelLocale(data: { locale: string }): AppLocale {
  if (!isSupportedLocale(data.locale)) throw new Error('Invalid model locale');
  return data.locale;
}

export const getModelDirectoryPageFn = createServerFn()
  .inputValidator((data: { locale: string }) => ({
    locale: modelLocale(data),
  }))
  .handler(async ({ data }) => {
    const { loadModelDirectoryPage } = await import('./listing');
    return loadModelDirectoryPage(data.locale);
  });

export const getModelDetailRouteDataFn = createServerFn()
  .inputValidator((data: { locale: string; slug: string }) => {
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(data.slug)) {
      throw new Error('Invalid model slug');
    }
    return { locale: modelLocale(data), slug: data.slug };
  })
  .handler(async ({ data }) => {
    const { loadModelDetailPage, loadModelDirectoryPage } =
      await import('./listing');
    const page = await loadModelDetailPage(data.locale, data.slug);
    if (!page) return null;
    const directory = await loadModelDirectoryPage(data.locale);
    if (!directory) throw new Error(`Models directory is not published`);
    return { page, directory };
  });

export const getModelReadinessFn = createServerFn()
  .inputValidator((data: { entityId: string }) => {
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(data.entityId)) {
      throw new Error('Invalid model entity id');
    }
    return data;
  })
  .handler(async ({ data }) => {
    const { getModelDeploymentReadiness } =
      await import('@/modules/agent/readiness');
    return getModelDeploymentReadiness(data.entityId);
  });
