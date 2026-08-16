import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import {
  mkdir,
  mkdtemp,
  readdir,
  readFile,
  rm,
  writeFile,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { modelCatalog } from '@/config/catalog/models';
import { catalog } from '@/config/catalog/registry';
import { resolveCatalogRoute } from '@/config/catalog/resolver';
import { selectHomeEntries } from '@/config/catalog/selectors';
import { toolCatalog } from '@/config/catalog/tools';
import type {
  MarketingAsset,
  ModelDefinition,
  ToolDefinition,
} from '@/config/catalog/types';
import type { AppLocale } from '@/config/locale';
import {
  directorySourceFileSchema,
  homeProjectionReleaseObjectSchema,
  MARKETING_CONTENT_RELEASE_PREFIX,
  MARKETING_CONTENT_SCHEMA_VERSION,
  marketingAssetsSourceSchema,
  modelDirectoryReleaseObjectSchema,
  modelPageContentSchema,
  modelPageReleaseObjectSchema,
  parseMarketingAsset,
  parseModelPageSourceFile,
  parseToolPageSourceFile,
  toolDirectoryReleaseObjectSchema,
  toolPageContentSchema,
  toolPageReleaseObjectSchema,
  type HomeProjectionReleaseObject,
  type MarketingAssetsSource,
  type MarketingContentManifest,
  type ModelDirectoryReleaseObject,
  type ModelPageReleaseObject,
  type ToolDirectoryReleaseObject,
  type ToolPageReleaseObject,
} from '@/content/marketing/schema';
import type {
  ModelMediaReference,
  ModelMediaSourceReference,
  ModelPageContent,
  ModelPageSourceContent,
} from '@/content/models/types';
import { validateModelPageContent } from '@/content/models/validate';
import type {
  ToolMediaReference,
  ToolMediaSourceReference,
  ToolPageContent,
  ToolPageSourceContent,
} from '@/content/tools/types';
import { validateToolPageContent } from '@/content/tools/validate';

type PageReleaseObject = ToolPageReleaseObject | ModelPageReleaseObject;
type DirectoryReleaseObject =
  | ToolDirectoryReleaseObject
  | ModelDirectoryReleaseObject;

type Options = {
  source: string;
  output: string;
  indexFile: string;
  config: string;
  publish: boolean;
  syncConfig: boolean;
  syncIndex: boolean;
  checkIndex: boolean;
  verify: boolean;
  fixtures: number;
  dryRun: boolean;
  bucket?: string;
};

type ReleaseFile = {
  key: string;
  file: string;
  sha256: string;
};

function parseArgs(argv: string[]): Options {
  const options: Options = {
    source: 'product/marketing',
    output: '.marketing-content',
    indexFile: 'src/content/marketing/release-index.generated.ts',
    config: 'wrangler.jsonc',
    publish: false,
    syncConfig: false,
    syncIndex: false,
    checkIndex: false,
    verify: true,
    fixtures: 0,
    dryRun: false,
  };
  for (const arg of argv) {
    if (arg === '--') continue;
    if (arg === '--publish') options.publish = true;
    else if (arg === '--dry-run') options.dryRun = true;
    else if (arg === '--sync-config') options.syncConfig = true;
    else if (arg === '--sync-index') options.syncIndex = true;
    else if (arg === '--check-index') options.checkIndex = true;
    else if (arg === '--no-verify') options.verify = false;
    else if (arg.startsWith('--source=')) options.source = arg.slice(9);
    else if (arg.startsWith('--output=')) options.output = arg.slice(9);
    else if (arg.startsWith('--index-file=')) options.indexFile = arg.slice(13);
    else if (arg.startsWith('--config=')) options.config = arg.slice(9);
    else if (arg.startsWith('--bucket=')) options.bucket = arg.slice(9);
    else if (arg.startsWith('--scale-fixtures=')) {
      options.fixtures = Number.parseInt(arg.slice(17), 10);
    } else throw new Error(`Unknown argument: ${arg}`);
  }
  if (options.dryRun) {
    options.publish = false;
    options.syncConfig = false;
  }
  if (options.syncConfig && !options.publish) {
    throw new Error('--sync-config requires --publish');
  }
  if (options.syncIndex && options.checkIndex) {
    throw new Error('--sync-index and --check-index are mutually exclusive');
  }
  if (
    !Number.isSafeInteger(options.fixtures) ||
    options.fixtures < 0 ||
    options.fixtures > 10_000
  ) {
    throw new Error('--scale-fixtures must be an integer between 0 and 10000');
  }
  if (options.fixtures && (options.publish || options.syncIndex)) {
    throw new Error(
      'Scale fixtures cannot be published or synced into the app'
    );
  }
  if (options.publish && !options.bucket) {
    options.bucket = process.env.MARKETING_CONTENT_BUCKET_NAME?.trim();
  }
  if (options.publish && !options.bucket) {
    throw new Error(
      'Publishing requires --bucket=<name> or MARKETING_CONTENT_BUCKET_NAME'
    );
  }
  if (options.bucket && !/^[a-z0-9][a-z0-9-]{1,62}$/.test(options.bucket)) {
    throw new Error(`Invalid R2 bucket name: ${options.bucket}`);
  }
  return options;
}

function sha256(value: string | Uint8Array): string {
  return createHash('sha256').update(value).digest('hex');
}

function jsonText(value: unknown): string {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function bytes(value: string): number {
  return Buffer.byteLength(value, 'utf8');
}

async function readJson(file: string): Promise<unknown> {
  let text: string;
  try {
    text = await readFile(file, 'utf8');
  } catch (error) {
    throw new Error(`Unable to read ${file}`, { cause: error });
  }
  try {
    return JSON.parse(text) as unknown;
  } catch (error) {
    throw new Error(`Invalid JSON in ${file}`, { cause: error });
  }
}

async function configuredLocales(): Promise<Set<string>> {
  const settings = (await readJson('project.inlang/settings.json')) as {
    locales?: unknown;
  };
  if (!Array.isArray(settings.locales) || settings.locales.length === 0) {
    throw new Error('project.inlang/settings.json must declare locales');
  }
  return new Set(
    settings.locales.map((locale) => {
      if (typeof locale !== 'string') throw new Error('Invalid Inlang locale');
      return locale;
    })
  );
}

function resolveAssets(
  source: MarketingAssetsSource
): Map<string, MarketingAsset> {
  const sourceById = new Map<string, MarketingAssetsSource['assets'][number]>();
  for (const asset of source.assets) {
    if (sourceById.has(asset.id)) {
      throw new Error(`Duplicate marketing asset id: ${asset.id}`);
    }
    if (!asset.url.startsWith(`${source.publicDomain.replace(/\/$/, '')}/`)) {
      throw new Error(`Marketing asset is outside publicDomain: ${asset.id}`);
    }
    sourceById.set(asset.id, asset);
  }

  const resolved = new Map<string, MarketingAsset>();
  for (const asset of source.assets) {
    if (asset.kind === 'image') resolved.set(asset.id, asset as MarketingAsset);
  }
  for (const asset of source.assets) {
    if (asset.kind === 'image') continue;
    const poster = resolved.get(asset.posterAssetId);
    if (!poster || poster.kind !== 'image') {
      throw new Error(`Video poster image is missing: ${asset.id}`);
    }
    const { posterAssetId: _, ...video } = asset;
    resolved.set(asset.id, parseMarketingAsset({ ...video, poster }));
  }
  return resolved;
}

function resolveToolContent(
  source: ToolPageSourceContent,
  assets: ReadonlyMap<string, MarketingAsset>
): ToolPageContent {
  const media = (reference: ToolMediaSourceReference): ToolMediaReference => {
    const asset = assets.get(reference.assetId);
    if (!asset) {
      throw new Error(
        `Unknown marketing asset ${reference.assetId} in ${source.entityId}:${source.locale}`
      );
    }
    return { ...asset, alt: reference.alt };
  };
  const common = {
    ...source,
    showcase: {
      workflows: {
        ...source.showcase.workflows,
        items: source.showcase.workflows.items.map((item) => ({
          ...item,
          media: [media(item.media[0]), media(item.media[1])] as const,
        })),
      },
      models: {
        ...source.showcase.models,
        items: source.showcase.models.items.map((item) => ({
          ...item,
          media: media(item.media),
        })),
      },
    },
    useCases: {
      ...source.useCases,
      items: source.useCases.items.map((item) => ({
        ...item,
        media: media(item.media),
      })),
    },
  };
  const resolved =
    'examples' in source
      ? {
          ...common,
          examples: {
            ...source.examples,
            items: source.examples.items.map((item) => ({
              ...item,
              media: media(item.media),
            })),
          },
        }
      : {
          ...common,
          comparisons: {
            ...source.comparisons,
            items: source.comparisons.items.map((item) => ({
              ...item,
              source: media(item.source),
              result: media(item.result),
            })),
          },
        };
  return toolPageContentSchema.parse(resolved) as ToolPageContent;
}

function resolveModelContent(
  source: ModelPageSourceContent,
  assets: ReadonlyMap<string, MarketingAsset>
): ModelPageContent {
  const media = (reference: ModelMediaSourceReference): ModelMediaReference => {
    const asset = assets.get(reference.assetId);
    if (!asset) {
      throw new Error(
        `Unknown marketing asset ${reference.assetId} in ${source.entityId}:${source.locale}`
      );
    }
    return { ...asset, alt: reference.alt };
  };
  return modelPageContentSchema.parse({
    ...source,
    examples: {
      ...source.examples,
      items: source.examples.items.map((item) => ({
        ...item,
        media: media(item.media),
      })),
    },
    useCases: {
      ...source.useCases,
      items: source.useCases.items.map((item) => ({
        ...item,
        media: media(item.media),
      })),
    },
  }) as ModelPageContent;
}

type LandingMessages = Record<string, unknown>;
type ResolvedHomeMedia = MarketingAsset & { alt: string };

function landingMessage(
  messages: LandingMessages,
  key: string,
  locale: string
): string {
  const value = messages[key];
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error(`Homepage message is missing: ${locale}:${key}`);
  }
  return value.trim();
}

function resolveHomeMedia(
  messages: LandingMessages,
  locale: string,
  assetKey: string,
  altKey: string,
  assets: ReadonlyMap<string, MarketingAsset>
): ResolvedHomeMedia {
  const assetId = landingMessage(messages, assetKey, locale);
  const asset = assets.get(assetId);
  if (!asset) {
    throw new Error(
      `Unknown homepage asset ${assetId} in ${locale}:${assetKey}`
    );
  }
  return {
    ...asset,
    alt: landingMessage(messages, altKey, locale),
  };
}

function homeCardMedia(
  content: ToolPageContent
): readonly [ToolMediaReference, ToolMediaReference] {
  const workflow = content.showcase.workflows.items[0];
  if (workflow) return workflow.media;
  if ('examples' in content && content.examples.items.length >= 2) {
    return [content.examples.items[0]!.media, content.examples.items[1]!.media];
  }
  if ('comparisons' in content && content.comparisons.items[0]) {
    const comparison = content.comparisons.items[0];
    return [comparison.source, comparison.result];
  }
  throw new Error(
    `Featured homepage tool needs two media assets: ${content.entityId}:${content.locale}`
  );
}

async function buildHomeProjections(
  locales: ReadonlySet<string>,
  assets: ReadonlyMap<string, MarketingAsset>,
  pages: readonly PageReleaseObject[]
): Promise<HomeProjectionReleaseObject[]> {
  const toolPageByKey = new Map(
    pages
      .filter((page): page is ToolPageReleaseObject => page.kind === 'tool')
      .map((page) => [`${page.entityId}:${page.locale}`, page] as const)
  );
  const modelPageByKey = new Map(
    pages.map((page) => [`${page.entityId}:${page.locale}`, page] as const)
  );
  const projections: HomeProjectionReleaseObject[] = [];
  for (const localeValue of [...locales].sort()) {
    const locale = localeValue as AppLocale;
    const messages = (await readJson(
      path.join('product', 'messages', `${locale}.json`)
    )) as LandingMessages;
    const media = {
      hero: resolveHomeMedia(
        messages,
        locale,
        'landing.hero.media_asset_id',
        'landing.hero.media_alt',
        assets
      ),
      og: resolveHomeMedia(
        messages,
        locale,
        'landing.seo.og_asset_id',
        'landing.seo.og_alt',
        assets
      ),
      marquee: Array.from({ length: 8 }, (_, index) =>
        resolveHomeMedia(
          messages,
          locale,
          `landing.media_marquee.item_${index + 1}_asset_id`,
          `landing.media_marquee.item_${index + 1}_alt`,
          assets
        )
      ),
      examples: Array.from({ length: 8 }, (_, index) =>
        resolveHomeMedia(
          messages,
          locale,
          `landing.gallery.item_${index + 1}_asset_id`,
          `landing.gallery.item_${index + 1}_alt`,
          assets
        )
      ),
      useCases: Array.from({ length: 3 }, (_, index) =>
        resolveHomeMedia(
          messages,
          locale,
          `landing.use_cases.item_${index + 1}.asset_id`,
          `landing.use_cases.item_${index + 1}.alt`,
          assets
        )
      ),
    };
    if (media.og.kind !== 'image') {
      throw new Error(`Homepage OG asset must be an image: ${locale}`);
    }

    const featuredTools = selectHomeEntries(
      toolCatalog,
      locale,
      (definition, targetLocale) =>
        toolPageByKey.has(`${definition.entityId}:${targetLocale}`)
    ).flatMap((definition) => {
      if (definition.kind !== 'tool' || definition.publication !== 'listed') {
        return [];
      }
      const page = toolPageByKey.get(`${definition.entityId}:${locale}`);
      const localePage = definition.localePages[locale];
      if (!page || !localePage) return [];
      return [
        {
          id: definition.entityId,
          entityId: definition.entityId,
          href: resolveCatalogRoute('tool', locale, localePage.slug).path,
          title: page.content.directory.title,
          description: page.content.directory.description,
          media: homeCardMedia(page.content),
        },
      ];
    });

    projections.push(
      homeProjectionReleaseObjectSchema.parse({
        schemaVersion: MARKETING_CONTENT_SCHEMA_VERSION,
        kind: 'home',
        locale,
        media,
        featured: {
          tools: featuredTools,
          models: selectHomeEntries(
            modelCatalog,
            locale,
            (definition, targetLocale) =>
              modelPageByKey.has(`${definition.entityId}:${targetLocale}`)
          ).flatMap((definition) => {
            if (
              definition.kind !== 'model' ||
              definition.publication !== 'listed'
            ) {
              return [];
            }
            const page = modelPageByKey.get(`${definition.entityId}:${locale}`);
            const localePage = definition.localePages[locale];
            if (!page || page.kind !== 'model' || !localePage) return [];
            const media = page.content.examples.items[0]?.media;
            if (!media) return [];
            return [
              {
                id: definition.entityId,
                entityId: definition.entityId,
                href: resolveCatalogRoute('model', locale, localePage.slug)
                  .path,
                title: page.content.directory.title,
                description: page.content.directory.description,
                media,
              },
            ];
          }),
        },
      }) as HomeProjectionReleaseObject
    );
  }
  return projections;
}

function listedModel(entityId: string, locale: string): ModelDefinition {
  const definition = modelCatalog.find((entry) => entry.entityId === entityId);
  if (
    !definition ||
    definition.publication !== 'listed' ||
    !definition.localePages[locale as AppLocale]
  ) {
    throw new Error(
      `Marketing source has no listed model locale page: ${entityId}:${locale}`
    );
  }
  return definition;
}

function listedTool(entityId: string, locale: string): ToolDefinition {
  const definition = toolCatalog.find((entry) => entry.entityId === entityId);
  if (
    !definition ||
    definition.publication !== 'listed' ||
    !definition.localePages[locale as AppLocale]
  ) {
    throw new Error(
      `Marketing source has no listed Catalog locale page: ${entityId}:${locale}`
    );
  }
  return definition;
}

function validateContentLinks(content: ToolPageContent): void {
  for (const item of content.showcase.workflows.items) {
    const target = catalog.find((entry) => entry.entityId === item.entityId);
    if (target && target.kind !== 'tool') {
      throw new Error(
        `Tool showcase target has the wrong Catalog kind in ${content.entityId}:${content.locale}: ${item.entityId}`
      );
    }
  }
  for (const item of content.showcase.models.items) {
    const target = catalog.find((entry) => entry.entityId === item.entityId);
    if (
      target &&
      (target.kind !== 'model' ||
        target.runtimeModelKey !== item.runtimeModelKey)
    ) {
      throw new Error(
        `Invalid model showcase target in ${content.entityId}:${content.locale}: ${item.entityId}`
      );
    }
  }
  for (const [label, ids] of [
    [
      'workflow showcase',
      content.showcase.workflows.items.map((item) => item.id),
    ],
    ['model showcase', content.showcase.models.items.map((item) => item.id)],
    ['use case', content.useCases.items.map((item) => item.id)],
  ] as const) {
    if (new Set(ids).size !== ids.length) {
      throw new Error(
        `Duplicate ${label} id in ${content.entityId}:${content.locale}`
      );
    }
  }
}

async function discoverToolPages(
  sourceRoot: string,
  locales: ReadonlySet<string>,
  assets: ReadonlyMap<string, MarketingAsset>
) {
  const toolsRoot = path.join(sourceRoot, 'tools');
  const entities = await readdir(toolsRoot, { withFileTypes: true });
  const pages: ToolPageReleaseObject[] = [];
  for (const entityEntry of entities.sort((a, b) =>
    a.name.localeCompare(b.name)
  )) {
    if (!entityEntry.isDirectory()) {
      throw new Error(
        `Tool source entry must be a directory: ${entityEntry.name}`
      );
    }
    const entityId = entityEntry.name;
    const files = await readdir(path.join(toolsRoot, entityId), {
      withFileTypes: true,
    });
    for (const fileEntry of files.sort((a, b) =>
      a.name.localeCompare(b.name)
    )) {
      if (!fileEntry.isFile() || !fileEntry.name.endsWith('.json')) {
        throw new Error(
          `Tool source must be JSON: ${entityId}/${fileEntry.name}`
        );
      }
      const locale = fileEntry.name.slice(0, -5);
      if (!locales.has(locale)) {
        throw new Error(
          `Unsupported tool content locale: ${entityId}:${locale}`
        );
      }
      const source = parseToolPageSourceFile(
        await readJson(path.join(toolsRoot, entityId, fileEntry.name))
      );
      if (
        source.content.entityId !== entityId ||
        source.content.locale !== locale
      ) {
        throw new Error(`Tool source identity mismatch: ${entityId}:${locale}`);
      }
      const definition = listedTool(entityId, locale);
      const catalogModifiedAt =
        definition.localePages?.[locale as AppLocale]?.contentModifiedAt;
      if (catalogModifiedAt && catalogModifiedAt !== source.contentModifiedAt) {
        throw new Error(
          `contentModifiedAt mismatch for ${entityId}:${locale} (${source.contentModifiedAt} !== ${catalogModifiedAt})`
        );
      }
      const content = resolveToolContent(source.content, assets);
      validateToolPageContent(definition, content);
      validateContentLinks(content);
      pages.push(
        toolPageReleaseObjectSchema.parse({
          schemaVersion: MARKETING_CONTENT_SCHEMA_VERSION,
          kind: 'tool',
          entityId,
          locale,
          contentModifiedAt: source.contentModifiedAt,
          content,
        }) as ToolPageReleaseObject
      );
    }
  }
  const keys = new Set<string>();
  for (const page of pages) {
    const key = `${page.kind}:${page.entityId}:${page.locale}`;
    if (keys.has(key)) throw new Error(`Duplicate marketing page: ${key}`);
    keys.add(key);
  }
  return pages.sort((a, b) =>
    `${a.kind}:${a.entityId}:${a.locale}`.localeCompare(
      `${b.kind}:${b.entityId}:${b.locale}`
    )
  );
}

async function discoverModelPages(
  sourceRoot: string,
  locales: ReadonlySet<string>,
  assets: ReadonlyMap<string, MarketingAsset>
): Promise<ModelPageReleaseObject[]> {
  const modelsRoot = path.join(sourceRoot, 'models');
  const entities = await readdir(modelsRoot, { withFileTypes: true });
  const pages: ModelPageReleaseObject[] = [];
  for (const entityEntry of entities.sort((a, b) =>
    a.name.localeCompare(b.name)
  )) {
    if (!entityEntry.isDirectory()) {
      throw new Error(
        `Model source entry must be a directory: ${entityEntry.name}`
      );
    }
    const entityId = entityEntry.name;
    const files = await readdir(path.join(modelsRoot, entityId), {
      withFileTypes: true,
    });
    for (const fileEntry of files.sort((a, b) =>
      a.name.localeCompare(b.name)
    )) {
      if (!fileEntry.isFile() || !fileEntry.name.endsWith('.json')) {
        throw new Error(
          `Model source must be JSON: ${entityId}/${fileEntry.name}`
        );
      }
      const locale = fileEntry.name.slice(0, -5);
      if (!locales.has(locale)) {
        throw new Error(
          `Unsupported model content locale: ${entityId}:${locale}`
        );
      }
      const source = parseModelPageSourceFile(
        await readJson(path.join(modelsRoot, entityId, fileEntry.name))
      );
      if (
        source.content.entityId !== entityId ||
        source.content.locale !== locale
      ) {
        throw new Error(
          `Model source identity mismatch: ${entityId}:${locale}`
        );
      }
      const definition = listedModel(entityId, locale);
      const catalogModifiedAt =
        definition.localePages?.[locale as AppLocale]?.contentModifiedAt;
      if (catalogModifiedAt && catalogModifiedAt !== source.contentModifiedAt) {
        throw new Error(
          `contentModifiedAt mismatch for ${entityId}:${locale} (${source.contentModifiedAt} !== ${catalogModifiedAt})`
        );
      }
      const content = resolveModelContent(source.content, assets);
      validateModelPageContent(definition, content);
      for (const relatedId of content.comparison.relatedModelIds) {
        const target = modelCatalog.find(
          (entry) => entry.entityId === relatedId
        );
        if (!target || target.modality !== definition.modality) {
          throw new Error(
            `Invalid comparison model in ${entityId}:${locale}: ${relatedId}`
          );
        }
      }
      pages.push(
        modelPageReleaseObjectSchema.parse({
          schemaVersion: MARKETING_CONTENT_SCHEMA_VERSION,
          kind: 'model',
          entityId,
          locale,
          contentModifiedAt: source.contentModifiedAt,
          content,
        }) as ModelPageReleaseObject
      );
    }
  }
  return pages.sort((a, b) =>
    `${a.entityId}:${a.locale}`.localeCompare(`${b.entityId}:${b.locale}`)
  );
}

function withScaleFixtures(
  pages: readonly ToolPageReleaseObject[],
  fixtureCount: number
): ToolPageReleaseObject[] {
  if (!fixtureCount) return [...pages];
  const template = pages[0];
  if (!template) throw new Error('Scale fixtures require one real tool page');
  return Array.from({ length: fixtureCount }, (_, index) => {
    const entityId = `scale-fixture-${String(index + 1).padStart(5, '0')}`;
    return {
      ...structuredClone(template),
      entityId,
      content: {
        ...structuredClone(template.content),
        entityId,
        directory: {
          ...template.content.directory,
          title: `${template.content.directory.title} ${index + 1}`,
        },
      },
    } as ToolPageReleaseObject;
  });
}

async function buildDirectories(
  sourceRoot: string,
  pages: readonly ToolPageReleaseObject[]
): Promise<ToolDirectoryReleaseObject[]> {
  const locales = [...new Set(pages.map((page) => page.locale))].sort();
  const directories: ToolDirectoryReleaseObject[] = [];
  for (const locale of locales) {
    const source = directorySourceFileSchema.parse(
      await readJson(
        path.join(sourceRoot, 'directories', 'tools', `${locale}.json`)
      )
    );
    const contentByEntity = new Map(
      pages
        .filter((page) => page.locale === locale)
        .map((page) => [page.entityId, page.content] as const)
    );
    const items = toolCatalog.flatMap((definition) => {
      if (definition.publication !== 'listed') return [];
      const content = contentByEntity.get(definition.entityId);
      const localePage = definition.localePages[locale];
      if (!content || !localePage) return [];
      return [
        {
          entityId: definition.entityId,
          href: resolveCatalogRoute('tool', locale, localePage.slug).path,
          title: content.directory.title,
          description: content.directory.description,
          availability: definition.availability,
        },
      ];
    });
    directories.push(
      toolDirectoryReleaseObjectSchema.parse({
        schemaVersion: MARKETING_CONTENT_SCHEMA_VERSION,
        kind: 'tools',
        locale,
        seo: source.seo,
        hero: source.hero,
        items,
      }) as ToolDirectoryReleaseObject
    );
  }
  return directories;
}

async function buildModelDirectories(
  sourceRoot: string,
  pages: readonly ModelPageReleaseObject[]
): Promise<ModelDirectoryReleaseObject[]> {
  const locales = [...new Set(pages.map((page) => page.locale))].sort();
  const directories: ModelDirectoryReleaseObject[] = [];
  for (const locale of locales) {
    const source = directorySourceFileSchema.parse(
      await readJson(
        path.join(sourceRoot, 'directories', 'models', `${locale}.json`)
      )
    );
    const contentByEntity = new Map(
      pages
        .filter((page) => page.locale === locale)
        .map((page) => [page.entityId, page.content] as const)
    );
    const items = modelCatalog.flatMap((definition) => {
      if (definition.publication !== 'listed') return [];
      const content = contentByEntity.get(definition.entityId);
      const localePage = definition.localePages[locale];
      if (!content || !localePage) return [];
      return [
        {
          entityId: definition.entityId,
          href: resolveCatalogRoute('model', locale, localePage.slug).path,
          title: content.directory.title,
          description: content.directory.description,
          availability: definition.availability,
        },
      ];
    });
    directories.push(
      modelDirectoryReleaseObjectSchema.parse({
        schemaVersion: MARKETING_CONTENT_SCHEMA_VERSION,
        kind: 'models',
        locale,
        seo: source.seo,
        hero: source.hero,
        items,
      }) as ModelDirectoryReleaseObject
    );
  }
  return directories;
}

function pageObjectKey(releaseId: string, page: PageReleaseObject): string {
  return `${MARKETING_CONTENT_RELEASE_PREFIX}/${releaseId}/pages/${page.kind}/${page.entityId}/${page.locale}.json`;
}

function directoryObjectKey(
  releaseId: string,
  directory: DirectoryReleaseObject
): string {
  return `${MARKETING_CONTENT_RELEASE_PREFIX}/${releaseId}/directories/${directory.kind}/${directory.locale}.json`;
}

function homeProjectionObjectKey(
  releaseId: string,
  projection: HomeProjectionReleaseObject
): string {
  return `${MARKETING_CONTENT_RELEASE_PREFIX}/${releaseId}/projections/home/${projection.locale}.json`;
}

function manifestKey(releaseId: string): string {
  return `${MARKETING_CONTENT_RELEASE_PREFIX}/${releaseId}/manifest.json`;
}

function indexText(
  pages: readonly PageReleaseObject[],
  directories: readonly DirectoryReleaseObject[],
  homeProjections: readonly HomeProjectionReleaseObject[]
): string {
  const pageKeys = pages
    .map((page) => `${page.kind}:${page.entityId}:${page.locale}`)
    .sort();
  const directoryKeys = directories
    .map((directory) => `${directory.kind}:${directory.locale}`)
    .sort();
  const homeProjectionLocales = homeProjections
    .map((projection) => projection.locale)
    .sort();
  const literal = (values: readonly string[]) =>
    values.length === 0
      ? '[]'
      : `[\n${values.map((value) => `  '${value}',`).join('\n')}\n]`;
  return (
    `// Generated by scripts/marketing-content-release.ts. Do not edit.\n` +
    `// prettier-ignore\n` +
    `export const marketingPageKeys = ${literal(pageKeys)} as const;\n` +
    `// prettier-ignore\n` +
    `export const marketingDirectoryKeys = ${literal(directoryKeys)} as const;\n` +
    `// prettier-ignore\n` +
    `export const marketingHomeProjectionLocales = ${literal(homeProjectionLocales)} as const;\n`
  );
}

async function sourceDigest(
  sourceRoot: string,
  homeProjections: readonly HomeProjectionReleaseObject[]
): Promise<string> {
  const files: string[] = [];
  async function walk(directory: string) {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      const absolute = path.join(directory, entry.name);
      if (entry.isDirectory()) await walk(absolute);
      else if (entry.isFile() && entry.name.endsWith('.json'))
        files.push(absolute);
    }
  }
  await walk(sourceRoot);
  const hash = createHash('sha256');
  for (const file of files.sort()) {
    hash.update(path.relative(sourceRoot, file).split(path.sep).join('/'));
    hash.update('\0');
    hash.update(await readFile(file));
    hash.update('\0');
  }
  for (const projection of homeProjections) {
    hash.update(`projections/home/${projection.locale}.json`);
    hash.update('\0');
    hash.update(jsonText(projection));
    hash.update('\0');
  }
  return hash.digest('hex');
}

