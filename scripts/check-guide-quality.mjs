/**
 * Guide quality gate — the measurable half of docs/让 AI 写出高质量blog文章.md,
 * docs/seo-blog-instruct-doc.md (section 九) and docs/seo-landingpages-instruct-doc.md
 * (section 九), applied to every product/marketing/guides/<slug>.<locale>.json.
 *
 * Numbers are measured, not estimated, so an agent cannot "declare" a guide done:
 *
 *   FAIL  body words outside 800–3000 (site-wide rule)
 *   FAIL  seo.keyword missing from Title, H1, Description, first 100 words,
 *         first section heading, last section, or figure alt
 *   FAIL  keyword not in the top 3 of the 2-word density table (the AITDK test
 *         the SOP names as the practical density criterion)
 *   FAIL  fewer than 8 outbound references, or any reference without an https URL
 *   FAIL  first related link is not a /tools/ page (blog → tool page, one way)
 *   FAIL  Title > 60 chars, Description outside 140–160 chars
 *   FAIL  a banned machine-tell phrase appears anywhere in the copy
 *   WARN  exact-keyword density outside 3–5% (nominal band; the bigram rank decides)
 *   WARN  a section body longer than 140 words (one paragraph per section; keep it short)
 *
 * Keyword matching is case-insensitive and tolerates one filler word between the
 * keyword's tokens, so "hairstyles for your face shape" matches the keyword
 * "hairstyles for face shape". Density = occurrences × keyword-word-count ÷ body
 * words, which is how phrase density tools report it.
 *
 * Usage: node scripts/check-guide-quality.mjs [--json] [slug ...]
 */
