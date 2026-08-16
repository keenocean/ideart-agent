import { createFileRoute } from '@tanstack/react-router';

import {
  getFixedLocalePage,
  getFixedRouteAlternates,
} from '@/config/seo/public-routes';
import { buildSeoHead } from '@/lib/seo';
import { m } from '@/paraglide/messages.js';
import { getLocale } from '@/paraglide/runtime.js';
import { Blog } from '@/blocks/blog';
import { FeaturedCatalog } from '@/blocks/featured-catalog';
import { Footer } from '@/blocks/footer';
import { Header } from '@/blocks/header';
import { HomeCTA } from '@/blocks/home-cta';
import { HomeFAQ } from '@/blocks/home-faq';
import { HomeFeatures } from '@/blocks/home-features';
import { HomeGallery } from '@/blocks/home-gallery';
import { HomeHero } from '@/blocks/home-hero';
import { HowItWorks } from '@/blocks/how-it-works';
import { SupportWidget } from '@/blocks/support-widget';
import { UseCases } from '@/blocks/use-cases';
import { getHomeProjectionFn } from '@/content/home/server';
import { getBlogPostsFn } from '@/content/posts/server';

function HomePage() {
  const { home, posts } = Route.useLoaderData();

  return (
    <div className="bg-background text-foreground flex min-h-screen flex-col">
      <Header />
      <main className="flex flex-1 flex-col">
        <HomeHero />
        <HomeGallery media={home.media.examples} />
        <HomeFeatures />
        <UseCases media={home.media.useCases} />
        <HowItWorks />
        <FeaturedCatalog
          tools={home.featured.tools}
          models={home.featured.models}
        />
        <HomeFAQ />
        {posts.length > 0 && <Blog posts={posts} />}
        <HomeCTA />
      </main>
      <Footer />
      <SupportWidget />
    </div>
  );
}

export const Route = createFileRoute('/')({
  loader: async () => {
    const locale = getLocale();
    const page = getFixedLocalePage('home', locale);
    if (!page) throw new Error(`Home is not registered for locale ${locale}`);
    const [home, posts] = await Promise.all([
      getHomeProjectionFn({ data: { locale } }),
      getBlogPostsFn({ data: { locale, limit: 3 } }).catch(() => []),
    ]);
    const faq = [
      {
        question: m['landing.faq.q_1']({}, { locale }),
        answer: m['landing.faq.a_1']({}, { locale }),
      },
      {
        question: m['landing.faq.q_2']({}, { locale }),
        answer: m['landing.faq.a_2']({}, { locale }),
      },
      {
        question: m['landing.faq.q_3']({}, { locale }),
        answer: m['landing.faq.a_3']({}, { locale }),
      },
      {
        question: m['landing.faq.q_4']({}, { locale }),
        answer: m['landing.faq.a_4']({}, { locale }),
      },
      {
        question: m['landing.faq.q_5']({}, { locale }),
        answer: m['landing.faq.a_5']({}, { locale }),
      },
      {
        question: m['landing.faq.q_6']({}, { locale }),
        answer: m['landing.faq.a_6']({}, { locale }),
      },
    ];
    return {
      home,
      posts,
      seo: {
        kind: 'website' as const,
        title: m['landing.seo.title']({}, { locale }),
        description: m['landing.seo.description']({}, { locale }),
        canonical: { locale, path: page.path },
        alternates: getFixedRouteAlternates('home', locale),
        indexing: page.indexing,
        image: {
          src: home.media.og.url,
          alt: home.media.og.alt,
          width: home.media.og.width,
          height: home.media.og.height,
          type: home.media.og.mimeType,
        },
        faq,
      },
    };
  },
  head: ({ loaderData }) => (loaderData ? buildSeoHead(loaderData.seo) : {}),
  component: HomePage,
});
