import handler from '@tanstack/react-start/server-entry';

import { getCookieFromHeader } from './lib/cookie';
import { deLocalizeUrl } from './paraglide/runtime.js';
import { paraglideMiddleware } from './paraglide/server.js';

// On Cloudflare Workers, stash the binding env (D1, ASSETS, …) on globalThis
// so synchronous code paths (e.g. the db() singleton with DATABASE_PROVIDER=d1)
// can reach bindings without threading the request context through every call.
// The specifier is kept non-literal so bundlers leave the import to runtime;
// outside workerd the import rejects and we just move on.
const CF_WORKERS_MODULE = 'cloudflare:workers';
let cfEnvPromise: Promise<void> | null = null;

function ensureCloudflareEnv(): Promise<void> {
  if (!cfEnvPromise) {
    cfEnvPromise = import(/* @vite-ignore */ CF_WORKERS_MODULE)
      .then((mod) => {
        (globalThis as any).__CF_ENV__ = mod.env;
      })
      .catch(() => {
        // Not running on Cloudflare Workers — nothing to stash.
      });
  }
  return cfEnvPromise;
}

function normalizeExternalContentFailure(
  req: Request,
  response: Response
): Response {
  if (response.status !== 500) return response;
  const pathname = deLocalizeUrl(new URL(req.url)).pathname;
  const externalContentRoute =
    pathname === '/' ||
    pathname === '/blog' ||
    pathname.startsWith('/blog/') ||
    pathname === '/tools' ||
    pathname.startsWith('/tools/') ||
    pathname === '/models' ||
    pathname.startsWith('/models/') ||
    pathname === '/sitemap.xml' ||
    pathname === '/llms.txt' ||
    pathname === '/llms-full.txt';
  if (!externalContentRoute) return response;

  const headers = new Headers(response.headers);
  headers.set('Cache-Control', 'no-store');
  headers.set('Retry-After', '60');
  return new Response(response.body, {
    status: 503,
    statusText: 'Service Unavailable',
    headers,
  });
}

function appendVary(headers: Headers, value: string) {
  const vary = headers.get('Vary');
  if (!vary) {
    headers.set('Vary', value);
    return;
  }
  const values = vary.split(',').map((item) => item.trim().toLowerCase());
  if (!values.includes(value.toLowerCase())) {
    headers.set('Vary', `${vary}, ${value}`);
  }
}

function compressNodeHtmlResponse(req: Request, response: Response): Response {
  // Cloudflare negotiates Brotli/gzip at the edge. Compress only the Node
  // server output so local/Node production does not send the inlined CSS as
  // an uncompressed HTML stream or double-compress Workers responses.
  if ((globalThis as any).__CF_ENV__) return response;
  if (req.method === 'HEAD' || !response.body) return response;
  if (response.headers.has('Content-Encoding')) return response;
  if (!/\bgzip\b/i.test(req.headers.get('Accept-Encoding') || '')) {
    return response;
  }
  const contentType = response.headers.get('Content-Type') || '';
  if (!contentType.toLowerCase().includes('text/html')) return response;

  const headers = new Headers(response.headers);
  headers.delete('Content-Length');
  headers.set('Content-Encoding', 'gzip');
  appendVary(headers, 'Accept-Encoding');

  return new Response(
    response.body.pipeThrough(new CompressionStream('gzip')),
    {
      status: response.status,
      statusText: response.statusText,
      headers,
    }
  );
}

// Custom server entry — wraps every request in Paraglide's middleware so
// getLocale() resolves per-request (AsyncLocalStorage) during SSR.
export default {
  async fetch(req: Request): Promise<Response> {
    await ensureCloudflareEnv();
    const response = await paraglideMiddleware(req, () => handler.fetch(req));
    const utmSource = new URL(req.url).searchParams.get('utm_source');
    const existing = getCookieFromHeader(
      req.headers.get('cookie'),
      'utm_source'
    );
    if (utmSource && !existing) {
      const sanitized = utmSource.replace(/[^\w.\-]/g, '').slice(0, 100);
      if (sanitized) {
        response.headers.append(
          'Set-Cookie',
          `utm_source=${sanitized}; Max-Age=2592000; Path=/; SameSite=Lax`
        );
      }
    }
    return compressNodeHtmlResponse(
      req,
      normalizeExternalContentFailure(req, response)
    );
  },
};
