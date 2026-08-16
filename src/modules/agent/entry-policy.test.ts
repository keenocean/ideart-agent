import { describe, expect, it } from 'vitest';

import { catalogRouteSegment } from '@/config/catalog/paths';
import type { CatalogDefinition } from '@/config/catalog/types';
import { normalizeClientGenerationSettings } from '@/lib/agent-settings';

import {
  applyEffectiveGenerationPolicy,
  parseGenerationRequestAttachments,
  resolveEffectiveGenerationPolicy,
  validateRequestAttachments,
  validateToolPolicyAttachments,
} from './entry-policy';

const imageTool: CatalogDefinition = {
  kind: 'tool',
  entityId: 'sample-image-generator',
  publication: 'listed',
  availability: 'live',
  localePages: {
    en: {
      slug: catalogRouteSegment('sample-image-generator'),
      indexing: 'noindex',
    },
  },
  placement: { directoryOrder: 1 },
  archetype: 'image-generator',
  execution: {
    kind: 'agent-preset',
    mediaMode: 'image',
    inputPolicy: { minimum: 0, maximum: 16, accepts: ['image'] },
  },
};

const referenceTool: CatalogDefinition = {
  kind: 'tool',
  entityId: 'sample-reference-to-video',
  publication: 'listed',
  availability: 'live',
  localePages: {
    en: {
      slug: catalogRouteSegment('sample-reference-to-video'),
      indexing: 'noindex',
    },
  },
  placement: { directoryOrder: 2 },
  archetype: 'reference-to-video',
  execution: {
    kind: 'agent-preset',
    mediaMode: 'video',
    videoOperation: 'reference',
  },
};

const videoModel: CatalogDefinition = {
  kind: 'model',
  entityId: 'sample-video-model',
  publication: 'listed',
  availability: 'live',
  localePages: {
    en: {
      slug: catalogRouteSegment('sample-video-model'),
      indexing: 'noindex',
    },
  },
  placement: { directoryOrder: 3 },
  modality: 'video',
  runtimeModelKey: 'seedance-2-5',
};

const catalogFixtures = [imageTool, referenceTool, videoModel];

const exactLocaleContentAvailable = (
  definition: CatalogDefinition,
  locale: string
) => Boolean(definition.localePages?.[locale as 'en']);

const resolveFixturePolicy: typeof resolveEffectiveGenerationPolicy = (
  context,
  isPageAvailable,
  definitions = catalogFixtures
) => resolveEffectiveGenerationPolicy(context, isPageAvailable, definitions);

describe('server generation entry policy', () => {
  it('keeps production Catalog entry points fail-closed by default', () => {
    expect(() =>
      resolveEffectiveGenerationPolicy(
        {
          kind: 'tool',
          entityId: 'sample-image-generator',
          locale: 'en',
        },
        exactLocaleContentAvailable
      )
    ).toThrow(/not available/);
  });

  it('rebuilds locks only for exact-locale content-backed Catalog pages', () => {
    expect(
      resolveFixturePolicy(
        {
          kind: 'tool',
          entityId: 'sample-image-generator',
          locale: 'en',
        },
        exactLocaleContentAvailable
      )
    ).toMatchObject({
      source: 'tool:sample-image-generator',
      lockedMediaMode: 'image',
      inputPolicy: { minimum: 0, maximum: 16, accepts: ['image'] },
    });
  });

  it('rejects forged, missing, contentless, or locale-mismatched Catalog identity', () => {
    expect(() =>
      resolveFixturePolicy(
        {
          kind: 'model',
          entityId: 'retired-model',
          locale: 'en',
        },
        exactLocaleContentAvailable
      )
    ).toThrow(/not available/);
    expect(() =>
      resolveFixturePolicy(
        {
          kind: 'tool',
          entityId: 'sample-image-generator',
          locale: 'fr' as 'en',
        },
        exactLocaleContentAvailable
      )
    ).toThrow(/not available/);
    expect(() =>
      resolveFixturePolicy(
        {
          kind: 'tool',
          entityId: 'missing-video-tool',
          locale: 'en',
        },
        exactLocaleContentAvailable
      )
    ).toThrow(/not available/);
    expect(() =>
      resolveFixturePolicy(
        {
          kind: 'model',
          entityId: 'sample-video-model',
          locale: 'en',
        },
        () => false
      )
    ).toThrow(/not available/);
  });

  it('normalizes client settings before applying server-owned locks', () => {
    const client = normalizeClientGenerationSettings({
      mediaMode: 'video',
      modelName: 'seedance-2-5',
      imageModelName: 'gpt-image-2',
    })!;
    const policy = resolveFixturePolicy(
      {
        kind: 'tool',
        entityId: 'sample-image-generator',
        locale: 'en',
      },
      exactLocaleContentAvailable
    );
    expect(applyEffectiveGenerationPolicy(client, policy)).toMatchObject({
      mediaMode: 'image',
    });
  });

  it('uses the union attachment policy on a multi-operation video model page', () => {
    expect(
      resolveFixturePolicy(
        {
          kind: 'model',
          entityId: 'sample-video-model',
          locale: 'en',
        },
        exactLocaleContentAvailable
      )
    ).toMatchObject({
      lockedMediaMode: 'video',
      lockedVideoModel: 'seedance-2-5',
      inputPolicy: {
        minimum: 0,
        maximum: 50,
        accepts: ['image', 'video', 'audio'],
      },
    });
  });

  it('rebuilds a video tool operation from the server Catalog', () => {
    const policy = resolveFixturePolicy(
      {
        kind: 'tool',
        entityId: 'sample-reference-to-video',
        locale: 'en',
      },
      exactLocaleContentAvailable
    );
    expect(policy).toMatchObject({
      source: 'tool:sample-reference-to-video',
      lockedMediaMode: 'video',
      lockedVideoOperation: 'reference',
      inputPolicy: {
        minimum: 1,
        maximum: 50,
        accepts: ['image', 'video', 'audio'],
      },
    });

    const incompatible = normalizeClientGenerationSettings({
      mediaMode: 'video',
      modelName: 'minimax-h3',
      imageModelName: 'gpt-image-2',
    })!;
    expect(() => applyEffectiveGenerationPolicy(incompatible, policy)).toThrow(
      /does not support this tool operation/
    );
  });
});

