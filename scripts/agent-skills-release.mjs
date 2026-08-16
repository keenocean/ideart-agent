import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import {
  lstat,
  mkdir,
  mkdtemp,
  readdir,
  readFile,
  realpath,
  rm,
  writeFile,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

const SCHEMA_VERSION = 1;
const RELEASE_PREFIX = 'agent-skills/releases';
const MAX_SKILL_OBJECT_BYTES = 512 * 1024;
const SKILL_NAME_PATTERN = /^[a-z0-9][a-z0-9-]{0,127}$/;
const SAFE_DIRECTORY_PATTERN = /^[a-zA-Z0-9._/-]+$/;

function parseArgs(argv) {
  const options = {
    source: 'packages/agent-skills',
    output: '.agent-skills',
    config: 'wrangler.jsonc',
    publish: false,
    syncConfig: false,
    verify: true,
  };
  for (const arg of argv) {
    if (arg === '--') continue;
    if (arg === '--publish') options.publish = true;
    else if (arg === '--sync-config') options.syncConfig = true;
    else if (arg === '--no-verify') options.verify = false;
    else if (arg.startsWith('--source=')) options.source = arg.slice(9);
    else if (arg.startsWith('--output=')) options.output = arg.slice(9);
    else if (arg.startsWith('--bucket=')) options.bucket = arg.slice(9);
    else if (arg.startsWith('--config=')) options.config = arg.slice(9);
    else throw new Error(`Unknown argument: ${arg}`);
  }
  if (options.syncConfig && !options.publish) {
    throw new Error('--sync-config requires --publish');
  }
  if (options.publish && !options.bucket) {
    options.bucket = process.env.AGENT_SKILLS_BUCKET_NAME?.trim();
  }
  if (options.publish && !options.bucket) {
    throw new Error(
      'Publishing requires --bucket=<name> or AGENT_SKILLS_BUCKET_NAME'
    );
  }
  if (options.bucket && !/^[a-z0-9][a-z0-9-]{1,62}$/.test(options.bucket)) {
    throw new Error(`Invalid R2 bucket name: ${options.bucket}`);
  }
  return options;
}

function sha256(value) {
  return createHash('sha256').update(value).digest('hex');
}

function jsonText(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function utf8Bytes(value) {
  return Buffer.byteLength(value, 'utf8');
}

function assertInside(root, candidate, label) {
  const relative = path.relative(root, candidate);
  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    throw new Error(`${label} escapes the skills source directory`);
  }
}

async function readReferences(skillDirectory) {
  const referencesRoot = path.join(skillDirectory, 'references');
  const references = {};

  let referencesStat;
  try {
    referencesStat = await lstat(referencesRoot);
  } catch (error) {
    if (error?.code === 'ENOENT') return references;
    throw error;
  }
  if (referencesStat.isSymbolicLink() || !referencesStat.isDirectory()) {
    throw new Error(`References must be a real directory: ${referencesRoot}`);
  }

  const [skillRealRoot, referencesRealRoot] = await Promise.all([
    realpath(skillDirectory),
    realpath(referencesRoot),
  ]);
  assertInside(
    skillRealRoot,
    referencesRealRoot,
    `References directory "${referencesRoot}"`
  );

  async function walk(directory) {
    const entries = await readdir(directory, { withFileTypes: true });
    entries.sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));
    for (const entry of entries) {
      if (entry.isSymbolicLink()) {
        throw new Error(`Symlinks are not allowed in ${referencesRoot}`);
      }
      const absolute = path.join(directory, entry.name);
      if (entry.isDirectory()) {
        await walk(absolute);
        continue;
      }
      if (!entry.isFile() || path.extname(entry.name).toLowerCase() !== '.md') {
        continue;
      }
      const realFile = await realpath(absolute);
      assertInside(
        referencesRealRoot,
        realFile,
        `Skill reference "${absolute}"`
      );
      const relative = path
        .relative(skillDirectory, absolute)
        .split(path.sep)
        .join('/');
      if (
        !relative.startsWith('references/') ||
        !SAFE_DIRECTORY_PATTERN.test(relative)
      ) {
        throw new Error(`Unsafe skill reference path: ${relative}`);
      }
      references[relative] = await readFile(absolute, 'utf8');
    }
  }

  await walk(referencesRoot);
  return references;
}

