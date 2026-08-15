import { createFileRoute } from '@tanstack/react-router';

import { envConfigs } from '@/config';
import {
  getFixedLocalePage,
  getFixedRouteAlternates,
} from '@/config/seo/public-routes';
import { buildSeoHead } from '@/lib/seo';
import { m } from '@/paraglide/messages.js';
import { getLocale } from '@/paraglide/runtime.js';
import { Footer } from '@/blocks/footer';
import { Header } from '@/blocks/header';
import { ToolDirectory } from '@/blocks/tool-directory';
import { loadToolDirectoryItems } from '@/content/tools/listing';

export const Route = createFileRoute('/tools/')({
  loader: async () => {
    const locale = getLocale();
    const page = getFixedLocalePage('tools', locale);
    if (!page) throw new Error(`Tools is not registered for locale ${locale}`);
    const items = await loadToolDirectoryItems(locale);
    const title = m['tools.directory.seo_title'](
      { appName: envConfigs.app_name },
      { locale }
    );
    const description = m['tools.directory.seo_description']({}, { locale });
    const directoryName = m['tools.directory.title']({}, { locale });
    return {
      locale,
      items,
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
  const { items } = Route.useLoaderData();
  return (
    <div className="bg-background text-foreground flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <ToolDirectory items={items} />
      </main>
      <Footer />
    </div>
  );
}
