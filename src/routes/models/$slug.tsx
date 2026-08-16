import { createFileRoute, notFound } from '@tanstack/react-router';

import { LocaleSwitchProvider } from '@/core/i18n/locale-switch';
import { envConfigs } from '@/config';
import { buildSeoHead } from '@/lib/seo';
import { getLocale } from '@/paraglide/runtime.js';
import { Footer } from '@/blocks/footer';
import { Header } from '@/blocks/header';
import { ModelDetail } from '@/blocks/model-detail';
import {
  getModelDetailRouteDataFn,
  getModelReadinessFn,
} from '@/content/models/server';

export const Route = createFileRoute('/models/$slug')({
  loader: async ({ params }) => {
    const locale = getLocale();
    const routeData = await getModelDetailRouteDataFn({
      data: { locale, slug: params.slug },
    });
    if (!routeData) throw notFound();
    const { page, directory } = routeData;
    const readiness = await getModelReadinessFn({
      data: { entityId: page.entityId },
    });
    return {
      page,
      readiness,
      seo: {
        kind: 'website' as const,
        title: page.content.seo.title,
        description: page.content.seo.description,
        canonical: { locale, path: page.path },
        alternates: page.alternates,
        indexing: page.indexing,
        breadcrumbs: [
          { name: envConfigs.app_name, route: { locale, path: '/' } },
          {
            name: directory.hero.title,
            route: { locale, path: '/models' },
          },
          {
            name: page.content.directory.title,
            route: { locale, path: page.path },
          },
        ],
        faq: page.content.faq.items,
      },
    };
  },
  head: ({ loaderData }) => (loaderData ? buildSeoHead(loaderData.seo) : {}),
  component: ModelPage,
});

function ModelPage() {
  const { page, readiness } = Route.useLoaderData();
  return (
    <LocaleSwitchProvider
      localeHrefs={Object.fromEntries(
        page.localeRoutes.map((route) => [route.locale, route.path])
      )}
      fallbackHref="/models"
    >
      <div className="bg-background text-foreground flex min-h-screen flex-col">
        <Header />
        <main className="flex-1">
          <ModelDetail page={page} readiness={readiness} />
        </main>
        <Footer />
      </div>
    </LocaleSwitchProvider>
  );
}
