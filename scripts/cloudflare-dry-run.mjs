import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';

const cwd = process.cwd();

function run(command, args) {
  const result = spawnSync(command, args, {
    cwd,
    stdio: 'inherit',
    env: process.env,
  });
  if (result.status !== 0) process.exit(result.status ?? 1);
}

run('pnpm', ['cf:build']);
const generatedConfig = path.join(cwd, '.output/server/wrangler.json');
if (!existsSync(generatedConfig)) {
  throw new Error('Nitro did not generate .output/server/wrangler.json');
}
run('pnpm', [
  'exec',
  'wrangler',
  'deploy',
  '--config',
  generatedConfig,
  '--dry-run',
  '--outdir',
  path.join(cwd, '.output/cloudflare-dry-run'),
]);
