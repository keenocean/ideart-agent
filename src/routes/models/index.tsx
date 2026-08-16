import { createFileRoute, notFound } from '@tanstack/react-router';

import { envConfigs } from '@/config';
import {
  getFixedLocalePage,
  getFixedRouteAlternates,
} from '@/config/seo/public-routes';
import { buildSeoHead } from '@/lib/seo';
import { getLocale } from '@/paraglide/runtime.js';
import { Footer } from '@/blocks/footer';
import { Header } from '@/blocks/header';
import { ModelDirectory } from '@/blocks/model-directory';
import { getModelDirectoryPageFn } from '@/content/models/server';

export const Route = createFileRoute('/models/')({
  loader: async () => {
    const locale = getLocale();
    const page = getFixedLocalePage('models', locale);
    if (!page) throw new Error(`Models is not registered for locale ${locale}`);
    const directory = await getModelDirectoryPageFn({ data: { locale } });
    if (!directory || directory.items.length === 0) throw notFound();
    return {
      directory,
      seo: {
        kind: 'website' as const,
        title: directory.seo.title.replace('{appName}', envConfigs.app_name),
        description: directory.seo.description,
        canonical: { locale, path: page.path },
        alternates: getFixedRouteAlternates('models', locale),
        indexing: page.indexing,
        breadcrumbs: [
          { name: envConfigs.app_name, route: { locale, path: '/' } },
          {
            name: directory.hero.title,
            route: { locale, path: page.path },
          },
        ],
      },
    };
  },
  head: ({ loaderData }) => (loaderData ? buildSeoHead(loaderData.seo) : {}),
  component: ModelsPage,
});

function ModelsPage() {
  const { directory } = Route.useLoaderData();
  return (
    <div className="bg-background text-foreground flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <ModelDirectory {...directory.hero} items={directory.items} />
      </main>
      <Footer />
    </div>
  );
}
