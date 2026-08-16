import { readdir, readFile, stat } from 'node:fs/promises';
import { join } from 'node:path';

const root = '.output/public';
const productAgent = JSON.parse(
  await readFile(new URL('../product/agent.json', import.meta.url), 'utf8')
);
const promptMarker = productAgent.defaultSystemPrompt
  ?.split('\n')
  .map((line) => line.trim())
  .find((line) => line.length >= 24);

if (!promptMarker) {
  throw new Error(
    'product/agent.json must contain a distinctive defaultSystemPrompt line'
  );
}

const forbidden = [promptMarker];

async function filesUnder(path) {
  const result = [];
  for (const name of await readdir(path)) {
    const child = join(path, name);
    const info = await stat(child);
    if (info.isDirectory()) result.push(...(await filesUnder(child)));
    else result.push(child);
  }
  return result;
}

const leaks = [];
for (const file of await filesUnder(root)) {
  const content = await readFile(file);
  const text = content.toString('utf8');
  for (const marker of forbidden) {
    if (text.includes(marker)) leaks.push({ file, marker });
  }
}

if (leaks.length > 0) {
  console.error('Agent server-only Prompt content leaked into client output:');
  for (const leak of leaks) console.error(`- ${leak.file}: ${leak.marker}`);
  process.exit(1);
}

console.log('Agent Prompt client-bundle scan passed.');
