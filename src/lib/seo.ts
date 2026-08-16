import { envConfigs } from '@/config';
import { openGraphLocales, type AppLocale } from '@/config/locale';
import { baseLocale, locales, localizeUrl } from '@/paraglide/runtime.js';

export type SeoRouteRef = {
  locale: AppLocale;
  path: string;
};

export type SeoSearchPolicy = {
  allowedNames: readonly string[];
  parameters: readonly { name: string; value: string }[];
};

export type SeoImage = {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  type?: string;
};

export type SeoBreadcrumb = {
  name: string;
  route: SeoRouteRef;
};

export type SeoFaq = {
  question: string;
  answer: string;
};

export type SeoAuthor = {
  name: string;
  type?: 'Person' | 'Organization';
};

type SeoBaseInput = {
  title: string;
  description: string;
  canonical: SeoRouteRef;
  canonicalSearch?: SeoSearchPolicy;
  alternates: readonly SeoRouteRef[];
  indexing: 'index' | 'noindex';
  image?: SeoImage;
  breadcrumbs?: readonly SeoBreadcrumb[];
  faq?: readonly SeoFaq[];
};

export type SeoHeadInput =
  | (SeoBaseInput & { kind: 'website' })
  | (SeoBaseInput & {
      kind: 'article';
      headline: string;
      publishedTime: string;
      modifiedTime: string;
      author?: SeoAuthor;
    });

export type SeoMetaTag =
  | { title: string }
  | { name: string; content: string }
  | { property: string; content: string };

export type SeoLinkTag = {
  rel: string;
  href: string;
  hrefLang?: string;
};

export type SeoScriptTag = {
  type: 'application/ld+json';
  children: string;
};

export type SeoHead = {
  meta: SeoMetaTag[];
  links: SeoLinkTag[];
  scripts?: SeoScriptTag[];
};

function normalizedOrigin(value: string): string {
  const url = new URL(value);
  if (url.username || url.password || url.search || url.hash) {
    throw new Error('VITE_APP_URL must be a plain origin');
  }
  if (url.pathname !== '/' && url.pathname !== '') {
    throw new Error('VITE_APP_URL must not contain a path');
  }
  if (
    url.protocol !== 'https:' &&
    !(
      url.protocol === 'http:' &&
      (url.hostname === 'localhost' || url.hostname === '127.0.0.1')
    )
  ) {
    throw new Error('VITE_APP_URL must use HTTPS outside local development');
  }
  return url.origin;
}

export function validateSeoPath(path: string): string {
  if (
    !path.startsWith('/') ||
    path.startsWith('//') ||
    path.includes('?') ||
    path.includes('#') ||
    path.includes('%') ||
    path.includes('\\') ||
    path.includes('/./') ||
    path.includes('/../') ||
    (path.length > 1 && path.endsWith('/'))
  ) {
    throw new Error(`Invalid locale-free SEO path: ${path}`);
  }
  const firstSegment = path.split('/')[1];
  if (firstSegment && locales.includes(firstSegment as AppLocale)) {
    throw new Error(`SEO paths must not contain locale prefixes: ${path}`);
  }
  return path;
}

function searchString(policy?: SeoSearchPolicy): string {
  if (!policy) return '';
  const allowed = new Set(policy.allowedNames);
  const seen = new Set<string>();
  const search = new URLSearchParams();
  for (const parameter of policy.parameters) {
    if (!allowed.has(parameter.name) || seen.has(parameter.name)) {
      throw new Error(`Invalid SEO search parameter: ${parameter.name}`);
    }
    seen.add(parameter.name);
    search.set(parameter.name, parameter.value);
  }
  const value = search.toString();
  return value ? `?${value}` : '';
}

export function buildAbsoluteSeoUrl(
  route: SeoRouteRef,
  options: { appUrl?: string; search?: SeoSearchPolicy } = {}
): string {
  if (!locales.includes(route.locale)) {
    throw new Error(`Unsupported SEO locale: ${route.locale}`);
  }
  const origin = normalizedOrigin(options.appUrl ?? envConfigs.app_url);
  const path = validateSeoPath(route.path);
  const localized = localizeUrl(new URL(path, `${origin}/`), {
    locale: route.locale,
  });
  localized.search = searchString(options.search);
  localized.hash = '';
  return localized.href;
}

export function serializeJsonLd(value: unknown): string {
  return JSON.stringify(value).replace(/</g, '\\u003c');
}

function validateImage(image: SeoImage): void {
  const url = new URL(image.src);
  if (
    url.protocol !== 'https:' &&
    !(
      url.protocol === 'http:' &&
      (url.hostname === 'localhost' || url.hostname === '127.0.0.1')
    )
  ) {
    throw new Error('SEO images must use a public HTTPS URL');
  }
  if (!image.alt.trim()) throw new Error('SEO images require alt text');
  if (
    (image.width !== undefined && image.width <= 0) ||
    (image.height !== undefined && image.height <= 0)
  ) {
    throw new Error('SEO image dimensions must be positive');
  }
}

