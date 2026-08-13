import { createFileRoute } from '@tanstack/react-router';

import { envConfigs } from '@/config';
import { baseLocale, locales, localizeUrl } from '@/paraglide/runtime.js';

const STATIC_PATHS = [
  '',
  '/pricing',
  '/blog',
  '/privacy-policy',
  '/terms-of-service',
];

type Entry = {
  path: string;
  availableLocales: string[];
  lastModified?: string;
  changeFrequency: string;
  priority: number;
};

function xml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function urlFor(path: string, locale: string): string {
  return localizeUrl(`${envConfigs.app_url}${path || '/'}`, {
    locale: locale as (typeof locales)[number],
  }).href;
}

function entryXml(entry: Entry, locale: string): string {
  const defaultLocale = entry.availableLocales.includes(baseLocale)
    ? baseLocale
    : entry.availableLocales[0];
  const alternates = [
    ...entry.availableLocales.map(
      (loc) =>
        `    <xhtml:link rel="alternate" hreflang="${xml(loc)}" href="${xml(urlFor(entry.path, loc))}"/>`
    ),
    `    <xhtml:link rel="alternate" hreflang="x-default" href="${xml(urlFor(entry.path, defaultLocale))}"/>`,
  ].join('\n');
  return [
    '  <url>',
    `    <loc>${xml(urlFor(entry.path, locale))}</loc>`,
    alternates,
    entry.lastModified
      ? `    <lastmod>${xml(entry.lastModified)}</lastmod>`
      : null,
    `    <changefreq>${entry.changeFrequency}</changefreq>`,
    `    <priority>${entry.priority}</priority>`,
    '  </url>',
  ]
    .filter(Boolean)
    .join('\n');
}

async function blogEntries(): Promise<Entry[]> {
  const entries = new Map<
    string,
    { availableLocales: Set<string>; lastModified: string }
  >();
  try {
    const { listPublishedArticles } = await import('@/modules/posts/service');
    const rows = await listPublishedArticles();
    for (const row of rows) {
      const current = entries.get(row.slug) || {
        availableLocales: new Set<string>(),
        lastModified: new Date(row.updatedAt).toISOString(),
      };
      if (row.locale) current.availableLocales.add(row.locale);
      else for (const locale of locales) current.availableLocales.add(locale);
      const updatedAt = new Date(row.updatedAt).toISOString();
      if (updatedAt > current.lastModified) current.lastModified = updatedAt;
      entries.set(row.slug, current);
    }
  } catch {
    // An unavailable database produces a static-only sitemap.
  }

  return [...entries.entries()].map(
    ([slug, { availableLocales, lastModified }]) => ({
      path: `/blog/${slug}`,
      availableLocales: locales.filter((locale) =>
        availableLocales.has(locale)
      ),
      lastModified,
      changeFrequency: 'monthly',
      priority: 0.6,
    })
  );
}

export const Route = createFileRoute('/sitemap.xml')({
  server: {
    handlers: {
      GET: async () => {
        const staticEntries: Entry[] = STATIC_PATHS.map((path) => ({
          path,
          availableLocales: [...locales],
          changeFrequency: path === '/blog' ? 'daily' : 'weekly',
          priority: path === '' ? 1 : 0.8,
        }));
        const entries = [...staticEntries, ...(await blogEntries())];
        const xmlBody = [
          '<?xml version="1.0" encoding="UTF-8"?>',
          '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">',
          ...entries.flatMap((entry) =>
            entry.availableLocales.map((locale) => entryXml(entry, locale))
          ),
          '</urlset>',
          '',
        ].join('\n');

        return new Response(xmlBody, {
          headers: {
            'Content-Type': 'application/xml',
            'Cache-Control':
              'public, s-maxage=3600, stale-while-revalidate=86400',
          },
        });
      },
    },
  },
});
