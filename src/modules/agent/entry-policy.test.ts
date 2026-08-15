import { describe, expect, it } from 'vitest';

import { normalizeClientGenerationSettings } from '@/lib/agent-settings';

import {
  applyEffectiveGenerationPolicy,
  parseGenerationRequestAttachments,
  resolveEffectiveGenerationPolicy,
  validateRequestAttachments,
  validateToolPolicyAttachments,
} from './entry-policy';

describe('server generation entry policy', () => {
  it('rebuilds tool and model locks from the server Catalog', () => {
    expect(
      resolveEffectiveGenerationPolicy({
        kind: 'tool',
        entityId: 'image-to-video',
        locale: 'en',
      })
    ).toMatchObject({
      source: 'tool:image-to-video',
      lockedMediaMode: 'video',
      inputPolicy: { minimum: 1, maximum: 2, accepts: ['image'] },
    });
    expect(
      resolveEffectiveGenerationPolicy({
        kind: 'model',
        entityId: 'gpt-image-2',
        locale: 'zh',
      })
    ).toMatchObject({
      source: 'model:gpt-image-2',
      lockedMediaMode: 'image',
      lockedImageModel: 'gpt-image-2',
    });
  });

  it('rejects forged, missing, or locale-mismatched Catalog identity', () => {
    expect(() =>
      resolveEffectiveGenerationPolicy({
        kind: 'model',
        entityId: 'retired-model',
        locale: 'en',
      })
    ).toThrow(/not available/);
    expect(() =>
      resolveEffectiveGenerationPolicy({
        kind: 'tool',
        entityId: 'ai-image-generator',
        locale: 'fr' as 'en',
      })
    ).toThrow(/not available/);
  });

  it('normalizes client settings before applying server-owned locks', () => {
    const client = normalizeClientGenerationSettings({
      mediaMode: 'video',
      modelName: 'seedance-2-5',
      imageModelName: 'gpt-image-2',
    })!;
    const policy = resolveEffectiveGenerationPolicy({
      kind: 'model',
      entityId: 'gpt-image-2',
      locale: 'en',
    });
    expect(applyEffectiveGenerationPolicy(client, policy)).toMatchObject({
      mediaMode: 'image',
      imageModelName: 'gpt-image-2',
    });
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
        policy: resolveEffectiveGenerationPolicy({
          kind: 'tool',
          entityId: 'image-to-video',
          locale: 'en',
        }),
        settings: normalizeClientGenerationSettings({
          mediaMode: 'video',
          modelName: 'seedance-2-0',
        })!,
      })
    ).toBeNull();
  });

  it('rejects private URLs, message mismatches, disallowed media and excess inputs', () => {
    expect(
      parseGenerationRequestAttachments([
        { mediaType: 'image', url: 'http://127.0.0.1/private.png' },
      ])
    ).toBeNull();

    const policy = resolveEffectiveGenerationPolicy({
      kind: 'tool',
      entityId: 'image-to-video',
      locale: 'en',
    });
    const settings = normalizeClientGenerationSettings({
      mediaMode: 'video',
      modelName: 'seedance-2-0',
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
      ...resolveEffectiveGenerationPolicy({
        kind: 'tool' as const,
        entityId: 'image-to-video',
        locale: 'en' as const,
      }),
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
});
