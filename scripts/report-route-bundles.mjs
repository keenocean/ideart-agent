import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { gzipSync } from 'node:zlib';

const cwd = process.cwd();
const config = JSON.parse(
  readFileSync(path.join(cwd, 'config/marketing-quality.json'), 'utf8')
);
const serverDir = path.join(cwd, '.output/server');
const publicDir = path.join(cwd, '.output/public');
if (!existsSync(serverDir) || !existsSync(publicDir)) {
  throw new Error('Build output is missing. Run pnpm build first.');
}

const manifestFile = readdirSync(serverDir).find((file) =>
  file.startsWith('_tanstack-start-manifest_')
);
if (!manifestFile) throw new Error('TanStack Start manifest was not found.');
const manifestModule = await import(
  `${pathToFileURL(path.join(serverDir, manifestFile)).href}?t=${Date.now()}`
);
const manifest = manifestModule.tsrStartManifest();
const routes = manifest.routes;

const parents = new Map();
for (const [id, route] of Object.entries(routes)) {
  for (const child of route.children ?? []) parents.set(child, id);
}

function routeChain(routeId) {
  const chain = [];
  let current = routeId;
  while (current) {
    chain.unshift(current);
    current = parents.get(current);
  }
  if (routeId !== '__root__' && chain[0] !== '__root__')
    chain.unshift('__root__');
  return chain;
}

function assetFile(asset) {
  return path.join(publicDir, asset.replace(/^\//, ''));
}

const staticImportPattern = /\bfrom\s*["']\.\/([^"']+\.js)["']/g;

function collectTransitive(initialAssets) {
  const found = new Set();
  const queue = [...initialAssets];
  while (queue.length) {
    const asset = queue.shift();
    if (found.has(asset)) continue;
    const file = assetFile(asset);
    if (!existsSync(file)) throw new Error(`Missing client asset: ${asset}`);
    found.add(asset);
    if (!asset.endsWith('.js')) continue;
    const source = readFileSync(file, 'utf8');
    for (const match of source.matchAll(staticImportPattern)) {
      queue.push(`/assets/${match[1]}`);
    }
  }
  return [...found].sort();
}

function sizes(assets) {
  let rawBytes = 0;
  let gzipBytes = 0;
  for (const asset of assets) {
    const body = readFileSync(assetFile(asset));
    rawBytes += body.byteLength;
    gzipBytes += gzipSync(body).byteLength;
  }
  return { rawBytes, gzipBytes };
}

const reports = config.routeBundle.representativeRouteIds.map((routeId) => {
  if (!routes[routeId])
    throw new Error(`Unknown representative route: ${routeId}`);
  const chain = routeChain(routeId);
  const initialAssets = chain.flatMap((id) => routes[id]?.preloads ?? []);
  const assets = collectTransitive(initialAssets);
  return { routeId, chain, assets, ...sizes(assets) };
});

const allAssets = readdirSync(path.join(publicDir, 'assets'));
const messages = allAssets
  .filter((file) => /^messages-.*\.js$/.test(file))
  .map((file) => {
    const body = readFileSync(path.join(publicDir, 'assets', file));
    return {
      asset: `/assets/${file}`,
      rawBytes: body.byteLength,
      gzipBytes: gzipSync(body).byteLength,
      rootPreloaded: (routes.__root__?.preloads ?? []).includes(
        `/assets/${file}`
      ),
    };
  });

const result = {
  generatedFrom: path.relative(cwd, path.join(serverDir, manifestFile)),
  routes: reports,
  messages,
};

if (process.argv.includes('--json')) {
  console.log(JSON.stringify(result, null, 2));
} else {
  console.log('Route bundle report (raw / gzip / assets)');
  for (const report of reports) {
    console.log(
      `${report.routeId}: ${report.rawBytes} / ${report.gzipBytes} / ${report.assets.length}`
    );
  }
  for (const message of messages) {
    console.log(
      `messages: ${message.rawBytes} / ${message.gzipBytes} / root-preloaded=${message.rootPreloaded}`
    );
  }
}
