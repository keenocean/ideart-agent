import { createFileRoute, notFound } from '@tanstack/react-router';
import { Calendar, ChevronRight } from 'lucide-react';

import { LocaleSwitchProvider } from '@/core/i18n/locale-switch';
import { Link } from '@/core/i18n/navigation';
import { envConfigs } from '@/config';
import type { AppLocale } from '@/config/locale';
import { buildSeoHead } from '@/lib/seo';
import { m } from '@/paraglide/messages.js';
import { getLocale } from '@/paraglide/runtime.js';
import { Footer } from '@/blocks/footer';
import { Header } from '@/blocks/header';
import { MarkdownContent } from '@/components/markdown-content';
import { formatPostDate } from '@/content/posts';
import { getBlogPostFn } from '@/content/posts/server';

function absoluteUrl(path: string): string | undefined {
  try {
    const url = new URL(path, `${envConfigs.app_url}/`);
    return url.protocol === 'https:' || url.protocol === 'http:'
      ? url.href
      : undefined;
  } catch {
    return undefined;
  }
}

export const Route = createFileRoute('/blog/$slug')({
  loader: async ({ params }) => {
    const locale = getLocale();
    const post = await getBlogPostFn({
      data: { slug: params.slug, locale },
    });
    if (!post) throw notFound();
    return { locale, post };
  },
  head: ({ loaderData }) => {
    if (!loaderData) return {};
    const { locale, post } = loaderData;
    const title = `${post.title} | ${envConfigs.app_name}`;
    const image = post.image ? absoluteUrl(post.image.url) : undefined;
    const availableLocales = post.availableLocales.length
      ? post.availableLocales
      : [locale];
    const canonical = { locale, path: `/blog/${post.slug}` };
    return buildSeoHead({
      kind: 'article',
      title,
      headline: post.title,
      description: post.description,
      canonical,
      alternates: availableLocales.map((targetLocale) => ({
        locale: targetLocale as AppLocale,
        path: `/blog/${post.slug}`,
      })),
      indexing: 'index',
      ...(image
        ? {
            image: {
              src: image,
              alt: post.image!.alt,
              width: post.image!.width,
              height: post.image!.height,
              type: post.image!.mimeType,
            },
          }
        : {}),
      publishedTime: post.createdAt,
      modifiedTime: post.updatedAt,
      author: {
        name: post.authorName || envConfigs.app_name,
        type: post.authorName ? 'Person' : 'Organization',
      },
      breadcrumbs: [
        { name: envConfigs.app_name, route: { locale, path: '/' } },
        {
          name: m['blog.title']({}, { locale }),
          route: { locale, path: '/blog' },
        },
        { name: post.title, route: canonical },
      ],
    });
  },
  component: BlogPostPage,
});

function BlogPostPage() {
  const { locale, post } = Route.useLoaderData();

  return (
    <LocaleSwitchProvider
      availableLocales={post.availableLocales}
      fallbackHref="/blog"
    >
      <div className="bg-background text-foreground flex min-h-screen flex-col">
        <Header />
        <main className="flex-1 px-6 py-12 md:px-8 md:py-16">
          <article className="mx-auto max-w-3xl">
            <nav
              aria-label="Breadcrumb"
              className="text-muted-foreground flex items-center gap-1.5 text-sm"
            >
              <Link
                href="/"
                className="hover:text-foreground transition-colors"
              >
                {envConfigs.app_name}
              </Link>
              <ChevronRight aria-hidden="true" className="size-3.5" />
              <Link
                href="/blog"
                className="hover:text-foreground transition-colors"
              >
                {m['blog.title']()}
              </Link>
              <ChevronRight aria-hidden="true" className="size-3.5" />
              <span aria-current="page" className="truncate">
                {post.title}
              </span>
            </nav>

            <header className="border-border mt-8 mb-6 border-b pb-6">
              <h1 className="text-foreground text-3xl font-semibold tracking-tight md:text-4xl">
                {post.title}
              </h1>
              {post.description && (
                <p className="text-muted-foreground mt-3">{post.description}</p>
              )}
              {post.categories.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {post.categories.map((category) => (
                    <Link
                      key={category.slug}
                      href={`/blog?category=${encodeURIComponent(category.slug)}`}
                      className="bg-muted text-muted-foreground hover:text-foreground rounded-full px-3 py-1 text-xs font-medium transition-colors"
                    >
                      {category.title}
                    </Link>
                  ))}
                </div>
              )}
              <div className="text-muted-foreground mt-4 flex items-center gap-4 text-sm">
                <span className="inline-flex items-center gap-1.5">
                  <Calendar className="size-4" />
                  {formatPostDate(post.createdAt, locale)}
                </span>
                {(post.authorName || post.authorImage) && (
                  <span className="inline-flex items-center gap-2">
                    {post.authorImage && (
                      <img
                        src={post.authorImage}
                        alt={post.authorName || ''}
                        width={20}
                        height={20}
                        className="size-5 rounded-full object-cover"
                      />
                    )}
                    {post.authorName}
                  </span>
                )}
              </div>
            </header>

            {post.image && (
              <figure className="mb-8">
                <img
                  src={post.image.url}
                  alt={post.image.alt}
                  width={post.image.width}
                  height={post.image.height}
                  decoding="async"
                  className="border-border w-full rounded-lg border object-cover"
                />
                {post.image.caption && (
                  <figcaption className="text-muted-foreground mt-2 text-center text-sm">
                    {post.image.caption}
                  </figcaption>
                )}
              </figure>
            )}

            <MarkdownContent content={post.content || ''} />
          </article>
        </main>
        <Footer />
      </div>
    </LocaleSwitchProvider>
  );
}