describe('server generation attachment boundary', () => {
  it('accepts structured public attachments and binds them to the message block', () => {
    const attachments = parseGenerationRequestAttachments([
      { mediaType: 'image', url: 'https://cdn.example.com/start.png' },
    ]);
    expect(attachments).toEqual([
      { mediaType: 'image', url: 'https://cdn.example.com/start.png' },
    ]);
    expect(
      validateRequestAttachments({
        message:
          'Animate this\n\nAttached media:\n- image 1: https://cdn.example.com/start.png',
        attachments: attachments!,
        policy: resolveFixturePolicy(
          {
            kind: 'tool',
            entityId: 'sample-image-generator',
            locale: 'en',
          },
          exactLocaleContentAvailable
        ),
        settings: normalizeClientGenerationSettings({
          mediaMode: 'image',
          imageModelName: 'gpt-image-2',
        })!,
      })
    ).toBeNull();
  });

  it('rejects private URLs, media-type mismatches, message mismatches, disallowed media and excess inputs', () => {
    expect(
      parseGenerationRequestAttachments([
        { mediaType: 'image', url: 'http://127.0.0.1/private.png' },
      ])
    ).toBeNull();
    expect(
      parseGenerationRequestAttachments([
        { mediaType: 'image', url: 'https://cdn.example.com/start.mp4' },
      ])
    ).toBeNull();

    const policy = resolveFixturePolicy(
      {
        kind: 'tool',
        entityId: 'sample-image-generator',
        locale: 'en',
      },
      exactLocaleContentAvailable
    );
    const settings = normalizeClientGenerationSettings({
      mediaMode: 'image',
      imageModelName: 'gpt-image-2',
    })!;
    expect(
      validateRequestAttachments({
        message: 'Animate this',
        attachments: [
          { mediaType: 'image', url: 'https://cdn.example.com/start.png' },
        ],
        policy,
        settings,
      })
    ).toMatch(/does not match/);
    expect(
      validateRequestAttachments({
        message:
          'Animate this\n\nAttached media:\n- audio 1: https://cdn.example.com/a.mp3',
        attachments: [
          { mediaType: 'audio', url: 'https://cdn.example.com/a.mp3' },
        ],
        policy,
        settings,
      })
    ).toMatch(/does not accept audio/);
  });

  it('does not let an Agent tool invent reference media outside the validated payload', () => {
    const policy = {
      ...resolveFixturePolicy(
        {
          kind: 'tool' as const,
          entityId: 'sample-image-generator',
          locale: 'en' as const,
        },
        exactLocaleContentAvailable
      ),
      requestAttachments: [
        { mediaType: 'image' as const, url: 'https://cdn.example.com/a.png' },
      ],
    };
    expect(
      validateToolPolicyAttachments(policy, [
        { mediaType: 'image', url: 'https://cdn.example.com/b.png' },
      ])
    ).toMatch(/validated entry attachments/);
  });

  it('allows a tool to reuse current or same-chat verified media only', () => {
    const policy = {
      ...resolveFixturePolicy(
        {
          kind: 'tool' as const,
          entityId: 'sample-image-generator',
          locale: 'en' as const,
        },
        exactLocaleContentAvailable
      ),
      requestAttachments: [
        { mediaType: 'image' as const, url: 'https://cdn.example.com/new.png' },
      ],
      allowedAttachments: [
        { mediaType: 'image' as const, url: 'https://cdn.example.com/old.png' },
        { mediaType: 'image' as const, url: 'https://cdn.example.com/new.png' },
      ],
    };

    expect(
      validateToolPolicyAttachments(policy, [
        { mediaType: 'image', url: 'https://cdn.example.com/old.png' },
        { mediaType: 'image', url: 'https://cdn.example.com/new.png' },
      ])
    ).toBeNull();
    expect(
      validateToolPolicyAttachments(policy, [
        { mediaType: 'image', url: 'https://cdn.example.com/forged.png' },
      ])
    ).toMatch(/validated entry attachments/);
  });

  it('keeps the tool-level minimum even when the request-level minimum used same-chat history', () => {
    const policy = {
      entryContext: { kind: 'home' as const },
      source: 'home',
      inputPolicy: { minimum: 1, maximum: 1, accepts: ['image'] as const },
      allowedAttachments: [
        { mediaType: 'image' as const, url: 'https://cdn.example.com/old.png' },
      ],
    };

    expect(validateToolPolicyAttachments(policy, [])).toMatch(
      /requires at least 1 attachment/
    );
  });
});
