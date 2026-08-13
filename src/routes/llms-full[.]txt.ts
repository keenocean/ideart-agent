import { createFileRoute } from '@tanstack/react-router';

import { envConfigs } from '@/config';
import { baseLocale, localizeUrl } from '@/paraglide/runtime.js';
import { dedupePosts, type BlogPost } from '@/content/posts';

const STATIC_PAGES: { path: string; title: string; description: string }[] = [
  { path: '', title: 'Home', description: 'Landing page' },
  { path: '/pricing', title: 'Pricing', description: 'Pricing plans' },
  { path: '/blog', title: 'Blog', description: 'Blog posts and articles' },
];

function localizedUrl(path: string): string {
  return localizeUrl(`${envConfigs.app_url}${path || '/'}`, {
    locale: baseLocale,
  }).href;
}

export const Route = createFileRoute('/llms-full.txt')({
  server: {
    handlers: {
      GET: async () => {
        const { app_name, app_description } = envConfigs;
        const lines: string[] = [
          `# ${app_name}`,
          '',
          `> ${app_description}`,
          '',
          '## Pages',
          '',
          ...STATIC_PAGES.map(
            (page) =>
              `- [${page.title}](${localizedUrl(page.path)}): ${page.description}`
          ),
        ];

        let posts: BlogPost[] = [];
        const dbContent = new Map<string, string>();
        try {
          const { listPublishedArticleDetails } =
            await import('@/modules/posts/service');
          const rows = await listPublishedArticleDetails({
            locale: baseLocale,
          });
          rows.sort(
            (a, b) =>
              Number(b.locale === baseLocale) - Number(a.locale === baseLocale)
          );
          const dbPosts: BlogPost[] = rows.map((row) => {
            if (!dbContent.has(row.slug)) {
              dbContent.set(row.slug, row.content || '');
            }
            return {
              slug: row.slug,
              title: row.title || row.slug,
              description: row.description || '',
              image: row.image || undefined,
              createdAt: new Date(row.createdAt).toISOString(),
              updatedAt: new Date(row.updatedAt).toISOString(),
              locale: row.locale,
              categories: [],
              authorName: row.authorName || undefined,
              authorImage: row.authorImage || undefined,
            };
          });
          posts = dedupePosts(dbPosts);
        } catch {
          // An unavailable database produces a static-page-only index.
        }

        if (posts.length > 0) {
          lines.push('', '## Blog Posts', '');
          for (const post of posts) {
            lines.push(`### ${post.title}`, '');
            lines.push(`URL: ${localizedUrl(`/blog/${post.slug}`)}`);
            if (post.description) {
              lines.push(`Description: ${post.description}`);
            }
            const content = dbContent.get(post.slug) || '';
            if (content) lines.push('', content);
            lines.push('', '---', '');
          }
        }

        return new Response(lines.join('\n'), {
          headers: {
            'Content-Type': 'text/plain; charset=utf-8',
            'Cache-Control':
              'public, s-maxage=3600, stale-while-revalidate=86400',
          },
        });
      },
    },
  },
});