function uniqueAlternates(
  canonical: SeoRouteRef,
  alternates: readonly SeoRouteRef[],
  indexing: 'index' | 'noindex'
): SeoRouteRef[] {
  if (indexing === 'noindex') return [];
  if (
    !alternates.some(
      (entry) =>
        entry.locale === canonical.locale && entry.path === canonical.path
    )
  ) {
    throw new Error('Indexable SEO alternates must include the canonical');
  }
  const byLocale = new Map<AppLocale, SeoRouteRef>();
  for (const alternate of alternates) {
    validateSeoPath(alternate.path);
    if (byLocale.has(alternate.locale)) {
      throw new Error(`Duplicate SEO alternate locale: ${alternate.locale}`);
    }
    byLocale.set(alternate.locale, alternate);
  }
  return [...byLocale.values()];
}

export function buildSeoHead(input: SeoHeadInput): SeoHead {
  const canonicalUrl = buildAbsoluteSeoUrl(input.canonical, {
    search: input.canonicalSearch,
  });
  const alternates = uniqueAlternates(
    input.canonical,
    input.alternates,
    input.indexing
  );
  if (input.image) validateImage(input.image);

  const meta: SeoMetaTag[] = [
    { title: input.title },
    { name: 'description', content: input.description },
    {
      name: 'robots',
      content: input.indexing === 'index' ? 'index,follow' : 'noindex,follow',
    },
    { property: 'og:type', content: input.kind },
    { property: 'og:site_name', content: envConfigs.app_name },
    { property: 'og:title', content: input.title },
    { property: 'og:description', content: input.description },
    { property: 'og:url', content: canonicalUrl },
    {
      property: 'og:locale',
      content: openGraphLocales[input.canonical.locale],
    },
    ...alternates
      .filter((entry) => entry.locale !== input.canonical.locale)
      .map(
        (entry): SeoMetaTag => ({
          property: 'og:locale:alternate',
          content: openGraphLocales[entry.locale],
        })
      ),
    {
      name: 'twitter:card',
      content: input.image ? 'summary_large_image' : 'summary',
    },
    { name: 'twitter:title', content: input.title },
    { name: 'twitter:description', content: input.description },
  ];

  if (input.image) {
    meta.push(
      { property: 'og:image', content: input.image.src },
      { property: 'og:image:alt', content: input.image.alt },
      ...(input.image.width
        ? ([
            {
              property: 'og:image:width',
              content: String(input.image.width),
            },
          ] satisfies SeoMetaTag[])
        : []),
      ...(input.image.height
        ? ([
            {
              property: 'og:image:height',
              content: String(input.image.height),
            },
          ] satisfies SeoMetaTag[])
        : []),
      ...(input.image.type
        ? ([
            { property: 'og:image:type', content: input.image.type },
          ] satisfies SeoMetaTag[])
        : []),
      { name: 'twitter:image', content: input.image.src },
      { name: 'twitter:image:alt', content: input.image.alt }
    );
  }

  if (input.kind === 'article') {
    meta.push(
      { property: 'article:published_time', content: input.publishedTime },
      { property: 'article:modified_time', content: input.modifiedTime },
      ...(input.author
        ? ([
            { property: 'article:author', content: input.author.name },
          ] satisfies SeoMetaTag[])
        : [])
    );
  }

  const links: SeoLinkTag[] = [
    { rel: 'canonical', href: canonicalUrl },
    ...alternates.map((entry) => ({
      rel: 'alternate',
      hrefLang: entry.locale,
      href: buildAbsoluteSeoUrl(entry),
    })),
  ];
  const defaultAlternate = alternates.find(
    (entry) => entry.locale === baseLocale
  );
  if (defaultAlternate) {
    links.push({
      rel: 'alternate',
      hrefLang: 'x-default',
      href: buildAbsoluteSeoUrl(defaultAlternate),
    });
  }

  const graph: Record<string, unknown>[] = [];
  if (input.kind === 'article') {
    graph.push({
      '@type': 'BlogPosting',
      headline: input.headline,
      description: input.description,
      ...(input.image ? { image: [input.image.src] } : {}),
      datePublished: input.publishedTime,
      dateModified: input.modifiedTime,
      inLanguage: input.canonical.locale,
      mainEntityOfPage: { '@type': 'WebPage', '@id': canonicalUrl },
      author: {
        '@type': input.author?.type ?? 'Organization',
        name: input.author?.name ?? envConfigs.app_name,
      },
      publisher: {
        '@type': 'Organization',
        name: envConfigs.app_name,
      },
    });
  }
  if (input.breadcrumbs?.length) {
    graph.push({
      '@type': 'BreadcrumbList',
      itemListElement: input.breadcrumbs.map((breadcrumb, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: breadcrumb.name,
        item: buildAbsoluteSeoUrl(breadcrumb.route),
      })),
    });
  }
  if (input.faq?.length) {
    graph.push({
      '@type': 'FAQPage',
      mainEntity: input.faq.map((item) => ({
        '@type': 'Question',
        name: item.question,
        acceptedAnswer: { '@type': 'Answer', text: item.answer },
      })),
    });
  }

  return {
    meta,
    links,
    ...(graph.length
      ? {
          scripts: [
            {
              type: 'application/ld+json',
              children: serializeJsonLd({
                '@context': 'https://schema.org',
                '@graph': graph,
              }),
            },
          ],
        }
      : {}),
  };
}

export function buildSiteIdentityJsonLd(): string {
  const url = buildAbsoluteSeoUrl({ locale: baseLocale, path: '/' });
  return serializeJsonLd({
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        name: envConfigs.app_name,
        description: envConfigs.app_description,
        url,
      },
      {
        '@type': 'Organization',
        name: envConfigs.app_name,
        url,
      },
    ],
  });
}
