import { spawnSync } from 'node:child_process';
import { mkdir, mkdtemp, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

describe('Agent Skill release builder', () => {
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