function isPromptOnly(skill) {
  return (
    skill?.compatibilityTier === 'native' &&
    (skill.allowedTools?.length ?? 0) === 0 &&
    (skill.unmappedTools?.length ?? 0) === 0
  );
}

async function buildRelease(options) {
  const sourceRoot = path.resolve(options.source);
  const outputRoot = path.resolve(options.output);
  const catalogPath = path.join(sourceRoot, 'catalog.json');
  const catalogText = await readFile(catalogPath, 'utf8');
  const catalog = JSON.parse(catalogText);
  if (!Array.isArray(catalog.skills)) {
    throw new Error('catalog.json must contain a skills array');
  }

  const selected = catalog.skills.filter(isPromptOnly);
  if (selected.length === 0) {
    throw new Error('catalog.json contains no prompt-only Agent Skills');
  }
  selected.sort((a, b) => {
    const left = String(a.title || a.slug);
    const right = String(b.title || b.slug);
    return left === right
      ? String(a.slug).localeCompare(String(b.slug))
      : left < right
        ? -1
        : 1;
  });

  const names = new Set();
  const skillFiles = [];
  const manifestEntries = [];

  for (const skill of selected) {
    if (!SKILL_NAME_PATTERN.test(skill.slug) || names.has(skill.slug)) {
      throw new Error(`Invalid or duplicate prompt skill slug: ${skill.slug}`);
    }
    if (
      typeof skill.relativeDir !== 'string' ||
      !SAFE_DIRECTORY_PATTERN.test(skill.relativeDir) ||
      skill.relativeDir
        .split('/')
        .some((part) => !part || part === '.' || part === '..')
    ) {
      throw new Error(`Invalid skill directory: ${skill.relativeDir}`);
    }
    names.add(skill.slug);

    const skillDirectory = path.resolve(sourceRoot, skill.relativeDir);
    assertInside(sourceRoot, skillDirectory, `Skill "${skill.slug}"`);
    const skillDocument = path.join(skillDirectory, 'SKILL.md');
    assertInside(sourceRoot, skillDocument, `Skill "${skill.slug}" document`);

    const [directoryStat, documentStat] = await Promise.all([
      lstat(skillDirectory),
      lstat(skillDocument),
    ]);
    if (
      directoryStat.isSymbolicLink() ||
      !directoryStat.isDirectory() ||
      documentStat.isSymbolicLink() ||
      !documentStat.isFile()
    ) {
      throw new Error(
        `Skill "${skill.slug}" must use a real directory and SKILL.md file`
      );
    }

    const instructions = await readFile(skillDocument, 'utf8');
    if (!instructions.trim()) {
      throw new Error(`Skill "${skill.slug}" has empty instructions`);
    }
    const references = await readReferences(skillDirectory);
    const object = {
      schemaVersion: SCHEMA_VERSION,
      name: skill.slug,
      title: String(skill.title || skill.slug),
      summary: String(skill.summary || ''),
      instructions,
      references,
    };
    const text = jsonText(object);
    const bytes = utf8Bytes(text);
    if (bytes > MAX_SKILL_OBJECT_BYTES) {
      throw new Error(
        `Skill "${skill.slug}" is ${bytes} bytes; limit is ${MAX_SKILL_OBJECT_BYTES}`
      );
    }
    skillFiles.push({ name: skill.slug, text });
    manifestEntries.push({
      name: object.name,
      title: object.title,
      summary: object.summary,
      bytes,
      sha256: sha256(text),
    });
  }

  const manifestBase = {
    schemaVersion: SCHEMA_VERSION,
    sourceCatalogSha256: sha256(catalogText),
    skills: manifestEntries,
  };
  const releaseId = sha256(JSON.stringify(manifestBase));
  const manifest = { ...manifestBase, releaseId };
  const releaseRoot = path.join(outputRoot, RELEASE_PREFIX, releaseId);
  const skillsRoot = path.join(releaseRoot, 'skills');
  await mkdir(skillsRoot, { recursive: true });

  const files = [];
  for (const skill of skillFiles) {
    const file = path.join(skillsRoot, `${skill.name}.json`);
    await writeFile(file, skill.text, 'utf8');
    files.push({
      key: `${RELEASE_PREFIX}/${releaseId}/skills/${skill.name}.json`,
      file,
      sha256: sha256(skill.text),
    });
  }

  const manifestText = jsonText(manifest);
  const manifestFile = path.join(releaseRoot, 'manifest.json');
  await writeFile(manifestFile, manifestText, 'utf8');
  const manifestUpload = {
    key: `${RELEASE_PREFIX}/${releaseId}/manifest.json`,
    file: manifestFile,
    sha256: sha256(manifestText),
  };
  await mkdir(outputRoot, { recursive: true });
  await writeFile(
    path.join(outputRoot, 'current.json'),
    jsonText({
      schemaVersion: SCHEMA_VERSION,
      releaseId,
      manifestKey: manifestUpload.key,
    }),
    'utf8'
  );

  return {
    releaseId,
    outputRoot,
    promptSkillCount: selected.length,
    files: [...files, manifestUpload],
    manifestUpload,
  };
}

