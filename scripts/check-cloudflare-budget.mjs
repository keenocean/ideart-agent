import { spawnSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { gzipSync } from 'node:zlib';

const cwd = process.cwd();
if (process.argv.includes('--run')) {
  const result = spawnSync(
    process.execPath,
    ['scripts/cloudflare-dry-run.mjs'],
    {
      cwd,
      stdio: 'inherit',
      env: process.env,
    }
  );
  if (result.status !== 0) process.exit(result.status ?? 1);
}

const config = JSON.parse(
  readFileSync(path.join(cwd, 'config/marketing-quality.json'), 'utf8')
).cloudflare;
if (
  !Number.isInteger(config.staticAssetCountBudget) ||
  config.staticAssetCountBudget <= 0
) {
  throw new Error(
    'Cloudflare staticAssetCountBudget must be a positive integer'
  );
}
const bundleDir = path.join(cwd, '.output/cloudflare-dry-run');
const publicDir = path.join(cwd, '.output/public');
if (!existsSync(bundleDir)) {
  throw new Error('Cloudflare dry-run output is missing. Run pnpm cf:dry-run.');
}

function filesBelow(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const absolute = path.join(dir, entry.name);
    return entry.isDirectory() ? filesBelow(absolute) : [absolute];
  });
}

const workerFiles = filesBelow(bundleDir).filter(
  (file) => /\.(?:js|mjs)$/.test(file) && !file.endsWith('.map')
);
const workerRawBytes = workerFiles.reduce(
  (total, file) => total + statSync(file).size,
  0
);
const workerGzipBytes = workerFiles.reduce(
  (total, file) => total + gzipSync(readFileSync(file)).byteLength,
  0
);
const staticAssets = filesBelow(publicDir);
const largestStaticAssetBytes = staticAssets.reduce(
  (largest, file) => Math.max(largest, statSync(file).size),
  0
);
const budget =
  config.plan === 'paid'
    ? config.paidWorkerGzipBudgetBytes
    : config.workerGzipBudgetBytes;
const report = {
  plan: config.plan,
  workerFiles: workerFiles.length,
  workerRawBytes,
  workerGzipBytes,
  workerGzipBudgetBytes: budget,
  staticAssetCount: staticAssets.length,
  staticAssetCountBudget: config.staticAssetCountBudget,
  largestStaticAssetBytes,
  singleStaticAssetMaxBytes: config.singleStaticAssetMaxBytes,
};
console.log(JSON.stringify(report, null, 2));
if (workerGzipBytes > budget) {
  throw new Error(
    `Cloudflare Worker gzip budget exceeded: ${workerGzipBytes} > ${budget}`
  );
}
if (largestStaticAssetBytes > config.singleStaticAssetMaxBytes) {
  throw new Error(
    `Cloudflare static asset limit exceeded: ${largestStaticAssetBytes} > ${config.singleStaticAssetMaxBytes}`
  );
}
if (staticAssets.length > config.staticAssetCountBudget) {
  throw new Error(
    `Cloudflare static asset count exceeded: ${staticAssets.length} > ${config.staticAssetCountBudget}`
  );
}
