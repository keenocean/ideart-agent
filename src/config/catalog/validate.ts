import {
  AGENT_IMAGE_MODEL_OPTIONS,
  AGENT_MODEL_OPTIONS,
  videoOperationAttachmentPolicy,
  type VideoGenerationKind,
} from '@/lib/agent-settings';
import { locales } from '@/paraglide/runtime.js';

import type { LegacyCatalogRoute } from './legacy-routes';
import { catalogRouteSegment } from './paths';
import type { CatalogDefinition, ToolArchetype } from './types';

function assertOrder(value: number, label: string): void {
  if (!Number.isInteger(value) || value < 0) {
    throw new Error(`${label} must be a non-negative integer`);
  }
}

function assertContentModifiedAt(
  value: string | undefined,
  label: string
): void {
  if (
    value !== undefined &&
    (!/^\d{4}-\d{2}-\d{2}(?:T.*Z)?$/.test(value) ||
      Number.isNaN(Date.parse(value)))
  ) {
    throw new Error(`Invalid contentModifiedAt for ${label}`);
  }
}

export function validateCatalog(
  definitions: readonly CatalogDefinition[],
  legacyRoutes: readonly LegacyCatalogRoute[]
): void {
  const ids = new Set<string>();
  const slugs = new Set<string>();
  const imageModels = new Set(
    AGENT_IMAGE_MODEL_OPTIONS.map((model) => model.value)
  );
  const videoModels = new Set(AGENT_MODEL_OPTIONS.map((model) => model.value));

  for (const entry of definitions) {
    catalogRouteSegment(entry.entityId);
    if (ids.has(entry.entityId)) {
      throw new Error(`Duplicate Catalog entityId: ${entry.entityId}`);
    }
    ids.add(entry.entityId);
    const pages = entry.localePages ?? {};
    if (entry.publication !== 'hidden' && Object.keys(pages).length === 0) {
      throw new Error(`Catalog entry has no locale page: ${entry.entityId}`);
    }
    for (const [locale, page] of Object.entries(pages)) {
      if (!locales.includes(locale as (typeof locales)[number])) {
        throw new Error(
          `Unsupported Catalog locale ${locale}: ${entry.entityId}`
        );
      }
      if (!page) continue;
      catalogRouteSegment(page.slug);
      assertContentModifiedAt(
        page.contentModifiedAt,
        `${entry.entityId}:${locale}`
      );
      if (
        entry.publication === 'listed' &&
        (!('indexing' in page) ||
          (page.indexing !== 'index' && page.indexing !== 'noindex'))
      ) {
        throw new Error(
          `Listed Catalog page has invalid indexing: ${entry.entityId}:${locale}`
        );
      }
      if (
        entry.publication !== 'listed' &&
        'indexing' in page &&
        page.indexing === 'index'
      ) {
        throw new Error(
          `Non-listed Catalog page cannot be indexable: ${entry.entityId}:${locale}`
        );
      }
      if (
        entry.availability === 'coming-soon' &&
        'indexing' in page &&
        page.indexing === 'index'
      ) {
        throw new Error(
          `Coming-soon Catalog page cannot be indexable: ${entry.entityId}:${locale}`
        );
      }
      const key = `${entry.kind}:${locale}:${page.slug}`;
      if (slugs.has(key)) throw new Error(`Duplicate Catalog slug: ${key}`);
      slugs.add(key);
    }
    if (entry.publication === 'listed') {
      assertOrder(
        entry.placement.directoryOrder,
        `${entry.entityId} directoryOrder`
      );
      if (entry.placement.home) {
        assertOrder(entry.placement.home.order, `${entry.entityId} home order`);
      }
    } else if (
      (entry as CatalogDefinition & { placement?: unknown }).placement !==
      undefined
    ) {
      throw new Error(
        `Non-listed Catalog entry cannot have placement: ${entry.entityId}`
      );
    }
    if (entry.kind === 'tool') {
      const runtimeVideoPolicy =
        entry.execution.mediaMode === 'video'
          ? videoOperationAttachmentPolicy(entry.execution.videoOperation)
          : null;
      const inputPolicy = entry.execution.inputPolicy ?? runtimeVideoPolicy;
      if (!inputPolicy) {
        throw new Error(`Missing tool input policy: ${entry.entityId}`);
      }
      const { minimum, maximum, accepts } = inputPolicy;
      const expectsImageOutput =
        entry.archetype === 'image-generator' ||
        entry.archetype === 'image-editor' ||
        entry.archetype === 'background-editor';
      if (
        (expectsImageOutput && entry.execution.mediaMode !== 'image') ||
        (!expectsImageOutput && entry.execution.mediaMode !== 'video')
      ) {
        throw new Error(
          `Tool archetype/media mode mismatch: ${entry.entityId}`
        );
      }
      if (entry.execution.mediaMode === 'video') {
        const operationByArchetype: Partial<
          Record<ToolArchetype, VideoGenerationKind>
        > = {
          'text-to-video': 'generate',
          'image-to-video': 'animate',
          'reference-to-video': 'reference',
        };
        const expectedOperation = operationByArchetype[entry.archetype];
        if (
          expectedOperation &&
          entry.execution.videoOperation !== expectedOperation
        ) {
          throw new Error(
            `Tool archetype/video operation mismatch: ${entry.entityId}`
          );
        }
      }
      assertOrder(minimum, `${entry.entityId} input minimum`);
      if (maximum !== undefined) {
        assertOrder(maximum, `${entry.entityId} input maximum`);
        if (maximum < minimum) {
          throw new Error(`Invalid input range: ${entry.entityId}`);
        }
      }
      if (
        (accepts.length === 0 && maximum !== 0) ||
        new Set(accepts).size !== accepts.length
      ) {
        throw new Error(`Invalid accepted media list: ${entry.entityId}`);
      }
      if (
        runtimeVideoPolicy &&
        entry.execution.inputPolicy &&
        (minimum < runtimeVideoPolicy.minimum ||
          maximum === undefined ||
          maximum > runtimeVideoPolicy.maximum ||
          accepts.some(
            (mediaType) => !runtimeVideoPolicy.accepts.includes(mediaType)
          ))
      ) {
        throw new Error(`Tool input policy widens runtime: ${entry.entityId}`);
      }
    }
    if (entry.kind === 'model') {
      const valid =
        entry.modality === 'image'
          ? imageModels.has(entry.runtimeModelKey)
          : videoModels.has(entry.runtimeModelKey);
      if (!valid) {
        throw new Error(
          `Unknown ${entry.modality} runtime model: ${entry.runtimeModelKey}`
        );
      }
    }
  }

  for (const entry of definitions) {
    const relatedIds = new Set<string>();
    for (const relatedId of entry.related ?? []) {
      if (relatedIds.has(relatedId)) {
        throw new Error(
          `Duplicate related Catalog entry ${relatedId}: ${entry.entityId}`
        );
      }
      relatedIds.add(relatedId);
      if (relatedId === entry.entityId) {
        throw new Error(`Catalog entry relates to itself: ${entry.entityId}`);
      }
      if (!ids.has(relatedId)) {
        throw new Error(
          `Unknown related Catalog entry ${relatedId}: ${entry.entityId}`
        );
      }
    }
  }

  const legacySources = new Set<string>();
  for (const legacy of legacyRoutes) {
    if (!locales.includes(legacy.locale)) {
      throw new Error(`Unsupported legacy Catalog locale: ${legacy.locale}`);
    }
    catalogRouteSegment(legacy.fromSlug);
    const source = `${legacy.kind}:${legacy.locale}:${legacy.fromSlug}`;
    if (legacySources.has(source)) {
      throw new Error(`Duplicate legacy Catalog route: ${source}`);
    }
    legacySources.add(source);
    if (slugs.has(source)) {
      throw new Error(`Legacy source is still active: ${source}`);
    }
    if (legacy.action === 'redirect') {
      const target = definitions.find(
        (entry) => entry.entityId === legacy.toEntityId
      );
      if (
        !target ||
        target.kind !== legacy.kind ||
        target.publication === 'hidden' ||
        !target.localePages[legacy.locale]
      ) {
        throw new Error(`Invalid legacy redirect target: ${source}`);
      }
    }
  }
}
