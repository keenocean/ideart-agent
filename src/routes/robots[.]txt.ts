import { createFileRoute } from '@tanstack/react-router';

import { envConfigs } from '@/config';
import { buildAbsoluteSeoUrl } from '@/lib/seo';
import { baseLocale, locales, localizeUrl } from '@/paraglide/runtime.js';

export const Route = createFileRoute('/robots.txt')({
  server: {
    handlers: {
      GET: () => {
        const privatePaths = ['/admin', '/settings', '/chat'].flatMap((path) =>
          locales.map(
            (locale) =>
              localizeUrl(`${envConfigs.app_url}${path}`, { locale }).pathname
          )
        );
        const body = [
          'User-Agent: *',
          'Allow: /',
          ...locales.map((locale) => {
            const blogPath = localizeUrl(`${envConfigs.app_url}/blog`, {
              locale,
            }).pathname;
            return `Allow: ${blogPath}?*`;
          }),
          ...[...new Set(privatePaths)].map((path) => `Disallow: ${path}`),
          'Disallow: /api/',
          '',
          `Sitemap: ${buildAbsoluteSeoUrl({ locale: baseLocale, path: '/sitemap.xml' })}`,
          '',
        ].join('\n');
        return new Response(body, {
          headers: { 'Content-Type': 'text/plain' },
        });
      },
    },
  },
});
