import { createFileRoute } from '@tanstack/react-router';

import { envConfigs } from '@/config';
import { catalog } from '@/config/catalog';
import { selectLlmsEntries } from '@/config/catalog/selectors';
import { selectIndexableFixedUrls } from '@/config/seo/public-routes';
import { buildAbsoluteSeoUrl } from '@/lib/seo';
import { baseLocale } from '@/paraglide/runtime.js';
import type { BlogPost } from '@/content/posts';

const FIXED_PAGE_COPY = {
  home: { title: 'Home', description: 'AI image and video creation agent' },
  pricing: { title: 'Pricing', description: 'Pricing plans' },
  'privacy-policy': {
    title: 'Privacy Policy',
    description: 'How personal information is handled',
  },
  'terms-of-service': {
    title: 'Terms of Service',
    description: 'Terms for using the service',
  },
} as const;

function localizedUrl(path: string): string {
  return buildAbsoluteSeoUrl({ locale: baseLocale, path: path || '/' });
}

export const Route = createFileRoute('/llms.txt')({
  server: {
    handlers: {
      GET: async () => {
        const { app_name, app_description } = envConfigs;
        const fixedPages = selectIndexableFixedUrls().filter(
          (page) => page.locale === baseLocale
        );
        const catalogPages = selectLlmsEntries(catalog, baseLocale);

        let posts: BlogPost[] = [];
        try {
          const { listPublishedArticles } =
            await import('@/modules/posts/service');
          const rows = await listPublishedArticles({ locale: baseLocale });
          posts = rows.map((row) => ({
            slug: row.slug,
            title: row.title || row.slug,
            description: row.description || '',
            createdAt: new Date(row.createdAt).toISOString(),
            updatedAt: new Date(row.updatedAt).toISOString(),
            locale: row.locale,
            categories: [],
            authorName: row.authorName || undefined,
            authorImage: row.authorImage || undefined,
          }));
        } catch {
          // An unavailable database produces a static-page-only index.
        }

        const lines: string[] = [
          `# ${app_name}`,
          '',
          `> ${app_description}`,
          '',
          '## Pages',
          '',
          ...fixedPages.map(
            (page) =>
              `- [${FIXED_PAGE_COPY[page.id].title}](${localizedUrl(page.path)}): ${FIXED_PAGE_COPY[page.id].description}`
          ),
          ...catalogPages.map(
            (page) =>
              `- [${page.definition.entityId}](${localizedUrl(page.path)}): Published ${page.kind} page`
          ),
        ];

        if (posts.length > 0) {
          lines.push('', '## Blog Posts', '');
          for (const post of posts) {
            lines.push(
              `- [${post.title}](${localizedUrl(`/blog/${post.slug}`)}): ${post.description}`
            );
          }
        }

        lines.push('');

        return new Response(lines.join('\n'), {
          headers: {
            'Content-Type': 'text/plain; charset=utf-8',
            'X-Robots-Tag': 'noindex',
            'Cache-Control':
              'public, s-maxage=3600, stale-while-revalidate=86400',
          },
        });
      },
    },
  },
});
