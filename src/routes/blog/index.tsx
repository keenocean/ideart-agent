import { createFileRoute } from '@tanstack/react-router';
import { ChevronLeft, ChevronRight } from 'lucide-react';

import { Link } from '@/core/i18n/navigation';
import { envConfigs } from '@/config';
import { cn } from '@/lib/utils';
import { m } from '@/paraglide/messages.js';
import {
  baseLocale,
  getLocale,
  locales,
  localizeUrl,
} from '@/paraglide/runtime.js';
import { Footer } from '@/blocks/footer';
import { Header } from '@/blocks/header';
import { BlogCard } from '@/components/blog-card';
import { formatPostDate } from '@/content/posts';
import { getBlogPageFn } from '@/content/posts/server';

const PAGE_SIZE = 9;

function normalizeCategory(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const category = value.trim().toLowerCase();
  return /^[a-z0-9][a-z0-9-]{0,63}$/.test(category) ? category : undefined;
}

function normalizePage(value: unknown): number {
  const page = Number(value);
  return Number.isInteger(page) && page > 0 ? page : 1;
}

function blogHref(options: { category?: string; page?: number } = {}): string {
  const search = new URLSearchParams();
  if (options.category) search.set('category', options.category);
  if (options.page && options.page > 1)
    search.set('page', String(options.page));
  const query = search.toString();
  return query ? `/blog?${query}` : '/blog';
}

export const Route = createFileRoute('/blog/')({
  validateSearch: (search) => ({
    category: normalizeCategory(search.category),
    page: normalizePage(search.page),
  }),
  loaderDeps: ({ search }) => search,
  loader: async ({ deps }) => {
    const locale = getLocale();
    const listing = await getBlogPageFn({
      data: {
        locale,
        category: deps.category,
        page: deps.page,
        pageSize: PAGE_SIZE,
      },
    });
    return { locale, category: deps.category, listing };
  },
  head: ({ loaderData }) => {
    const locale = loaderData?.locale ?? baseLocale;
    const category = loaderData?.listing.categories.find(
      (item) => item.slug === loaderData.category
    );
    const page = loaderData?.listing.page ?? 1;
    const baseTitle = m['blog.title']({}, { locale: locale as any });
    const titleParts = [category?.title, baseTitle];
    if (page > 1) titleParts.push(String(page));
    const title = `${titleParts.filter(Boolean).join(' · ')} | ${envConfigs.app_name}`;
    const description = m['blog.description']({}, { locale: locale as any });
    const urlFor = (loc: string) => {
      const base = localizeUrl(`${envConfigs.app_url}/blog`, {
        locale: loc as any,
      }).href;
      const query = blogHref({ category: category?.slug, page }).split('?')[1];
      return query ? `${base}?${query}` : base;
    };
    return {
      meta: [
        { title },
        { name: 'description', content: description },
        ...(category ? [{ name: 'robots', content: 'noindex,follow' }] : []),
        { property: 'og:type', content: 'website' },
        { property: 'og:title', content: title },
        { property: 'og:description', content: description },
        { property: 'og:url', content: urlFor(locale) },
        { name: 'twitter:title', content: title },
        { name: 'twitter:description', content: description },
      ],
      links: [
        { rel: 'canonical', href: urlFor(locale) },
        ...locales.map((loc) => ({
          rel: 'alternate',
          hrefLang: loc,
          href: urlFor(loc),
        })),
        {
          rel: 'alternate',
          hrefLang: 'x-default',
          href: urlFor(baseLocale),
        },
      ],
    };
  },
  component: BlogPage,
});

function BlogPage() {
  const { locale, category, listing } = Route.useLoaderData();

  return (
    <div className="bg-background text-foreground flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 px-4 py-16 sm:py-24">
        <div className="mx-auto max-w-5xl">
          <div className="mb-10 text-center sm:mb-14">
            <h1 className="font-serif text-4xl font-normal tracking-tight sm:text-5xl">
              {m['blog.title']()}
            </h1>
            <p className="text-muted-foreground mx-auto mt-5 max-w-lg">
              {m['blog.description']()}
            </p>
          </div>

          {listing.categories.length > 0 && (
            <nav
              aria-label={m['blog.category_label']({
                category: category || m['blog.all_categories'](),
              })}
              className="mb-10 flex flex-wrap justify-center gap-2"
            >
              <Link
                href="/blog"
                aria-current={!category ? 'page' : undefined}
                className={cn(
                  'rounded-full border px-4 py-2 text-sm font-medium transition-colors',
                  !category
                    ? 'border-foreground bg-foreground text-background'
                    : 'border-border hover:border-foreground/30'
                )}
              >
                {m['blog.all_categories']()}
              </Link>
              {listing.categories.map((item) => (
                <Link
                  key={item.slug}
                  href={blogHref({ category: item.slug })}
                  aria-current={category === item.slug ? 'page' : undefined}
                  className={cn(
                    'rounded-full border px-4 py-2 text-sm font-medium transition-colors',
                    category === item.slug
                      ? 'border-foreground bg-foreground text-background'
                      : 'border-border hover:border-foreground/30'
                  )}
                >
                  {item.title}
                </Link>
              ))}
            </nav>
          )}

          {listing.items.length === 0 ? (
            <p className="text-muted-foreground py-16 text-center">
              {category ? m['blog.filtered_no_posts']() : m['blog.no_posts']()}
            </p>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {listing.items.map((post) => (
                <BlogCard
                  key={post.slug}
                  href={`/blog/${post.slug}`}
                  title={post.title}
                  description={post.description}
                  image={post.image}
                  date={formatPostDate(post.createdAt, locale)}
                  authorName={post.authorName}
                  authorImage={post.authorImage}
                  categories={post.categories}
                />
              ))}
            </div>
          )}

          {listing.totalPages > 1 && (
            <nav
              aria-label={m['blog.pagination_label']()}
              className="border-border mt-12 flex items-center justify-between border-t pt-6"
            >
              {listing.page > 1 ? (
                <Link
                  href={blogHref({
                    category,
                    page: listing.page - 1,
                  })}
                  rel="prev"
                  className="hover:bg-muted inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors"
                >
                  <ChevronLeft className="size-4" />
                  {m['blog.previous_page']()}
                </Link>
              ) : (
                <span />
              )}
              <span className="text-muted-foreground text-sm">
                {m['blog.page_status']({
                  page: listing.page,
                  total: listing.totalPages,
                })}
              </span>
              {listing.page < listing.totalPages ? (
                <Link
                  href={blogHref({
                    category,
                    page: listing.page + 1,
                  })}
                  rel="next"
                  className="hover:bg-muted inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors"
                >
                  {m['blog.next_page']()}
                  <ChevronRight className="size-4" />
                </Link>
              ) : (
                <span />
              )}
            </nav>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
