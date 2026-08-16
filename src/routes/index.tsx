import { Fragment, type ReactNode } from 'react';
import { createFileRoute } from '@tanstack/react-router';

import { homeConfig, type HomeSectionId } from '@/config/home';
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

function isHomeSectionEnabled(sectionId: HomeSectionId): boolean {
  return homeConfig.sections.some(
    (section) => section.id === sectionId && section.enabled
  );
}

function HomePage() {
  const { home, posts } = Route.useLoaderData();
  const sectionRegistry = {
    hero: <HomeHero />,
    gallery: <HomeGallery media={home.media.examples} />,
    features: <HomeFeatures />,
    useCases: <UseCases media={home.media.useCases} />,
    howItWorks: <HowItWorks />,
    featuredCatalog: (
      <FeaturedCatalog
        tools={home.featured.tools}
        models={home.featured.models}
      />
    ),
    faq: <HomeFAQ />,
    blog: posts.length > 0 ? <Blog posts={posts} /> : null,
    cta: <HomeCTA />,
  } satisfies Record<HomeSectionId, ReactNode>;

  return (
    <div className="bg-background text-foreground flex min-h-screen flex-col">
      <Header />
      <main className="flex flex-1 flex-col">
        {homeConfig.sections.map((section) =>
          section.enabled ? (
            <Fragment key={section.id}>{sectionRegistry[section.id]}</Fragment>
          ) : null
        )}
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
    const blogEnabled = isHomeSectionEnabled('blog');
    const [home, posts] = await Promise.all([
      getHomeProjectionFn({ data: { locale } }),
      blogEnabled
        ? getBlogPostsFn({
            data: { locale, limit: homeConfig.blogPostLimit },
          }).catch(() => [])
        : Promise.resolve([]),
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
        faq: isHomeSectionEnabled('faq') ? faq : undefined,
      },
    };
  },
  head: ({ loaderData }) => (loaderData ? buildSeoHead(loaderData.seo) : {}),
  component: HomePage,
});