function runWrangler(args) {
  const executable = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm';
  const result = spawnSync(executable, ['exec', 'wrangler', ...args], {
    cwd: process.cwd(),
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  if (result.status !== 0) {
    const detail = (result.stderr || result.stdout || '').trim();
    throw new Error(
      `wrangler ${args.join(' ')} failed${detail ? `: ${detail}` : ''}`
    );
  }
}

async function publishRelease(release, options) {
  // Skill objects go first. The manifest is the release commit marker and is
  // uploaded last, so readers never observe a partially published release.
  const objects = release.files.filter(
    (item) => item !== release.manifestUpload
  );
  for (const object of [...objects, release.manifestUpload]) {
    runWrangler([
      'r2',
      'object',
      'put',
      `${options.bucket}/${object.key}`,
      '--file',
      object.file,
      '--content-type',
      'application/json; charset=utf-8',
      '--cache-control',
      'private, max-age=31536000, immutable',
      '--remote',
      '--force',
      '--config',
      options.config,
    ]);
  }

  if (!options.verify) return;
  const verifyRoot = await mkdtemp(path.join(tmpdir(), 'agent-skills-verify-'));
  try {
    for (const [index, object] of release.files.entries()) {
      const destination = path.join(verifyRoot, `${index}.json`);
      runWrangler([
        'r2',
        'object',
        'get',
        `${options.bucket}/${object.key}`,
        '--file',
        destination,
        '--remote',
        '--config',
        options.config,
      ]);
      const downloaded = await readFile(destination);
      if (sha256(downloaded) !== object.sha256) {
        throw new Error(`Published object failed verification: ${object.key}`);
      }
    }
  } finally {
    await rm(verifyRoot, { recursive: true, force: true });
  }
}

async function syncWranglerConfig(releaseId, configPath) {
  const absolute = path.resolve(configPath);
  const current = await readFile(absolute, 'utf8');
  const pattern = /(\"AGENT_SKILLS_RELEASE\"\s*:\s*\")[^\"]*(\")/;
  if (!pattern.test(current)) {
    throw new Error(
      `${configPath} must define vars.AGENT_SKILLS_RELEASE before --sync-config can update it`
    );
  }
  await writeFile(
    absolute,
    current.replace(pattern, `$1${releaseId}$2`),
    'utf8'
  );
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const release = await buildRelease(options);
  console.log(
    `Built ${release.promptSkillCount} prompt skills as release ${release.releaseId}`
  );
  console.log(`Local release: ${release.outputRoot}`);

  if (!options.publish) return;
  await publishRelease(release, options);
  console.log(
    `${options.verify ? 'Published and verified' : 'Published'} R2 release in ${options.bucket}`
  );
  if (options.syncConfig) {
    await syncWranglerConfig(release.releaseId, options.config);
    console.log(`Updated AGENT_SKILLS_RELEASE in ${options.config}`);
  } else {
    console.log(`Set AGENT_SKILLS_RELEASE=${release.releaseId} before deploy`);
  }
}

await main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
