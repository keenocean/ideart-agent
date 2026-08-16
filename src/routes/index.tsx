import { Fragment, useLayoutEffect, useRef, type ReactNode } from 'react';
import { createFileRoute, redirect } from '@tanstack/react-router';

import { useRouter } from '@/core/i18n/navigation';
import { envConfigs } from '@/config';
import { homeConfig, type HomeSectionId } from '@/config/home';
import { m } from '@/paraglide/messages.js';
import { getLocale, locales, localizeUrl } from '@/paraglide/runtime.js';
import { Blog } from '@/blocks/blog';
import { CTA } from '@/blocks/cta';
import { FAQ } from '@/blocks/faq';
import { Features } from '@/blocks/features';
import { Footer } from '@/blocks/footer';
import { Gallery } from '@/blocks/gallery';
import { Header } from '@/blocks/header';
import { Hero } from '@/blocks/hero';
import { ModelsStrip } from '@/blocks/models-strip';
import { Pricing } from '@/blocks/pricing';
import { Stats } from '@/blocks/stats';
import { SupportWidget } from '@/blocks/support-widget';
import { getBlogPostsFn } from '@/content/posts/server';

/**
 * Signed-in? Decided from the session cookie alone — `useSession()` would
 * round-trip to /api/auth/get-session first, leaving the landing page on
 * screen for as long as that takes. A stale cookie just means /chat's own
 * guard sends them to sign-in instead.
 */
function hasSessionCookie(): boolean {
  if (typeof document === 'undefined') return false;
  return document.cookie
    .split(';')
    .some((part) =>
      part.trim().split('=')[0].endsWith('better-auth.session_token')
    );
}

function HomePage() {
  const router = useRouter();
  const redirected = useRef(false);
  const { posts } = Route.useLoaderData();
  const sectionRegistry = {
    hero: <Hero />,
    stats: <Stats />,
    gallery: <Gallery />,
    features: <Features />,
    models: <ModelsStrip />,
    pricing: <Pricing />,
    faq: <FAQ />,
    blog: <Blog posts={posts} />,
    cta: <CTA />,
  } satisfies Record<HomeSectionId, ReactNode>;

  // Signed-in visitors get the app, not the pitch. Client-side (and at layout
  // time, before paint) so the landing page still renders — and indexes — for
  // everyone else.
  useLayoutEffect(() => {
    if (redirected.current || !hasSessionCookie()) return;
    redirected.current = true;
    router.push('/chat');
  }, [router]);

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
  // Client-side navigations to "/" (the logo, a back button) never render the
  // landing page at all. SSR has no document, so it falls through to the
  // component's hydration-time check.
  beforeLoad: () => {
    if (hasSessionCookie()) throw redirect({ to: '/chat' });
  },
  loader: async () => {
    const locale = getLocale();
    const blogEnabled = homeConfig.sections.some(
      (section) => section.id === 'blog' && section.enabled
    );
    const posts = blogEnabled
      ? await getBlogPostsFn({
          data: { locale, limit: homeConfig.blogPostLimit },
        })
      : [];
    return { locale, posts };
  },
  head: ({ loaderData }) => {
    const locale = loaderData?.locale ?? 'en';
    const urlFor = (loc: string) =>
      localizeUrl(`${envConfigs.app_url}/`, { locale: loc as any }).href;
    return {
      meta: [
        {
          name: 'description',
          content: m['landing.hero.subheadline']({}, { locale: locale as any }),
        },
      ],
      links: [
        { rel: 'canonical', href: urlFor(locale) },
        ...locales.map((loc) => ({
          rel: 'alternate',
          hrefLang: loc,
          href: urlFor(loc),
        })),
        { rel: 'alternate', hrefLang: 'x-default', href: urlFor('en') },
      ],
    };
  },
  component: HomePage,
});
