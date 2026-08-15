import { createFileRoute } from '@tanstack/react-router';

import { catalog } from '@/config/catalog';
import type { AppLocale } from '@/config/locale';
import { selectIndexableFixedUrls } from '@/config/seo/public-routes';
import { buildAbsoluteSeoUrl, type SeoRouteRef } from '@/lib/seo';
import { baseLocale, locales } from '@/paraglide/runtime.js';
import { selectLoadableIndexableCatalogUrls } from '@/content/catalog-pages';
import { getPublishedBlogLocales } from '@/content/posts';

export type SitemapEntry = {
  groupId: string;
  routes: Array<SeoRouteRef & { lastModified?: string }>;
};

function xml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function entryXml(
  entry: SitemapEntry,
  route: SeoRouteRef & { lastModified?: string }
): string {
  const defaultRoute = entry.routes.find(
    (candidate) => candidate.locale === baseLocale
  );
  const alternates = [
    ...entry.routes.map(
      (alternate) =>
        `    <xhtml:link rel="alternate" hreflang="${xml(alternate.locale)}" href="${xml(buildAbsoluteSeoUrl(alternate))}"/>`
    ),
    defaultRoute
      ? `    <xhtml:link rel="alternate" hreflang="x-default" href="${xml(buildAbsoluteSeoUrl(defaultRoute))}"/>`
      : null,
  ]
    .filter(Boolean)
    .join('\n');
  return [
    '  <url>',
    `    <loc>${xml(buildAbsoluteSeoUrl(route))}</loc>`,
    alternates,
    route.lastModified
      ? `    <lastmod>${xml(route.lastModified)}</lastmod>`
      : null,
    '  </url>',
  ]
    .filter(Boolean)
    .join('\n');
}

function fixedEntries(): SitemapEntry[] {
  const groups = new Map<string, SitemapEntry>();
  for (const record of selectIndexableFixedUrls()) {
    const group = groups.get(record.id) ?? {
      groupId: `fixed:${record.id}`,
      routes: [],
    };
    group.routes.push({
      locale: record.locale,
      path: record.path,
      lastModified: record.modifiedAt,
    });
    groups.set(record.id, group);
  }
  return [...groups.values()];
}

async function catalogEntries(): Promise<SitemapEntry[]> {
  const groups = new Map<string, SitemapEntry>();
  for (const record of await selectLoadableIndexableCatalogUrls(catalog)) {
    const groupId = `${record.kind}:${record.entityId}`;
    const group = groups.get(groupId) ?? { groupId, routes: [] };
    group.routes.push({
      locale: record.locale,
      path: record.path,
      lastModified: record.modifiedAt,
    });
    groups.set(groupId, group);
  }
  return [...groups.values()];
}

async function blogEntries(): Promise<SitemapEntry[]> {
  const posts = new Map<
    string,
    {
      routes: Partial<
        Record<AppLocale, SeoRouteRef & { lastModified?: string }>
      >;
    }
  >();
  const blogIndexRoutes: Partial<
    Record<AppLocale, SeoRouteRef & { lastModified?: string }>
  > = {};
  const { listPublishedArticles } = await import('@/modules/posts/service');
  const rows = await listPublishedArticles();
  for (const row of rows) {
    if (!locales.includes(row.locale as AppLocale)) continue;
    const locale = row.locale as AppLocale;
    const updatedAt = new Date(row.updatedAt).toISOString();
    const current = posts.get(row.slug) ?? { routes: {} };
    current.routes[locale] = {
      locale,
      path: `/blog/${row.slug}`,
      lastModified: updatedAt,
    };
    const blogIndexRoute = blogIndexRoutes[locale];
    if (
      !blogIndexRoute?.lastModified ||
      updatedAt > blogIndexRoute.lastModified
    ) {
      blogIndexRoutes[locale] = {
        locale,
        path: '/blog',
        lastModified: updatedAt,
      };
    }
    posts.set(row.slug, current);
  }

  const availableBlogLocales = getPublishedBlogLocales(
    Object.keys(blogIndexRoutes) as AppLocale[],
    locales
  ) as AppLocale[];
  return [
    ...(availableBlogLocales.length
      ? [
          {
            groupId: 'blog:index',
            routes: availableBlogLocales.flatMap((locale) => {
              const route = blogIndexRoutes[locale];
              return route ? [route] : [];
            }),
          },
        ]
      : []),
    ...[...posts.entries()].map(
      ([slug, value]): SitemapEntry => ({
        groupId: `blog:${slug}`,
        routes: getPublishedBlogLocales(
          Object.keys(value.routes) as AppLocale[],
          locales
        ).flatMap((locale) => {
          const route = value.routes[locale as AppLocale];
          return route ? [route] : [];
        }),
      })
    ),
  ].filter((entry) => entry.routes.length > 0);
}

export function deduplicateSitemapEntries(
  entries: readonly SitemapEntry[]
): SitemapEntry[] {
  const urls = new Set<string>();
  return entries.flatMap((entry) => {
    const routes = entry.routes.filter((route) => {
      const url = buildAbsoluteSeoUrl(route);
      if (urls.has(url)) return false;
      urls.add(url);
      return true;
    });
    return routes.length ? [{ ...entry, routes }] : [];
  });
}

export function renderSitemapXml(entries: readonly SitemapEntry[]): string {
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">',
    ...entries.flatMap((entry) =>
      entry.routes.map((route) => entryXml(entry, route))
    ),
    '</urlset>',
    '',
  ].join('\n');
}

export const Route = createFileRoute('/sitemap.xml')({
  server: {
    handlers: {
      GET: async () => {
        try {
          const entries = deduplicateSitemapEntries([
            ...fixedEntries(),
            ...(await catalogEntries()),
            ...(await blogEntries()),
          ]);
          const body = renderSitemapXml(entries);
          return new Response(body, {
            headers: {
              'Content-Type': 'application/xml; charset=utf-8',
              'Cache-Control':
                'public, s-maxage=3600, stale-while-revalidate=86400',
            },
          });
        } catch (error) {
          console.error('[sitemap] Public discovery unavailable', error);
          return new Response('Service Unavailable', {
            status: 503,
            headers: {
              'Content-Type': 'text/plain; charset=utf-8',
              'Cache-Control': 'no-store',
              'Retry-After': '60',
            },
          });
        }
      },
    },
  },
});
