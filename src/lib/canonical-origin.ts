import { envConfigs } from '@/config';

/**
 * Host canonicalization, done in the Worker instead of the Cloudflare dashboard.
 *
 * A deployment reachable on more than one origin — `http://` as well as
 * `https://`, `www.` as well as the apex — serves the same page under several
 * URLs. Search Console reports those as duplicates, and the fix has always
 * lived in per-zone dashboard settings ("Always Use HTTPS", a www redirect
 * rule) that are easy to forget on the next project.
 *
 * `VITE_APP_URL` already declares the one origin the app considers canonical:
 * it is what `buildAbsoluteSeoUrl` stamps into every canonical link, hreflang
 * and sitemap entry. So the same value can drive a redirect, and any project
 * built on this template gets the behaviour by configuring the variable it had
 * to configure anyway.
 */

/**
 * Hosts that legitimately serve the app under a name that is not the canonical
 * origin, and must never be redirected away from: local development, the Node
 * production server, and e2b sandbox previews, which proxy a `VITE_APP_URL` of
 * `localhost:3000` through `<port>-<sandbox>.e2b.app` (see AGENTS.md).
 *
 * `workers.dev` is deliberately absent. Once a project has a custom domain,
 * its `<worker>.<subdomain>.workers.dev` URL serves the identical site under a
 * second origin that Google can and does find, which is the duplicate this
 * whole module exists to prevent. A deployment still on the default URL has it
 * as its own `VITE_APP_URL`, so the host matches and nothing redirects.
 */
const EXEMPT_HOSTS = new Set(['localhost', '127.0.0.1', '::1', '0.0.0.0']);
const EXEMPT_HOST_SUFFIXES = ['.localhost', '.local', '.e2b.app'];

function isExemptHost(host: string): boolean {
  return (
    EXEMPT_HOSTS.has(host) ||
    EXEMPT_HOST_SUFFIXES.some((suffix) => host.endsWith(suffix))
  );
}

/**
 * The scheme the *client* used, which is not always the scheme of `req.url`.
 *
 * `cf-visitor` is set by the Cloudflare edge and stripped from client-supplied
 * headers, so it is the trustworthy signal on Workers. `x-forwarded-proto`
 * covers the Node server behind a TLS-terminating proxy — without it, such a
 * deployment would redirect to HTTPS, be handed back over HTTP by the proxy,
 * and loop.
 */
export function resolveRequestScheme(req: Request, url: URL): string {
  const visitor = req.headers.get('cf-visitor');
  if (visitor) {
    try {
      const scheme = (JSON.parse(visitor) as { scheme?: unknown }).scheme;
      if (typeof scheme === 'string' && scheme) return scheme.toLowerCase();
    } catch {
      // Malformed header — fall through to the next signal.
    }
  }
  const forwarded = req.headers.get('x-forwarded-proto');
  if (forwarded) {
    const first = forwarded.split(',')[0]?.trim().toLowerCase();
    if (first) return first;
  }
  return url.protocol.replace(/:$/, '');
}

/**
 * A permanent redirect to the canonical origin, or `null` when the request is
 * already canonical (or arrives on a host that is exempt from the rule).
 *
 * Returns 301 for GET/HEAD and 308 for everything else, so a mis-configured
 * webhook posting to the wrong origin keeps its method and body.
 */
export function buildCanonicalOriginRedirect(
  req: Request,
  appUrl: string = envConfigs.app_url
): Response | null {
  let canonical: URL;
  try {
    canonical = new URL(appUrl);
  } catch {
    return null;
  }

  // Only a real HTTPS production origin is worth enforcing. A local or
  // preview `VITE_APP_URL` means there is no canonical host yet.
  if (canonical.protocol !== 'https:') return null;

  const url = new URL(req.url);
  const host = url.hostname.toLowerCase();
  if (isExemptHost(host)) return null;

  const scheme = resolveRequestScheme(req, url);
  if (scheme === 'https' && host === canonical.hostname.toLowerCase()) {
    return null;
  }

  const target = new URL(canonical.origin);
  target.pathname = url.pathname;
  target.search = url.search;

  return new Response(null, {
    status: req.method === 'GET' || req.method === 'HEAD' ? 301 : 308,
    headers: {
      Location: target.href,
      'Cache-Control': 'public, max-age=3600',
      Vary: 'Host',
    },
  });
}
