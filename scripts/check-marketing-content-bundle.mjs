import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

const outputRoot = path.resolve('.output');
const publicRoot = path.join(outputRoot, 'public');
const forbidden = [
  'A studio product photo of a translucent orange water bottle',
  '把文字提示变成静态图片，并在同一个 Agent 对话中继续调整方向',
  'tools-ai-image-generator-c59b7a4f2cbfdc3b',
  'product/marketing/tools/',
  'product/marketing/assets.json',
];

async function filesUnder(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await filesUnder(absolute)));
    else if (entry.isFile() && /\.(?:js|mjs|cjs|json|html)$/.test(entry.name)) {
      files.push(absolute);
    }
  }
  return files;
}

const offenders = [];
for (const file of await filesUnder(outputRoot)) {
  const contents = await readFile(file, 'utf8');
  const marker = forbidden.find((candidate) => contents.includes(candidate));
  if (marker) {
    offenders.push(`${path.relative(process.cwd(), file)}: ${marker}`);
  }
}

for (const file of await filesUnder(publicRoot)) {
  const contents = await readFile(file, 'utf8');
  if (contents.includes('node:fs/promises')) {
    offenders.push(
      `${path.relative(process.cwd(), file)}: server-only marketing filesystem import`
    );
  }
}

if (offenders.length > 0) {
  console.error(
    'Marketing release content leaked into the application bundle:'
  );
  for (const offender of offenders) console.error(`- ${offender}`);
  process.exitCode = 1;
} else {
  console.log(
    'Marketing content bundle check passed: page bodies and asset inventory are external.'
  );
}
