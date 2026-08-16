import { readFileSync } from 'node:fs';
import { tanstackStart } from '@tanstack/react-start/plugin/vite';
import { paraglideVitePlugin } from '@inlang/paraglide-js';
import mdx from '@mdx-js/rollup';
import tailwindcss from '@tailwindcss/vite';
import viteReact from '@vitejs/plugin-react';
import { nitro } from 'nitro/vite';
import { defineConfig } from 'vite';

import { loadEnvFiles } from './src/lib/env';

// Populate process.env from .env.local / .env.{NODE_ENV} / .env for the
// dev server and build process (Vite only exposes VITE_* via import.meta.env;
// server code reads secrets from process.env). In production, env comes
// from the actual host/container environment.
loadEnvFiles();

type LocaleSettings = {
  baseLocale: string;
  locales: string[];
};

function readLocaleSettings(): LocaleSettings {
  const settings = JSON.parse(
    readFileSync(
      new URL('./project.inlang/settings.json', import.meta.url),
      'utf8'
    )
  ) as Partial<LocaleSettings>;
  const locales = settings.locales || [];
  const baseLocale = settings.baseLocale || '';
  const invalidLocale = locales.find(
    (locale) => !/^[A-Za-z0-9]+(?:-[A-Za-z0-9]+)*$/.test(locale)
  );
  if (
    !baseLocale ||
    locales.length === 0 ||
    !locales.includes(baseLocale) ||
    new Set(locales).size !== locales.length ||
    invalidLocale
  ) {
    throw new Error('Invalid locales in project.inlang/settings.json');
  }
  return { baseLocale, locales };
}

const localeSettings = readLocaleSettings();
const localePatternOrder = [
  ...localeSettings.locales.filter(
    (locale) => locale !== localeSettings.baseLocale
  ),
  localeSettings.baseLocale,
];

function localizedPattern(pattern: string): Array<[string, string]> {
  // Non-base patterns must precede the catch-all base pattern. Otherwise
  // `/:path(.*)?` consumes `/zh/...` before Paraglide can strip the prefix.
  return localePatternOrder.map((locale) => [
    locale,
    locale === localeSettings.baseLocale
      ? pattern
      : pattern === '/'
        ? `/${locale}`
        : `/${locale}${pattern}`,
  ]);
}

// Cloudflare Workers build (pnpm cf:build / cf:deploy): stub out unused DB
// drivers — mysql2 crashes workerd at module evaluation (node:net,
// node:process requires); postgres.js runs fine under nodejs_compat but is
// dead weight when the backend is D1. Which driver the bundle keeps follows
// wrangler.jsonc `vars.DATABASE_PROVIDER` (the runtime truth on workerd) —
// d1 stubs both, postgresql keeps postgres.js for the Hyperdrive binding.
const isCloudflareBuild = (process.env.NITRO_PRESET || '').includes(
  'cloudflare'
);
const driverStub = new URL('./src/core/db/driver-stub.ts', import.meta.url)
  .pathname;

// The agent SDK reaches MCP servers through @modelcontextprotocol/sdk, whose
// OAuth helper (pkce-challenge) publishes no workerd export — the bundler
// fails on it even though the import is dynamic and this app configures no
// MCP servers at all. Stub it for the Workers build; if an MCP connection is
// ever attempted there, the stub throws with the reason.
const mcpStub = new URL('./src/modules/agent/mcp-stub.ts', import.meta.url)
  .pathname;

// Prefer wrangler.jsonc over the build-time env, which can be polluted by
// .env.local (e.g. DATABASE_PROVIDER=sqlite for local dev).
function workersDbProvider(): string {
  try {
    const raw = readFileSync(
      new URL('./wrangler.jsonc', import.meta.url),
      'utf8'
    );
    const m = raw.match(/"DATABASE_PROVIDER"\s*:\s*"([^"]+)"/);
    if (m) return m[1];
  } catch {
    // no wrangler.jsonc yet (fresh clone) — fall through
  }
  return process.env.DATABASE_PROVIDER || 'd1';
}

const workersDb = isCloudflareBuild ? workersDbProvider() : '';
const keepPostgres = workersDb === 'postgresql' || workersDb === 'postgres';

export default defineConfig({
  server: {
    port: 3000,
    // Cloud sandboxes (ShipAny Code / e2b) proxy the dev server through a
    // per-sandbox subdomain; without this Vite's host check blocks the
    // preview with "Blocked request. This host is not allowed."
    allowedHosts: ['.e2b.app'],
  },
  resolve: {
    tsconfigPaths: true,
    alias: isCloudflareBuild
      ? {
          mysql2: driverStub,
          ...(keepPostgres ? {} : { postgres: driverStub }),
          'pkce-challenge': mcpStub,
        }
      : {},
  },
  plugins: [
    {
      name: 'client-code-splitting',
      configEnvironment(name, _config, env) {
        if (env.command !== 'build' || env.isSsrBuild || name !== 'client') {
          return;
        }
        return {
          build: {
            rolldownOptions: {
              output: {
                codeSplitting: {
                  groups: [
                    {
                      name: 'react-core',
                      test: /node_modules[\\/](?:react|react-dom|scheduler)(?:[\\/]|$)/,
                      priority: 30,
                    },
                    {
                      name: 'tanstack-router',
                      test: /node_modules[\\/]@tanstack[\\/](?:history|react-router|router-core)(?:[\\/]|$)/,
                      priority: 25,
                    },
                    {
                      name: 'tanstack-start',
                      test: /node_modules[\\/]@tanstack[\\/]start-client-core(?:[\\/]|$)/,
                      maxSize: 450_000,
                      priority: 20,
                    },
                    {
                      name: 'lucide-icons',
                      test: /node_modules[\\/]lucide-react(?:[\\/]|$)/,
                      priority: 15,
                    },
                    {
                      name: 'tanstack-query',
                      test: /node_modules[\\/]@tanstack[\\/](?:query-core|react-query)(?:[\\/]|$)/,
                      priority: 10,
                    },
                  ],
                },
              },
            },
          },
        };
      },
    },
    // MDX must run before the react plugin so JSX in compiled MDX gets transformed.
    { enforce: 'pre', ...mdx({ providerImportSource: '@mdx-js/react' }) },
    tailwindcss(),
    paraglideVitePlugin({
      project: './project.inlang',
      outdir: './src/paraglide',
      outputStructure: 'message-modules',
      cookieName: 'PARAGLIDE_LOCALE',
      strategy: ['url', 'cookie', 'baseLocale'],
      urlPatterns: [
        // API endpoints are never locale-prefixed.
        {
          pattern: '/api/:path(.*)?',
          localized: [
            localeSettings.baseLocale,
            ...localeSettings.locales.filter(
              (locale) => locale !== localeSettings.baseLocale
            ),
          ].map((locale): [string, string] => [locale, '/api/:path(.*)?']),
        },
        // Bare locale homes match without a trailing-slash redirect.
        {
          pattern: '/',
          localized: localizedPattern('/'),
        },
        // "as-needed" prefix: every non-base locale uses /<locale>.
        {
          pattern: '/:path(.*)?',
          localized: localizedPattern('/:path(.*)?'),
        },
      ],
    }),
    tanstackStart({
      srcDirectory: 'src',
    }),
    viteReact(),
    nitro(),
  ],
});
