import { createFileRoute, notFound } from '@tanstack/react-router';
import { Calendar, ChevronRight } from 'lucide-react';

import { Link } from '@/core/i18n/navigation';
import { envConfigs } from '@/config';
import { m } from '@/paraglide/messages.js';
import { baseLocale, getLocale, localizeUrl } from '@/paraglide/runtime.js';
import { Footer } from '@/blocks/footer';
import { Header } from '@/blocks/header';
import { MarkdownContent } from '@/components/markdown-content';
import { formatPostDate } from '@/content/posts';
import { getBlogPostFn } from '@/content/posts/server';

function absoluteUrl(path: string): string {
  try {
    return new URL(path, `${envConfigs.app_url}/`).href;
  } catch {
    return path;
  }
}

function jsonLd(value: unknown): string {
  return JSON.stringify(value).replace(/</g, '\\u003c');
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
    const canonical = localizeUrl(`${envConfigs.app_url}/blog/${post.slug}`, {
      locale: locale as any,
    }).href;
    const title = `${post.title} | ${envConfigs.app_name}`;
    const image = post.image ? absoluteUrl(post.image) : undefined;
    const availableLocales = post.availableLocales.length
      ? post.availableLocales
      : [locale];
    const urlFor = (loc: string) =>
      localizeUrl(`${envConfigs.app_url}/blog/${post.slug}`, {
        locale: loc as any,
      }).href;
    const blogUrl = localizeUrl(`${envConfigs.app_url}/blog`, {
      locale: locale as any,
    }).href;
    const homeUrl = localizeUrl(`${envConfigs.app_url}/`, {
      locale: locale as any,
    }).href;
    const defaultLocale = availableLocales.includes(baseLocale)
      ? baseLocale
      : availableLocales[0];
    return {
      meta: [
        { title },
        { name: 'description', content: post.description },
        { property: 'og:type', content: 'article' },
        { property: 'og:title', content: title },
        { property: 'og:description', content: post.description },
        { property: 'og:url', content: canonical },
        ...(image ? [{ property: 'og:image', content: image }] : []),
        {
          property: 'og:locale',
          content: locale === 'zh' ? 'zh_CN' : 'en_US',
        },
        {
          property: 'article:published_time',
          content: post.createdAt,
        },
        { property: 'article:modified_time', content: post.updatedAt },
        ...(post.authorName
          ? [{ property: 'article:author', content: post.authorName }]
          : []),
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:title', content: title },
        { name: 'twitter:description', content: post.description },
        ...(image ? [{ name: 'twitter:image', content: image }] : []),
      ],
      links: [
        { rel: 'canonical', href: canonical },
        ...availableLocales.map((loc) => ({
          rel: 'alternate',
          hrefLang: loc,
          href: urlFor(loc),
        })),
        {
          rel: 'alternate',
          hrefLang: 'x-default',
          href: urlFor(defaultLocale),
        },
      ],
      scripts: [
        {
          type: 'application/ld+json',
          children: jsonLd({
            '@context': 'https://schema.org',
            '@graph': [
              {
                '@type': 'BlogPosting',
                headline: post.title,
                description: post.description,
                ...(image ? { image: [image] } : {}),
                datePublished: post.createdAt,
                dateModified: post.updatedAt,
                inLanguage: locale,
                mainEntityOfPage: {
                  '@type': 'WebPage',
                  '@id': canonical,
                },
                author: {
                  '@type': post.authorName ? 'Person' : 'Organization',
                  name: post.authorName || envConfigs.app_name,
                },
                publisher: {
                  '@type': 'Organization',
                  name: envConfigs.app_name,
                  logo: {
                    '@type': 'ImageObject',
                    url: absoluteUrl('/logo.png'),
                  },
                },
              },
              {
                '@type': 'BreadcrumbList',
                itemListElement: [
                  {
                    '@type': 'ListItem',
                    position: 1,
                    name: envConfigs.app_name,
                    item: homeUrl,
                  },
                  {
                    '@type': 'ListItem',
                    position: 2,
                    name: m['blog.title']({}, { locale: locale as any }),
                    item: blogUrl,
                  },
                  {
                    '@type': 'ListItem',
                    position: 3,
                    name: post.title,
                    item: canonical,
                  },
                ],
              },
            ],
          }),
        },
      ],
    };
  },
  component: BlogPostPage,
});

function BlogPostPage() {
  const { locale, post } = Route.useLoaderData();

  return (
    <div className="bg-background text-foreground flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 px-6 py-12 md:px-8 md:py-16">
        <article className="mx-auto max-w-3xl">
          <nav
            aria-label="Breadcrumb"
            className="text-muted-foreground flex items-center gap-1.5 text-sm"
          >
            <Link href="/" className="hover:text-foreground transition-colors">
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
            <img
              src={post.image}
              alt={post.title}
              className="border-border mb-8 w-full rounded-lg border object-cover"
            />
          )}

          <MarkdownContent content={post.content || ''} />
        </article>
      </main>
      <Footer />
    </div>
  );
}
