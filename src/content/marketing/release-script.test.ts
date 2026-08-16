import { spawnSync } from 'node:child_process';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

describe('Marketing Content release builder', () => {
  it('builds an empty release before a product publishes Catalog content', async () => {
    const root = await mkdtemp(
      path.join(tmpdir(), 'marketing-content-release-empty-test-')
    );
    try {
      const source = path.join(root, 'source');
      const output = path.join(root, 'output');
      const indexFile = path.join(root, 'release-index.ts');
      await mkdir(source, { recursive: true });
      await writeFile(
        path.join(source, 'assets.json'),
        JSON.stringify({
          schemaVersion: 1,
          publicDomain: 'https://example.invalid',
          assets: [],
        })
      );

      const result = spawnSync(
        process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm',
        [
          'exec',
          'tsx',
          path.resolve('scripts/marketing-content-release.ts'),
          `--source=${source}`,
          `--output=${output}`,
          `--index-file=${indexFile}`,
          '--sync-index',
        ],
        { encoding: 'utf8' }
      );

      expect(result.status, result.stderr || result.stdout).toBe(0);
      expect(result.stdout).toContain(
        'Built 0 marketing pages, 0 directories, and 0 projections'
      );
      const pointer = JSON.parse(
        await readFile(path.join(output, 'current.json'), 'utf8')
      ) as { releaseId: string; manifestKey: string };
      const manifest = JSON.parse(
        await readFile(path.join(output, pointer.manifestKey), 'utf8')
      ) as {
        pages: unknown[];
        directories: unknown[];
        projections: unknown[];
      };
      expect(manifest).toMatchObject({
        pages: [],
        directories: [],
        projections: [],
      });
      expect(await readFile(indexFile, 'utf8')).toContain(
        'export const marketingPageKeys = [] as const;'
      );
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });
});
