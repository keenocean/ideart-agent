import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { extname, join, relative, resolve } from 'node:path';

const projectRoot = resolve(import.meta.dirname, '..');
const postsDir = join(projectRoot, 'src/content/posts');
const outputDir = join(projectRoot, '.output');

function walk(directory) {
  if (!existsSync(directory)) return [];
  return readdirSync(directory).flatMap((entry) => {
    const path = join(directory, entry);
    return statSync(path).isDirectory() ? walk(path) : [path];
  });
}

const sourceFiles = [
  join(projectRoot, 'vite.config.ts'),
  ...walk(join(projectRoot, 'src')),
]
  .filter((path) => !path.startsWith(`${postsDir}/`))
  .filter((path) =>
    ['.ts', '.tsx', '.js', '.jsx', '.mjs'].includes(extname(path))
  );

const forbiddenRuntimeReferences = [
  'virtual:blog-post-raw',
  'BLOG_POST_SLUGS',
  'getLocalPostLocales',
  'getLocalPosts',
  'loadLocalPost',
  '/src/content/posts/*.mdx',
  '@/content/posts/raw',
];

const sourceLeaks = sourceFiles.flatMap((path) => {
  const source = readFileSync(path, 'utf8');
  return forbiddenRuntimeReferences
    .filter((reference) => source.includes(reference))
    .map((reference) => `${relative(projectRoot, path)} -> ${reference}`);
});

if (sourceLeaks.length > 0) {
  console.error(
    'Blog content must stay outside the application runtime bundle. Remove these references:'
  );
  for (const leak of sourceLeaks) console.error(`- ${leak}`);
  process.exit(1);
}

if (!existsSync(outputDir)) {
  console.error('Missing .output; run this check after a production build.');
  process.exit(1);
}

const localPostSlugs = existsSync(postsDir)
  ? [
      ...new Set(
        readdirSync(postsDir)
          .filter((file) => /\.(?:md|mdx)$/.test(file))
          .map((file) => file.replace(/\.[^.]+\.(?:md|mdx)$/, ''))
      ),
    ]
  : [];

const bundledSlugs = [];
for (const path of walk(outputDir)) {
  const stats = statSync(path);
  if (stats.size > 25 * 1024 * 1024) continue;
  const output = readFileSync(path, 'utf8');
  for (const slug of localPostSlugs) {
    if (output.includes(slug)) {
      bundledSlugs.push(`${slug} in ${relative(projectRoot, path)}`);
    }
  }
}

if (bundledSlugs.length > 0) {
  console.error('Local blog content leaked into the deployment output:');
  for (const leak of [...new Set(bundledSlugs)]) console.error(`- ${leak}`);
  process.exit(1);
}

console.log(
  `Blog bundle check passed: ${localPostSlugs.length} local post source(s) remain outside .output.`
);
