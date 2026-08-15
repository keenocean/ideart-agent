import { createFileRoute } from '@tanstack/react-router';

import { catalog } from '@/config/catalog';
import { selectIndexableUrls } from '@/config/catalog/selectors';
import type { AppLocale } from '@/config/locale';
import { selectIndexableFixedUrls } from '@/config/seo/public-routes';
import { buildAbsoluteSeoUrl, type SeoRouteRef } from '@/lib/seo';
import { baseLocale, locales } from '@/paraglide/runtime.js';
import { getPublishedBlogLocales } from '@/content/posts';

type LocalizedEntry = {
  groupId: string;
  routes: SeoRouteRef[];
  lastModified?: string;
};

function xml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function entryXml(entry: LocalizedEntry, route: SeoRouteRef): string {
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
    entry.lastModified
      ? `    <lastmod>${xml(entry.lastModified)}</lastmod>`
      : null,
    '  </url>',
  ]
    .filter(Boolean)
    .join('\n');
}

function fixedEntries(): LocalizedEntry[] {
  const groups = new Map<string, LocalizedEntry>();
  for (const record of selectIndexableFixedUrls()) {
    const group = groups.get(record.id) ?? {
      groupId: `fixed:${record.id}`,
      routes: [],
    };
    group.routes.push({ locale: record.locale, path: record.path });
    if (
      record.modifiedAt &&
      (!group.lastModified || record.modifiedAt > group.lastModified)
    ) {
      group.lastModified = record.modifiedAt;
    }
    groups.set(record.id, group);
  }
  return [...groups.values()];
}

function catalogEntries(): LocalizedEntry[] {
  const groups = new Map<string, LocalizedEntry>();
  for (const record of selectIndexableUrls(catalog)) {
    const groupId = `${record.kind}:${record.entityId}`;
    const group = groups.get(groupId) ?? { groupId, routes: [] };
    group.routes.push({ locale: record.locale, path: record.path });
    if (
      record.modifiedAt &&
      (!group.lastModified || record.modifiedAt > group.lastModified)
    ) {
      group.lastModified = record.modifiedAt;
    }
    groups.set(groupId, group);
  }
  return [...groups.values()];
}

async function blogEntries(): Promise<LocalizedEntry[]> {
  const posts = new Map<
    string,
    { locales: Set<AppLocale>; lastModified: string }
  >();
  const publishedLocales = new Set<AppLocale>();
  let latestUpdate: string | undefined;
  const { listPublishedArticles } = await import('@/modules/posts/service');
  const rows = await listPublishedArticles();
  for (const row of rows) {
    if (!locales.includes(row.locale as AppLocale)) continue;
    const locale = row.locale as AppLocale;
    const updatedAt = new Date(row.updatedAt).toISOString();
    const current = posts.get(row.slug) ?? {
      locales: new Set<AppLocale>(),
      lastModified: updatedAt,
    };
    current.locales.add(locale);
    publishedLocales.add(locale);
    if (updatedAt > current.lastModified) current.lastModified = updatedAt;
    if (!latestUpdate || updatedAt > latestUpdate) latestUpdate = updatedAt;
    posts.set(row.slug, current);
  }

  const availableBlogLocales = getPublishedBlogLocales(
    [...publishedLocales],
    locales
  ) as AppLocale[];
  return [
    ...(availableBlogLocales.length
      ? [
          {
            groupId: 'blog:index',
            routes: availableBlogLocales.map((locale) => ({
              locale,
              path: '/blog',
            })),
            lastModified: latestUpdate,
          },
        ]
      : []),
    ...[...posts.entries()].map(
      ([slug, value]): LocalizedEntry => ({
        groupId: `blog:${slug}`,
        routes: getPublishedBlogLocales([...value.locales], locales).map(
          (locale) => ({ locale: locale as AppLocale, path: `/blog/${slug}` })
        ),
        lastModified: value.lastModified,
      })
    ),
  ].filter((entry) => entry.routes.length > 0);
}

function deduplicate(entries: readonly LocalizedEntry[]): LocalizedEntry[] {
  const urls = new Set<string>();
  for (const entry of entries) {
    for (const route of entry.routes) {
      const url = buildAbsoluteSeoUrl(route);
      if (urls.has(url)) throw new Error(`Duplicate sitemap URL: ${url}`);
      urls.add(url);
    }
  }
  return [...entries];
}

export const Route = createFileRoute('/sitemap.xml')({
  server: {
    handlers: {
      GET: async () => {
        try {
          const entries = deduplicate([
            ...fixedEntries(),
            ...catalogEntries(),
            ...(await blogEntries()),
          ]);
          const body = [
            '<?xml version="1.0" encoding="UTF-8"?>',
            '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">',
            ...entries.flatMap((entry) =>
              entry.routes.map((route) => entryXml(entry, route))
            ),
            '</urlset>',
            '',
          ].join('\n');
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
