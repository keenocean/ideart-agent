import { spawnSync } from 'node:child_process';
import { mkdtemp, readdir, readFile, rm, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

const fixtureCount = 100;
const root = await mkdtemp(path.join(tmpdir(), 'marketing-content-scale-'));

function runBuild(): void {
  const executable = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm';
  const result = spawnSync(
    executable,
    [
      'exec',
      'tsx',
      'scripts/marketing-content-release.ts',
      `--scale-fixtures=${fixtureCount}`,
      `--output=${root}`,
      `--index-file=${path.join(root, 'unused-index.ts')}`,
    ],
    { cwd: process.cwd(), encoding: 'utf8' }
  );
  if (result.status !== 0) {
    throw new Error((result.stderr || result.stdout || '').trim());
  }
}

async function countJsonFiles(directory: string): Promise<number> {
  let count = 0;
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) count += await countJsonFiles(absolute);
    else if (entry.isFile() && entry.name.endsWith('.json')) count += 1;
  }
  return count;
}

try {
  runBuild();
  const pointer = JSON.parse(
    await readFile(path.join(root, 'current.json'), 'utf8')
  ) as { releaseId: string; manifestKey: string };
  const manifest = JSON.parse(
    await readFile(path.join(root, pointer.manifestKey), 'utf8')
  ) as { pages: unknown[]; directories: unknown[] };
  if (manifest.pages.length !== fixtureCount) {
    throw new Error(
      `Expected ${fixtureCount} external page objects, found ${manifest.pages.length}`
    );
  }
  const jsonFiles = await countJsonFiles(root);
  if (jsonFiles !== fixtureCount + manifest.directories.length + 2) {
    throw new Error(`Unexpected scale release file count: ${jsonFiles}`);
  }
  const indexBytes = (
    await stat('src/content/marketing/release-index.generated.ts')
  ).size;
  if (indexBytes > 20 * 1024) {
    throw new Error(`Runtime availability index is too large: ${indexBytes}`);
  }
  console.log(
    `Marketing scale check passed: ${fixtureCount} page bodies stayed in external release objects; runtime index=${indexBytes} bytes.`
  );
} finally {
  await rm(root, { recursive: true, force: true });
}
