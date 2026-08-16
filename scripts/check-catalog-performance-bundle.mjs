import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { gzipSync } from 'node:zlib';

const assetsRoot = path.resolve('.output/public/assets');
const serverRoot = path.resolve('.output/server');
const MAX_RENDER_BLOCKING_CSS_BYTES = 200 * 1024;
const MAX_RENDER_BLOCKING_CSS_GZIP_BYTES = 30 * 1024;
const MAX_CATALOG_DETAIL_INITIAL_JS_GZIP_BYTES = 380 * 1024;

async function filesUnder(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await filesUnder(absolute)));
    else if (entry.isFile()) files.push(absolute);
  }
  return files;
}

const files = await filesUnder(assetsRoot);
const cssFiles = files.filter((file) => file.endsWith('.css'));
if (cssFiles.length === 0) {
  throw new Error('Catalog performance check failed: no production CSS found');
}

let cssBytes = 0;
let cssGzipBytes = 0;
for (const file of cssFiles) {
  const css = await readFile(file);
  const source = css.toString('utf8');
  if (/fonts\.(?:googleapis|gstatic)\.com/.test(source)) {
    throw new Error(
      `Catalog performance check failed: ${path.basename(file)} introduces a Google font dependency chain`
    );
  }
  cssBytes += css.byteLength;
  cssGzipBytes += gzipSync(css, { level: 9 }).byteLength;
}

if (
  cssBytes > MAX_RENDER_BLOCKING_CSS_BYTES ||
  cssGzipBytes > MAX_RENDER_BLOCKING_CSS_GZIP_BYTES
) {
  throw new Error(
    `Catalog performance check failed: CSS budget exceeded (${cssBytes} raw / ${cssGzipBytes} gzip bytes)`
  );
}

const serverFiles = await filesUnder(serverRoot);
const startManifestFiles = serverFiles.filter((file) =>
  path.basename(file).startsWith('_tanstack-start-manifest_v-')
);
if (startManifestFiles.length === 0) {
  throw new Error(
    'Catalog performance check failed: TanStack Start manifest not found'
  );
}
const hasInlineCss = (
  await Promise.all(startManifestFiles.map((file) => readFile(file, 'utf8')))
).some((source) => /inlineCss:\s*\{\s*styles:\s*\{/.test(source));
if (!hasInlineCss) {
  throw new Error(
    'Catalog performance check failed: production CSS is not inlined'
  );
}

const manifestModule = await import(
  `${pathToFileURL(startManifestFiles[0]).href}?catalog-performance=${Date.now()}`
);
const startManifest = manifestModule.tsrStartManifest?.();
const rootRoute = startManifest?.routes?.__root__;
const toolDetailRoute = startManifest?.routes?.['/tools/$slug'];
if (!rootRoute || !toolDetailRoute) {
  throw new Error(
    'Catalog performance check failed: catalog detail route manifest is missing'
  );
}

const staticImportPattern = /\bfrom\s*["']\.\/([^"']+\.js)["']/g;
const initialCatalogAssets = new Set([
  ...(rootRoute.preloads ?? []),
  ...(toolDetailRoute.preloads ?? []),
]);
const catalogAssets = new Set();
const queue = [...initialCatalogAssets];
while (queue.length > 0) {
  const asset = queue.shift();
  if (!asset?.endsWith('.js') || catalogAssets.has(asset)) continue;
  catalogAssets.add(asset);
  const file = path.join(assetsRoot, asset.replace(/^\/assets\//, ''));
  const source = await readFile(file, 'utf8');
  for (const match of source.matchAll(staticImportPattern)) {
    queue.push(`/assets/${match[1]}`);
  }
}

let catalogDetailJsGzipBytes = 0;
for (const asset of catalogAssets) {
  const file = path.join(assetsRoot, asset.replace(/^\/assets\//, ''));
  catalogDetailJsGzipBytes += gzipSync(await readFile(file), {
    level: 9,
  }).byteLength;
}
if (catalogDetailJsGzipBytes > MAX_CATALOG_DETAIL_INITIAL_JS_GZIP_BYTES) {
  throw new Error(
    `Catalog performance check failed: initial tool-detail JS is ${catalogDetailJsGzipBytes} gzip bytes; budget is ${MAX_CATALOG_DETAIL_INITIAL_JS_GZIP_BYTES}`
  );
}

console.log(
  `Catalog performance bundle check passed: ${cssFiles.length} inlined CSS file(s), ${cssBytes} raw / ${cssGzipBytes} gzip bytes, ${catalogDetailJsGzipBytes} initial detail JS gzip bytes, no Google font chain.`
);