async function buildRelease(options: Options) {
  const sourceRoot = path.resolve(options.source);
  const outputRoot = path.resolve(options.output);
  let currentReleaseId: string | undefined;
  let previousPointerReleaseId: string | undefined;
  try {
    const pointer = JSON.parse(
      await readFile(path.join(outputRoot, 'current.json'), 'utf8')
    ) as { releaseId?: unknown; previousReleaseId?: unknown };
    if (typeof pointer.releaseId === 'string') {
      currentReleaseId = pointer.releaseId;
    }
    if (typeof pointer.previousReleaseId === 'string') {
      previousPointerReleaseId = pointer.previousReleaseId;
    }
  } catch {
    // The first local build has no rollback pointer yet.
  }
  const locales = await configuredLocales();
  const assetSource = marketingAssetsSourceSchema.parse(
    await readJson(path.join(sourceRoot, 'assets.json'))
  ) as MarketingAssetsSource;
  const assets = resolveAssets(assetSource);
  const hasToolEntries = toolCatalog.length > 0;
  const hasModelEntries = modelCatalog.length > 0;
  const toolPages = hasToolEntries
    ? await discoverToolPages(sourceRoot, locales, assets)
    : [];
  const modelPages = hasModelEntries
    ? await discoverModelPages(sourceRoot, locales, assets)
    : [];
  const realPages: PageReleaseObject[] = [...toolPages, ...modelPages].sort(
    (a, b) =>
      `${a.kind}:${a.entityId}:${a.locale}`.localeCompare(
        `${b.kind}:${b.entityId}:${b.locale}`
      )
  );
  const directories: DirectoryReleaseObject[] = [
    ...(hasToolEntries ? await buildDirectories(sourceRoot, toolPages) : []),
    ...(hasModelEntries
      ? await buildModelDirectories(sourceRoot, modelPages)
      : []),
  ];
  const homeProjections =
    realPages.length > 0
      ? await buildHomeProjections(locales, assets, realPages)
      : [];
  const pages: PageReleaseObject[] = [
    ...withScaleFixtures(toolPages, options.fixtures),
    ...modelPages,
  ];

  const pageTexts = pages.map((page) => ({ page, text: jsonText(page) }));
  const directoryTexts = directories.map((directory) => ({
    directory,
    text: jsonText(directory),
  }));
  const homeProjectionTexts = homeProjections.map((projection) => ({
    projection,
    text: jsonText(projection),
  }));
  const manifestBase = {
    schemaVersion: MARKETING_CONTENT_SCHEMA_VERSION,
    sourceSha256: await sourceDigest(sourceRoot, homeProjections),
    pages: pageTexts.map(({ page, text }) => ({
      kind: page.kind,
      entityId: page.entityId,
      locale: page.locale,
      contentModifiedAt: page.contentModifiedAt,
      bytes: bytes(text),
      sha256: sha256(text),
    })),
    directories: directoryTexts.map(({ directory, text }) => ({
      kind: directory.kind,
      locale: directory.locale,
      itemCount: directory.items.length,
      bytes: bytes(text),
      sha256: sha256(text),
    })),
    projections: homeProjectionTexts.map(({ projection, text }) => ({
      kind: projection.kind,
      locale: projection.locale,
      bytes: bytes(text),
      sha256: sha256(text),
    })),
  };
  const releaseId = sha256(JSON.stringify(manifestBase));
  const manifest: MarketingContentManifest = {
    ...manifestBase,
    releaseId,
  };
  const releaseRoot = path.join(
    outputRoot,
    MARKETING_CONTENT_RELEASE_PREFIX,
    releaseId
  );
  const files: ReleaseFile[] = [];
  for (const { page, text } of pageTexts) {
    const key = pageObjectKey(releaseId, page);
    const file = path.join(outputRoot, key);
    await mkdir(path.dirname(file), { recursive: true });
    await writeFile(file, text, 'utf8');
    files.push({ key, file, sha256: sha256(text) });
  }
  for (const { directory, text } of directoryTexts) {
    const key = directoryObjectKey(releaseId, directory);
    const file = path.join(outputRoot, key);
    await mkdir(path.dirname(file), { recursive: true });
    await writeFile(file, text, 'utf8');
    files.push({ key, file, sha256: sha256(text) });
  }
  for (const { projection, text } of homeProjectionTexts) {
    const key = homeProjectionObjectKey(releaseId, projection);
    const file = path.join(outputRoot, key);
    await mkdir(path.dirname(file), { recursive: true });
    await writeFile(file, text, 'utf8');
    files.push({ key, file, sha256: sha256(text) });
  }
  const manifestText = jsonText(manifest);
  const totalBytes =
    pageTexts.reduce((total, item) => total + bytes(item.text), 0) +
    directoryTexts.reduce((total, item) => total + bytes(item.text), 0) +
    homeProjectionTexts.reduce((total, item) => total + bytes(item.text), 0) +
    bytes(manifestText);
  const rollbackReleaseId =
    currentReleaseId && currentReleaseId !== releaseId
      ? currentReleaseId
      : previousPointerReleaseId;
  const manifestFile = path.join(releaseRoot, 'manifest.json');
  await mkdir(releaseRoot, { recursive: true });
  await writeFile(manifestFile, manifestText, 'utf8');
  const manifestUpload = {
    key: manifestKey(releaseId),
    file: manifestFile,
    sha256: sha256(manifestText),
  };
  files.push(manifestUpload);
  await mkdir(outputRoot, { recursive: true });
  await writeFile(
    path.join(outputRoot, 'current.json'),
    jsonText({
      schemaVersion: MARKETING_CONTENT_SCHEMA_VERSION,
      releaseId,
      manifestKey: manifestUpload.key,
      ...(rollbackReleaseId ? { previousReleaseId: rollbackReleaseId } : {}),
    }),
    'utf8'
  );

  const generatedIndex = indexText(realPages, directories, homeProjections);
  const indexFile = path.resolve(options.indexFile);
  if (options.syncIndex) {
    await mkdir(path.dirname(indexFile), { recursive: true });
    await writeFile(indexFile, generatedIndex, 'utf8');
  } else if (options.checkIndex) {
    let current = '';
    try {
      current = await readFile(indexFile, 'utf8');
    } catch {
      // A precise error below explains the recovery command.
    }
    if (current !== generatedIndex) {
      throw new Error(
        `Marketing release index is stale. Run "pnpm marketing:sync-content-release".`
      );
    }
  }
  return {
    releaseId,
    outputRoot,
    pageCount: pages.length,
    directoryCount: directories.length,
    projectionCount: homeProjections.length,
    totalBytes,
    previousReleaseId: rollbackReleaseId,
    files,
    manifestUpload,
  };
}

