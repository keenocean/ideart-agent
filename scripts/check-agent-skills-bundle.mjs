import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

const outputRoot = path.resolve('.output');
const forbidden = [
  'Cinematic Style Anchors',
  'product/skills/*/SKILL.md',
  'product/skills/*/references/**/*.md',
];

async function filesUnder(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await filesUnder(absolute)));
    else if (entry.isFile() && /\.(?:js|mjs|cjs|json)$/.test(entry.name)) {
      files.push(absolute);
    }
  }
  return files;
}

const offenders = [];
for (const file of await filesUnder(outputRoot)) {
  const contents = await readFile(file, 'utf8');
  const marker = forbidden.find((candidate) => contents.includes(candidate));
  if (marker)
    offenders.push(`${path.relative(process.cwd(), file)}: ${marker}`);
}

if (offenders.length > 0) {
  console.error('Agent Skill source content leaked into the Worker bundle:');
  for (const offender of offenders) console.error(`- ${offender}`);
  process.exitCode = 1;
} else {
  console.log('Agent Skill bundle check passed: release content is external.');
}
