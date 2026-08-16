import { existsSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';

const assetsDir = path.join(process.cwd(), '.output/public/assets');
if (!existsSync(assetsDir)) {
  throw new Error('Client build output is missing. Run pnpm build first.');
}

const chunks = readdirSync(assetsDir).filter((file) => file.endsWith('.js'));
const chunkSet = new Set(chunks);
const importPattern = /(?:\bfrom|\bimport)\s*["']\.\/([^"']+\.js)["']/g;
const graph = new Map();

for (const chunk of chunks) {
  const source = readFileSync(path.join(assetsDir, chunk), 'utf8');
  graph.set(chunk, [
    ...new Set(
      [...source.matchAll(importPattern)]
        .map((match) => match[1])
        .filter((dependency) => chunkSet.has(dependency))
    ),
  ]);
}

let nextIndex = 0;
const indices = new Map();
const lowLinks = new Map();
const stack = [];
const onStack = new Set();
const cycles = [];

function visit(chunk) {
  indices.set(chunk, nextIndex);
  lowLinks.set(chunk, nextIndex);
  nextIndex += 1;
  stack.push(chunk);
  onStack.add(chunk);

  for (const dependency of graph.get(chunk) ?? []) {
    if (!indices.has(dependency)) {
      visit(dependency);
      lowLinks.set(
        chunk,
        Math.min(lowLinks.get(chunk), lowLinks.get(dependency))
      );
    } else if (onStack.has(dependency)) {
      lowLinks.set(
        chunk,
        Math.min(lowLinks.get(chunk), indices.get(dependency))
      );
    }
  }

  if (lowLinks.get(chunk) !== indices.get(chunk)) return;

  const component = [];
  let current;
  do {
    current = stack.pop();
    onStack.delete(current);
    component.push(current);
  } while (current !== chunk);

  if (
    component.length > 1 ||
    (graph.get(component[0]) ?? []).includes(component[0])
  ) {
    cycles.push(component.sort());
  }
}

for (const chunk of chunks) {
  if (!indices.has(chunk)) visit(chunk);
}

if (cycles.length > 0) {
  console.error('Circular client chunk dependencies detected:');
  for (const cycle of cycles) console.error(`- ${cycle.join(' -> ')}`);
  process.exitCode = 1;
} else {
  console.log(
    `Client chunk graph check passed: ${chunks.length} chunks, 0 cycles.`
  );
}
