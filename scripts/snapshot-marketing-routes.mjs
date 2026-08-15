const baseUrl = process.argv
  .find((argument) => argument.startsWith('--base-url='))
  ?.slice('--base-url='.length)
  .replace(/\/+$/, '');
if (!baseUrl) {
  throw new Error(
    'Usage: pnpm marketing:snapshot-routes -- --base-url=http://localhost:3000'
  );
}

const routes = [
  '/',
  '/zh',
  '/pricing',
  '/zh/pricing',
  '/privacy-policy',
  '/zh/privacy-policy',
  '/terms-of-service',
  '/zh/terms-of-service',
  '/blog',
  '/zh/blog',
  '/robots.txt',
  '/sitemap.xml',
  '/llms.txt',
  '/llms-full.txt',
  '/tools/missing',
  '/zh/tools/missing',
  '/models/missing',
  '/zh/models/missing',
];

function attribute(tag, name) {
  return tag.match(new RegExp(`${name}=["']([^"']*)["']`, 'i'))?.[1] ?? '';
}

function tags(body, name) {
  return [...body.matchAll(new RegExp(`<${name}\\b[^>]*>`, 'gi'))].map(
    (match) => match[0]
  );
}

function metaContent(meta, attributeName, attributeValue) {
  return (
    attribute(
      meta.find((tag) => attribute(tag, attributeName) === attributeValue) ??
        '',
      'content'
    ) || null
  );
}

function jsonLdTypes(body) {
  const types = new Set();
  for (const match of body.matchAll(
    /<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi
  )) {
    try {
      const value = JSON.parse(match[1]);
      const nodes = Array.isArray(value?.['@graph'])
        ? value['@graph']
        : [value];
      for (const node of nodes) {
        if (typeof node?.['@type'] === 'string') types.add(node['@type']);
      }
    } catch {
      types.add('INVALID_JSON_LD');
    }
  }
  return [...types].sort();
}

for (const route of routes) {
  const response = await fetch(`${baseUrl}${route}`, { redirect: 'follow' });
  const body = await response.text();
  const meta = tags(body, 'meta');
  const links = tags(body, 'link');
  const result = {
    route,
    finalUrl: response.url,
    status: response.status,
    contentType: response.headers.get('content-type'),
    xRobotsTag: response.headers.get('x-robots-tag'),
    title: body.match(/<title>([^<]*)<\/title>/i)?.[1] ?? null,
    description: metaContent(meta, 'name', 'description'),
    robots: metaContent(meta, 'name', 'robots'),
    canonical: links
      .filter((tag) => attribute(tag, 'rel') === 'canonical')
      .map((tag) => attribute(tag, 'href')),
    alternates: links
      .filter((tag) => attribute(tag, 'rel') === 'alternate')
      .map((tag) => ({
        locale: attribute(tag, 'hreflang'),
        href: attribute(tag, 'href'),
      })),
    openGraph: {
      type: metaContent(meta, 'property', 'og:type'),
      title: metaContent(meta, 'property', 'og:title'),
      description: metaContent(meta, 'property', 'og:description'),
      url: metaContent(meta, 'property', 'og:url'),
      image: metaContent(meta, 'property', 'og:image'),
    },
    twitter: {
      card: metaContent(meta, 'name', 'twitter:card'),
      title: metaContent(meta, 'name', 'twitter:title'),
      description: metaContent(meta, 'name', 'twitter:description'),
      image: metaContent(meta, 'name', 'twitter:image'),
    },
    article: {
      publishedTime: metaContent(meta, 'property', 'article:published_time'),
      modifiedTime: metaContent(meta, 'property', 'article:modified_time'),
      author: metaContent(meta, 'property', 'article:author'),
    },
    jsonLdScripts: (body.match(/type=["']application\/ld\+json["']/gi) ?? [])
      .length,
    jsonLdTypes: jsonLdTypes(body),
  };
  console.log(JSON.stringify(result));
}
