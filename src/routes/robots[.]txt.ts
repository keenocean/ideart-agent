import { createFileRoute } from '@tanstack/react-router';

import { envConfigs } from '@/config';
import { locales, localizeUrl } from '@/paraglide/runtime.js';

export const Route = createFileRoute('/robots.txt')({
  server: {
    handlers: {
      GET: () => {
        const body = [
          'User-Agent: *',
          'Allow: /',
          ...locales.map((locale) => {
            const blogPath = localizeUrl(`${envConfigs.app_url}/blog`, {
              locale,
            }).pathname;
            return `Allow: ${blogPath}?*`;
          }),
          'Disallow: /admin',
          'Disallow: /settings',
          'Disallow: /api/',
          '',
          `Sitemap: ${envConfigs.app_url}/sitemap.xml`,
          '',
        ].join('\n');
        return new Response(body, {
          headers: { 'Content-Type': 'text/plain' },
        });
      },
    },
  },
});