import { access, readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

const GUIDES_DIR = path.resolve('product/marketing/guides');
const WORDS_MIN = 800;
const WORDS_MAX = 3000;
const DENSITY_MIN = 3;
const DENSITY_MAX = 5;
const BIGRAM_RANK_MAX = 3;
const REFS_MIN = 8;
const TITLE_MAX = 60;
const DESC_MIN = 140;
const DESC_MAX = 160;
const SECTION_WORDS_WARN = 140;

// From .claude/skills/write-blog/references/machine-tells.md. Matched as whole
// words, case-insensitive. Keep this list in sync with that file.
const BANNED_PHRASES = [
  'delve',
  'delves',
  'delving',
  'moreover',
  'furthermore',
  'additionally',
  'in conclusion',
  'to sum up',
  'in summary',
  "in today's digital",
  'digital age',
  'fast-paced world',
  'it is worth noting',
  'it is important to note',
  'a testament to',
  'game-changer',
  'game changer',
  'revolutionize',
  'seamless',
  'seamlessly',
  'robust',
  'harness the',
  'navigate the complexities',
  'unlock the',
  'elevate your',
  'rich tapestry',
  "let's dive in",
  "let's explore",
  'without further ado',
  'in the realm of',
  'embark on',
  'whether you are a beginner or an expert',
  "whether you're a beginner or an expert",
  'on one hand',
  'on the other hand',
  'what this means is',
  'as we can see',
];

const STOPWORDS = new Set(
  `a an the and or but if of to in on at by for with from as is are was were be
   been being it its this that these those there here you your yours we our ours
   they them their i me my mine he she his her him not no nor so than then too
   very can will would should could may might must do does did done have has had
   into onto over under out up down off about after before between through during
   while when where which who whom whose what why how all any both each few more
   most other some such only own same just also because until against per via
   one two three first second rather instead whether either neither yet still
   already even ever never always often usually sometimes rarely much many well
   again once twice around along across within without above below near far
   another every either every`
    .split(/\s+/)
    .filter(Boolean)
);

function tokens(text) {
  return (text.toLowerCase().match(/[a-z0-9]+(?:['’-][a-z0-9]+)*/g) ?? []).map(
    (t) => t.replace(/’/g, "'")
  );
}

function keywordRegex(keyword) {
  const parts = tokens(keyword).map((t) =>
    t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  );
  // one optional filler word between tokens: "glasses for your face shape"
  const gap = String.raw`[^a-z0-9]+(?:[a-z0-9]+(?:['’-][a-z0-9]+)*[^a-z0-9]+)?`;
  return new RegExp(
    `(?<![a-z0-9])${parts.join(gap)}(?:s|es)?(?![a-z0-9])`,
    'gi'
  );
}

function countKeyword(text, keyword) {
  return (text.toLowerCase().match(keywordRegex(keyword)) ?? []).length;
}

function hasKeyword(text, keyword) {
  return countKeyword(text, keyword) > 0;
}

function bigramTable(words) {
  const counts = new Map();
  for (let i = 0; i < words.length - 1; i += 1) {
    const a = words[i];
    const b = words[i + 1];
    if (STOPWORDS.has(a) || STOPWORDS.has(b)) continue;
    const key = `${a} ${b}`;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return [...counts.entries()].sort((x, y) => y[1] - x[1]);
}

function bodyParts(page) {
  return [
    page.hero.description,
    page.directAnswer.body,
    page.keyTakeaway,
    ...page.sections.flatMap((s) => [s.heading, s.body]),
    page.comparison.title,
    ...page.comparison.rows.flat(),
    page.risks.title,
    ...page.risks.items,
    page.figure.caption,
  ];
}

function allCopy(page) {
  return [
    page.seo.title,
    page.seo.description,
    page.directory.title,
    page.directory.description,
    page.hero.eyebrow,
    page.hero.title,
    page.figure.alt,
    ...bodyParts(page),
    ...page.related.flatMap((r) => [r.title, r.description]),
  ].join('\n');
}

function analyse(page, file) {
  const failures = [];
  const warnings = [];
  const keyword = page.seo?.keyword?.trim();
  if (!keyword) {
    failures.push(
      'seo.keyword is missing — declare the one core keyword this page targets'
    );
    return { file, slug: page.slug, keyword: null, failures, warnings };
  }

  const body = bodyParts(page).join('\n');
  const words = tokens(body);
  const wordCount = words.length;
  if (wordCount < WORDS_MIN || wordCount > WORDS_MAX) {
    failures.push(
      `body is ${wordCount} words; must be ${WORDS_MIN}–${WORDS_MAX}`
    );
  }

  const occurrences = countKeyword(body, keyword);
  const kwLen = tokens(keyword).length;
  const density = wordCount ? ((occurrences * kwLen) / wordCount) * 100 : 0;
  if (density < DENSITY_MIN || density > DENSITY_MAX) {
    warnings.push(
      `keyword density ${density.toFixed(1)}% (${occurrences}× "${keyword}") is outside the ${DENSITY_MIN}–${DENSITY_MAX}% band`
    );
  }

  const table = bigramTable(words);
  const kwTokens = tokens(keyword).filter((t) => !STOPWORDS.has(t));
  const kwBigrams = new Set();
  for (let i = 0; i < kwTokens.length - 1; i += 1) {
    kwBigrams.add(`${kwTokens[i]} ${kwTokens[i + 1]}`);
  }
  if (kwTokens.length === 1) kwBigrams.add(kwTokens[0]);
  let bestRank = Infinity;
  table.forEach(([bigram], index) => {
    if (kwBigrams.has(bigram) && index + 1 < bestRank) bestRank = index + 1;
  });
  if (kwTokens.length === 1) {
    const unigrams = new Map();
    for (const w of words)
      if (!STOPWORDS.has(w)) unigrams.set(w, (unigrams.get(w) ?? 0) + 1);
    const rank = [...unigrams.entries()]
      .sort((a, b) => b[1] - a[1])
      .findIndex(([w]) => w === kwTokens[0]);
    bestRank = rank === -1 ? Infinity : rank + 1;
  }
  const top = table
    .slice(0, 5)
    .map(([b, c]) => `${b}(${c})`)
    .join(', ');
  if (bestRank > BIGRAM_RANK_MAX) {
    failures.push(
      `keyword is rank ${bestRank === Infinity ? 'n/a' : bestRank} in the 2-word density table; must be top ${BIGRAM_RANK_MAX}. Top 5: ${top}`
    );
  }

  const first100 = tokens(`${page.hero.description} ${page.directAnswer.body}`)
    .slice(0, 100)
    .join(' ');
  const lastSection = page.sections[page.sections.length - 1];
  const placements = [
    ['Title (seo.title)', page.seo.title],
    ['H1 (hero.title)', page.hero.title],
    ['Description (seo.description)', page.seo.description],
    ['first 100 words', first100],
    ['first section heading', page.sections[0]?.heading ?? ''],
    [
      'last section',
      `${lastSection?.heading ?? ''} ${lastSection?.body ?? ''}`,
    ],
    ['figure alt', page.figure.alt],
  ];
  for (const [label, text] of placements) {
    if (!hasKeyword(text, keyword))
      failures.push(`keyword missing from ${label}`);
  }

  if (page.seo.title.length > TITLE_MAX) {
    failures.push(`Title is ${page.seo.title.length} chars; max ${TITLE_MAX}`);
  }
  const descLen = page.seo.description.length;
  if (descLen < DESC_MIN || descLen > DESC_MAX) {
    failures.push(
      `Description is ${descLen} chars; must be ${DESC_MIN}–${DESC_MAX}`
    );
  }

  const refs = page.references?.items ?? [];
  if (refs.length < REFS_MIN)
    failures.push(`${refs.length} references; need ${REFS_MIN}+`);
  for (const ref of refs) {
    if (!/^https:\/\//.test(ref.url ?? ''))
      failures.push(`reference without https URL: ${ref.title}`);
  }

  const firstRelated = page.related?.[0]?.href ?? '';
  if (!firstRelated.startsWith('/tools/')) {
    failures.push(
      `first related link must be a /tools/ page (blog → tool, one way); got "${firstRelated}"`
    );
  }
  if ((page.related?.length ?? 0) < 2) failures.push('need 2–4 related links');

  const copy = allCopy(page).toLowerCase();
  for (const phrase of BANNED_PHRASES) {
    const re = new RegExp(
      `(?<![a-z])${phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?![a-z])`,
      'i'
    );
    if (re.test(copy)) failures.push(`banned machine-tell phrase: "${phrase}"`);
  }

  page.sections.forEach((s, i) => {
    const n = tokens(s.body).length;
    if (n > SECTION_WORDS_WARN)
      warnings.push(
        `section ${i + 1} body is ${n} words; split or trim (one short paragraph per section)`
      );
  });

  return {
    file,
    slug: page.slug,
    keyword,
    wordCount,
    occurrences,
    density: Number(density.toFixed(1)),
    bigramRank: bestRank === Infinity ? null : bestRank,
    topBigrams: table.slice(0, 5),
    failures,
    warnings,
  };
}

const args = process.argv.slice(2);
const asJson = args.includes('--json');
const only = args.filter((a) => !a.startsWith('--'));

try {
  await access(GUIDES_DIR);
} catch {
  console.log(
    `No guides directory at ${path.relative(process.cwd(), GUIDES_DIR)}; nothing to check.`
  );
  process.exit(0);
}

const files = (await readdir(GUIDES_DIR))
  .filter((f) => f.endsWith('.json'))
  .filter(
    (f) => only.length === 0 || only.some((slug) => f.startsWith(`${slug}.`))
  )
  .sort();

const results = [];
for (const file of files) {
  const page = JSON.parse(await readFile(path.join(GUIDES_DIR, file), 'utf8'));
  results.push(analyse(page, file));
}

if (asJson) {
  console.log(JSON.stringify(results, null, 2));
} else {
  for (const r of results) {
    const status = r.failures.length
      ? 'FAIL'
      : r.warnings.length
        ? 'WARN'
        : 'PASS';
    console.log(
      `${status}  ${r.file}  keyword="${r.keyword ?? '-'}"  words=${r.wordCount ?? '-'}  density=${r.density ?? '-'}%  bigramRank=${r.bigramRank ?? '-'}`
    );
    for (const f of r.failures) console.log(`      ✗ ${f}`);
    for (const w of r.warnings) console.log(`      ! ${w}`);
  }
}

const failed = results.filter((r) => r.failures.length);
if (failed.length) {
  console.error(
    `\n${failed.length} of ${results.length} guides fail the quality gate.`
  );
  process.exit(1);
}
console.log(`\nAll ${results.length} guides pass the quality gate.`);