function runWrangler(args: string[]): void {
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

async function publishRelease(
  release: Awaited<ReturnType<typeof buildRelease>>,
  options: Options
): Promise<void> {
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
  const verifyRoot = await mkdtemp(
    path.join(tmpdir(), 'marketing-content-verify-')
  );
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
      if (sha256(await readFile(destination)) !== object.sha256) {
        throw new Error(`Published object failed verification: ${object.key}`);
      }
    }
  } finally {
    await rm(verifyRoot, { recursive: true, force: true });
  }
}

async function syncWranglerConfig(
  releaseId: string,
  configPath: string
): Promise<void> {
  const absolute = path.resolve(configPath);
  const current = await readFile(absolute, 'utf8');
  const pattern = /("MARKETING_CONTENT_RELEASE"\s*:\s*")[^"]*(")/;
  if (!pattern.test(current)) {
    throw new Error(
      `${configPath} must define vars.MARKETING_CONTENT_RELEASE before --sync-config can update it`
    );
  }
  await writeFile(
    absolute,
    current.replace(pattern, `$1${releaseId}$2`),
    'utf8'
  );
}

async function main(): Promise<void> {
  const options = parseArgs(process.argv.slice(2));
  const release = await buildRelease(options);
  console.log(
    `Built ${release.pageCount} marketing pages, ${release.directoryCount} directories, and ${release.projectionCount} projections (${release.totalBytes} bytes) as release ${release.releaseId}`
  );
  if (release.previousReleaseId) {
    console.log(`Rollback release: ${release.previousReleaseId}`);
  }
  console.log(`Local release: ${release.outputRoot}`);
  if (!options.publish) return;
  await publishRelease(release, options);
  console.log(
    `${options.verify ? 'Published and verified' : 'Published'} R2 release in ${options.bucket}`
  );
  if (options.syncConfig) {
    await syncWranglerConfig(release.releaseId, options.config);
    console.log(`Updated MARKETING_CONTENT_RELEASE in ${options.config}`);
  } else {
    console.log(
      `Set MARKETING_CONTENT_RELEASE=${release.releaseId} before deploy`
    );
  }
}

await main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
