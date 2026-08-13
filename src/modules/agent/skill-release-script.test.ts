import { spawnSync } from 'node:child_process';
import {
  mkdir,
  mkdtemp,
  readFile,
  rm,
  symlink,
  writeFile,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

describe('Agent Skill release builder', () => {
  it('builds an empty release for projects without bundled Skills yet', async () => {
    const root = await mkdtemp(
      path.join(tmpdir(), 'agent-skills-release-empty-test-')
    );
    try {
      const source = path.join(root, 'source');
      const output = path.join(root, 'output');
      await mkdir(source, { recursive: true });
      await writeFile(path.join(source, 'catalog.json'), '{"skills":[]}\n');

      const result = spawnSync(
        process.execPath,
        [
          path.resolve('scripts/agent-skills-release.mjs'),
          `--source=${source}`,
          `--output=${output}`,
        ],
        { encoding: 'utf8' }
      );

      expect(result.status).toBe(0);
      expect(result.stdout).toContain('Built 0 prompt skills as release');
      const pointer = JSON.parse(
        await readFile(path.join(output, 'current.json'), 'utf8')
      ) as { releaseId: string; manifestKey: string };
      expect(pointer.releaseId).toMatch(/^[a-f0-9]{64}$/);
      const manifest = JSON.parse(
        await readFile(path.join(output, pointer.manifestKey), 'utf8')
      ) as { skills: unknown[] };
      expect(manifest.skills).toEqual([]);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it('rejects a references directory symlink that escapes the skill package', async () => {
    const root = await mkdtemp(
      path.join(tmpdir(), 'agent-skills-release-test-')
    );
    try {
      const source = path.join(root, 'source');
      const skillDirectory = path.join(source, 'safe-skill');
      const outside = path.join(root, 'outside');
      await Promise.all([
        mkdir(skillDirectory, { recursive: true }),
        mkdir(outside, { recursive: true }),
      ]);
      await Promise.all([
        writeFile(
          path.join(source, 'catalog.json'),
          JSON.stringify({
            skills: [
              {
                slug: 'safe-skill',
                relativeDir: 'safe-skill',
                title: 'Safe Skill',
                summary: 'Fixture',
                compatibilityTier: 'native',
                allowedTools: [],
                unmappedTools: [],
              },
            ],
          })
        ),
        writeFile(path.join(skillDirectory, 'SKILL.md'), '# Safe skill\n'),
        writeFile(path.join(outside, 'secret.md'), '# Must not publish\n'),
      ]);

      try {
        await symlink(outside, path.join(skillDirectory, 'references'), 'dir');
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code === 'EPERM') return;
        throw error;
      }

      const result = spawnSync(
        process.execPath,
        [
          path.resolve('scripts/agent-skills-release.mjs'),
          `--source=${source}`,
          `--output=${path.join(root, 'output')}`,
        ],
        { encoding: 'utf8' }
      );

      expect(result.status).not.toBe(0);
      expect(result.stderr).toContain('References must be a real directory');
      expect(result.stderr).not.toContain('# Must not publish');
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });
});
