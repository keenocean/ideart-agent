import { useLayoutEffect, useRef } from 'react';
import { createFileRoute, redirect } from '@tanstack/react-router';

import { useRouter } from '@/core/i18n/navigation';
import { envConfigs } from '@/config';
import {
  getFixedLocalePage,
  getFixedRouteAlternates,
} from '@/config/seo/public-routes';
import { buildSeoHead } from '@/lib/seo';
import { m } from '@/paraglide/messages.js';
import { getLocale } from '@/paraglide/runtime.js';
import { Blog } from '@/blocks/blog';
import { Footer } from '@/blocks/footer';
import { Header } from '@/blocks/header';
import { Hero } from '@/blocks/hero';
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
        <Hero />
        <Blog posts={posts} />
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
    const posts = await getBlogPostsFn({ data: { locale, limit: 3 } });
    const page = getFixedLocalePage('home', locale);
    if (!page) throw new Error(`Home is not registered for locale ${locale}`);
    const description = m['landing.hero.subheadline']({}, { locale });
    return {
      locale,
      posts,
      seo: {
        kind: 'website' as const,
        title: envConfigs.app_name,
        description,
        canonical: { locale, path: page.path },
        alternates: getFixedRouteAlternates('home', locale),
        indexing: page.indexing,
      },
    };
  },
  head: ({ loaderData }) => (loaderData ? buildSeoHead(loaderData.seo) : {}),
  component: HomePage,
});
