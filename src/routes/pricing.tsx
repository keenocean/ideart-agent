import { createFileRoute } from '@tanstack/react-router';

import {
  getFixedLocalePage,
  getFixedRouteAlternates,
} from '@/config/seo/public-routes';
import { buildSeoHead } from '@/lib/seo';
import { m } from '@/paraglide/messages.js';
import { getLocale } from '@/paraglide/runtime.js';
import { Footer } from '@/blocks/footer';
import { Header } from '@/blocks/header';
import { Pricing } from '@/blocks/pricing';

export const Route = createFileRoute('/pricing')({
  loader: () => {
    const locale = getLocale();
    const page = getFixedLocalePage('pricing', locale);
    if (!page)
      throw new Error(`Pricing is not registered for locale ${locale}`);
    return {
      locale,
      title: m['landing.pricing.title']({}, { locale }),
      description: m['landing.pricing.description']({}, { locale }),
      path: page.path,
      indexing: page.indexing,
      alternates: getFixedRouteAlternates('pricing', locale),
    };
  },
  head: ({ loaderData }) => {
    if (!loaderData) return {};
    const { title, description, locale, path, indexing, alternates } =
      loaderData;
    return buildSeoHead({
      kind: 'website',
      title,
      description,
      canonical: { locale, path },
      alternates,
      indexing,
    });
  },
  component: PricingPage,
});

function PricingPage() {
  return (
    <div className="bg-background text-foreground flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <Pricing />
      </main>
      <Footer />
    </div>
  );
}
