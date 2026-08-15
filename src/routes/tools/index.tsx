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
import { ToolDirectory } from '@/blocks/tool-directory';
import { getToolDirectoryPageFn } from '@/content/tools/server';

export const Route = createFileRoute('/tools/')({
  loader: async () => {
    const locale = getLocale();
    const page = getFixedLocalePage('tools', locale);
    if (!page) throw new Error(`Tools is not registered for locale ${locale}`);
    const directory = await getToolDirectoryPageFn({ data: { locale } });
    if (!directory || directory.items.length === 0) throw notFound();
    const title = directory.seo.title.replace('{appName}', envConfigs.app_name);
    const description = directory.seo.description;
    const directoryName = directory.hero.title;
    return {
      locale,
      directory,
      seo: {
        kind: 'website' as const,
        title,
        description,
        canonical: { locale, path: page.path },
        alternates: getFixedRouteAlternates('tools', locale),
        indexing: page.indexing,
        breadcrumbs: [
          {
            name: envConfigs.app_name,
            route: { locale, path: '/' },
          },
          {
            name: directoryName,
            route: { locale, path: page.path },
          },
        ],
      },
    };
  },
  head: ({ loaderData }) => (loaderData ? buildSeoHead(loaderData.seo) : {}),
  component: ToolsPage,
});

function ToolsPage() {
  const { directory } = Route.useLoaderData();
  return (
    <div className="bg-background text-foreground flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <ToolDirectory
          items={directory.items}
          title={directory.hero.title}
          description={directory.hero.description}
        />
      </main>
      <Footer />
    </div>
  );
}
