import { describe, expect, it } from 'vitest';

import {
  createAgentTools,
  durationSeconds,
  guardGenerationRetries,
  pickVideoProvider,
  resolveReferenceImage,
} from './tools';

describe('createAgentTools', () => {
  it('exposes still-image and video generation tools', () => {
    expect(
      createAgentTools({ userId: 'user-1', sessionId: 'session-1' }).map(
        (tool) => tool.name
      )
    ).toEqual(['generate_image', 'generate_video', 'animate_image']);
  });

  it('restricts tools when the composer explicitly selects a medium', () => {
    expect(
      createAgentTools({
        userId: 'user-1',
        sessionId: 'session-1',
        settings: { mediaMode: 'image' },
      }).map((tool) => tool.name)
    ).toEqual(['generate_image']);
    expect(
      createAgentTools({
        userId: 'user-1',
        sessionId: 'session-1',
        settings: { mediaMode: 'video' },
      }).map((tool) => tool.name)
    ).toEqual(['generate_video', 'animate_image']);
  });

  it('keeps the upstream tool surface and narrows generate_video operations by model', () => {
    const operationsFor = (
      modelName: 'minimax-h3' | 'seedance-2-5' | 'seedance-2-0'
    ) => {
      const tools = createAgentTools({
        userId: 'user-1',
        sessionId: 'session-1',
        settings: { mediaMode: 'video', modelName },
      });
      expect(tools.map((tool) => tool.name)).toEqual([
        'generate_video',
        'animate_image',
      ]);
      const generateVideo = tools.find(
        (tool) => tool.name === 'generate_video'
      )!;
      return (
        generateVideo.inputSchema as unknown as {
          properties: { operation: { enum: string[] } };
        }
      ).properties.operation.enum;
    };

    expect(operationsFor('minimax-h3')).toEqual(['generate']);
    expect(operationsFor('seedance-2-0')).toEqual(['generate', 'reference']);
    expect(operationsFor('seedance-2-5')).toEqual([
      'generate',
      'reference',
      'edit',
      'extend',
    ]);
  });

  it('narrows semantic tool pages to their locked video operation', async () => {
    const animateTools = createAgentTools({
      userId: 'user-1',
      sessionId: 'session-1',
      settings: { mediaMode: 'video', modelName: 'seedance-2-5' },
      policy: {
        entryContext: {
          kind: 'tool',
          entityId: 'image-to-video',
          locale: 'en',
        },
        source: 'tool:image-to-video',
        lockedMediaMode: 'video',
        lockedVideoOperation: 'animate',
        inputPolicy: { minimum: 1, maximum: 2, accepts: ['image'] },
      },
    });
    expect(animateTools.map((tool) => tool.name)).toEqual(['animate_image']);

    const referenceTool = createAgentTools({
      userId: 'user-1',
      sessionId: 'session-1',
      settings: { mediaMode: 'video', modelName: 'seedance-2-5' },
      policy: {
        entryContext: {
          kind: 'tool',
          entityId: 'reference-to-video',
          locale: 'en',
        },
        source: 'tool:reference-to-video',
        lockedMediaMode: 'video',
        lockedVideoOperation: 'reference',
        inputPolicy: {
          minimum: 1,
          maximum: 50,
          accepts: ['image', 'video', 'audio'],
        },
      },
    })[0];
    expect(referenceTool.name).toBe('generate_video');
    expect(
      (
        referenceTool.inputSchema as unknown as {
          properties: { operation: { enum: string[] } };
        }
      ).properties.operation.enum
    ).toEqual(['reference']);
    const inferred = await referenceTool.call(
      { prompt: 'Follow the supplied materials' },
      { cwd: '/' }
    );
    expect(inferred.content).toContain(
      'This entry requires at least 1 attachment'
    );

    const conflictingTool = createAgentTools({
      userId: 'user-1',
      sessionId: 'session-1',
      settings: { mediaMode: 'video', modelName: 'seedance-2-5' },
      policy: {
        entryContext: {
          kind: 'tool',
          entityId: 'reference-to-video',
          locale: 'en',
        },
        source: 'tool:reference-to-video',
        lockedMediaMode: 'video',
        lockedVideoOperation: 'reference',
        inputPolicy: {
          minimum: 1,
          maximum: 50,
          accepts: ['image', 'video', 'audio'],
        },
      },
    })[0];
    const conflict = await conflictingTool.call(
      { prompt: 'Ignore the page', operation: 'generate' },
      { cwd: '/' }
    );
    expect(conflict.content).toContain('locked to the reference operation');
  });

  it('keeps the selected Skill reader alongside the medium tools', () => {
    expect(
      createAgentTools({
        userId: 'user-1',
        sessionId: 'session-1',
        settings: { mediaMode: 'image' },
        skill: {
          name: 'cinematic-skill',
          title: 'Cinematic',
          summary: 'Cinematic direction',
          instructions: 'Use deliberate framing.',
          references: {},
          releaseId: 'release-1',
        },
      }).map((tool) => tool.name)
    ).toEqual(['read_skill_resource', 'generate_image']);
  });

  it('prevents explicit tool model arguments from bypassing Catalog locks', async () => {
    const videoTool = createAgentTools({
      userId: 'user-1',
      sessionId: 'session-1',
      settings: { mediaMode: 'video', modelName: 'seedance-2-0' },
      policy: {
        entryContext: {
          kind: 'model',
          entityId: 'seedance-2-0',
          locale: 'en',
        },
        source: 'model:seedance-2-0',
        lockedMediaMode: 'video',
        lockedVideoModel: 'seedance-2-0',
        inputPolicy: { minimum: 0, maximum: 2, accepts: ['image'] },
      },
    }).find((tool) => tool.name === 'generate_video')!;
    const videoResult = await videoTool.call(
      { prompt: 'A product shot', model: 'minimax-h3' },
      { cwd: '/' }
    );
    expect(videoResult.content).toContain('locked to seedance-2-0');

    const imageTool = createAgentTools({
      userId: 'user-1',
      sessionId: 'session-1',
      settings: { mediaMode: 'image', imageModelName: 'gpt-image-2' },
      policy: {
        entryContext: {
          kind: 'model',
          entityId: 'gpt-image-2',
          locale: 'en',
        },
        source: 'model:gpt-image-2',
        lockedMediaMode: 'image',
        lockedImageModel: 'gpt-image-2',
        inputPolicy: { minimum: 0, maximum: 16, accepts: ['image'] },
      },
    })[0];
    const imageResult = await imageTool.call(
      { prompt: 'A poster', model: 'minimax-h3' },
      { cwd: '/' }
    );
    expect(imageResult.content).toContain('locked to gpt-image-2');
  });

  it('enforces page input policy again at the tool boundary', async () => {
    const [imageTool] = createAgentTools({
      userId: 'user-1',
      sessionId: 'session-1',
      settings: { mediaMode: 'image', imageModelName: 'gpt-image-2' },
      policy: {
        entryContext: {
          kind: 'tool',
          entityId: 'ai-image-editor',
          locale: 'en',
        },
        source: 'tool:ai-image-editor',
        lockedMediaMode: 'image',
        inputPolicy: { minimum: 1, maximum: 1, accepts: ['image'] },
      },
    });
    const result = await imageTool.call(
      { prompt: 'Remove the object', reference_images: [] },
      { cwd: '/' }
    );
    expect(result.content).toContain('requires at least 1 attachment');
  });

  it('enforces operation-specific reference limits before provider selection', async () => {
    const tools = createAgentTools({
      userId: 'user-1',
      sessionId: 'session-1',
      settings: { mediaMode: 'video', modelName: 'seedance-2-5' },
      policy: {
        entryContext: {
          kind: 'model',
          entityId: 'seedance-2-5',
          locale: 'en',
        },
        source: 'model:seedance-2-5',
        lockedMediaMode: 'video',
        lockedVideoModel: 'seedance-2-5',
        inputPolicy: {
          minimum: 0,
          maximum: 50,
          accepts: ['image', 'video', 'audio'],
        },
      },
    });
    const referenceTool = tools.find((tool) => tool.name === 'generate_video')!;
    const noReferences = await referenceTool.call(
      { prompt: 'Follow the reference', operation: 'reference' },
      { cwd: '/' }
    );
    expect(noReferences.content).toContain(
      'reference requires at least 1 source attachment'
    );

    const freshReferenceTool = createAgentTools({
      userId: 'user-1',
      sessionId: 'session-1',
      settings: { mediaMode: 'video', modelName: 'seedance-2-5' },
      policy: {
        entryContext: {
          kind: 'model',
          entityId: 'seedance-2-5',
          locale: 'en',
        },
        source: 'model:seedance-2-5',
        lockedMediaMode: 'video',
        lockedVideoModel: 'seedance-2-5',
        inputPolicy: {
          minimum: 0,
          maximum: 50,
          accepts: ['image', 'video', 'audio'],
        },
      },
    }).find((tool) => tool.name === 'generate_video')!;
    const tooManyVideos = await freshReferenceTool.call(
      {
        prompt: 'Follow the reference',
        operation: 'reference',
        reference_videos: Array.from(
          { length: 11 },
          (_, index) => `https://cdn.example.com/${index}.mp4`
        ),
      },
      { cwd: '/' }
    );
    expect(tooManyVideos.content).toContain(
      'reference accepts at most 10 video attachments'
    );
  });

  it('preserves upstream reference inference when operation is omitted', async () => {
    const generateVideo = createAgentTools({
      userId: 'user-1',
      sessionId: 'session-1',
      settings: { mediaMode: 'video', modelName: 'minimax-h3' },
    }).find((tool) => tool.name === 'generate_video')!;

    const result = await generateVideo.call(
      {
        prompt: 'Follow this style',
        reference_images: ['https://cdn.example.com/style.png'],
      },
      { cwd: '/' }
    );
    expect(result.content).toContain(
      'MiniMax H3 does not support the reference operation'
    );
  });

  it('requires one source video for edit and extend inside generate_video', async () => {
    for (const operation of ['edit', 'extend'] as const) {
      const generateVideo = createAgentTools({
        userId: 'user-1',
        sessionId: 'session-1',
        settings: { mediaMode: 'video', modelName: 'seedance-2-5' },
      }).find((tool) => tool.name === 'generate_video')!;
      const result = await generateVideo.call(
        { prompt: 'Continue the action', operation },
        { cwd: '/' }
      );
      expect(result.content).toContain(
        `${operation} requires at least 1 source attachment`
      );
    }
  });

  it('does not execute another generation after a same-turn failure', async () => {
    let calls = 0;
    const [tool] = guardGenerationRetries([
      {
        name: 'generate_image',
        description: 'test generator',
        inputSchema: { type: 'object', properties: {} },
        async call() {
          calls += 1;
          return {
            type: 'tool_result' as const,
            tool_use_id: '',
            content: JSON.stringify({
              status: 'error',
              message: 'upstream failed',
            }),
          };
        },
      },
    ]);

    const first = await tool.call({}, { cwd: '/' });
    const second = await tool.call({}, { cwd: '/' });

    expect(calls).toBe(1);
    expect(first.content).toContain('upstream failed');
    expect(second.content).toContain('Do not retry');
    expect(second.is_error).toBe(true);
  });
});

describe('resolveReferenceImage', () => {
  it('passes absolute URLs through untouched', () => {
    for (const url of [
      'https://cdn.example.com/a.png',
      'http://cdn.example.com/a.png',
      'HTTPS://CDN.EXAMPLE.COM/A.PNG',
    ]) {
      expect(resolveReferenceImage(url)).toBe(url);
    }
  });

  it('passes data URIs through untouched', () => {
    const uri = 'data:image/png;base64,iVBORw0KGgo=';
    expect(resolveReferenceImage(uri)).toBe(uri);
  });

  it('rejects site-relative paths that were not published by the composer', () => {
    expect(() => resolveReferenceImage('/imgs/examples/a.webp')).toThrow(
      /unsupported image reference/
    );
  });

  it('rejects absolute localhost URLs', () => {
    for (const local of [
      'http://localhost:3000/a.png',
      'http://127.0.0.1/a.png',
      'http://0.0.0.0/a.png',
      'http://[::1]/a.png',
      'http://10.0.0.1/a.png',
      'http://172.16.0.1/a.png',
      'http://192.168.1.1/a.png',
      'http://169.254.169.254/latest/meta-data',
      'http://metadata.local/a.png',
    ]) {
      expect(() => resolveReferenceImage(local)).toThrow(
        /unsupported image reference/
      );
    }
  });

  it('rejects a protocol-relative URL', () => {
    // `//elsewhere/x` looks relative but resolves off-site.
    expect(() => resolveReferenceImage('//elsewhere.com/a.png')).toThrow(
      /unsupported image reference/
    );
  });

  it('rejects anything else', () => {
    for (const bad of ['a.png', 'file:///etc/passwd', '../secret.png', '']) {
      expect(() => resolveReferenceImage(bad)).toThrow(
        /unsupported image reference/
      );
    }
  });

  it('trims surrounding whitespace before deciding', () => {
    expect(resolveReferenceImage('  https://cdn.example.com/a.png  ')).toBe(
      'https://cdn.example.com/a.png'
    );
  });
});

describe('durationSeconds', () => {
  it('prefers what the tool call asked for', () => {
    expect(durationSeconds(10, 5, 'minimax-h3')).toBe(10);
  });

  it('falls back to the composer setting', () => {
    expect(durationSeconds(undefined, 10, 'minimax-h3')).toBe(10);
  });

  it('uses the selected model default for non-numeric lengths', () => {
    for (const bad of [NaN, 'soon', null]) {
      expect(durationSeconds(bad, undefined, 'minimax-h3')).toBe(5);
    }
  });

  it('clamps lengths to the selected model range', () => {
    expect(durationSeconds(1, undefined, 'minimax-h3')).toBe(5);
    expect(durationSeconds(99, undefined, 'minimax-h3')).toBe(15);
    expect(durationSeconds(99, undefined, 'seedance-2-5')).toBe(30);
    expect(durationSeconds(99, undefined, 'seedance-2-0')).toBe(15);
  });
});

describe('pickVideoProvider', () => {
  it('returns null when nothing is configured', () => {
    expect(pickVideoProvider({})).toBeNull();
  });

  it('prefers gRouter when auto and the existing providers are configured', () => {
    expect(
      pickVideoProvider({
        grouter_api_key: 'g',
        grouter_base_url: 'https://gateway.example.com',
        fal_api_key: 'k',
        replicate_api_token: 't',
      })
    ).toBe('grouter');
  });

  it('prefers EvoLink in auto mode when it supports the selected model', () => {
    expect(
      pickVideoProvider(
        {
          evolink_api_key: 'e',
          grouter_api_key: 'g',
          grouter_base_url: 'https://gateway.example.com',
          fal_api_key: 'k',
          replicate_api_token: 't',
        },
        'seedance-2-0',
        'generate',
        '720p'
      )
    ).toBe('evolink');
  });

  it('selects EvoLink for Seedance 2.5 when it is configured', () => {
    expect(
      pickVideoProvider(
        {
          evolink_api_key: 'e',
          grouter_api_key: 'g',
          grouter_base_url: 'https://gateway.example.com',
        },
        'seedance-2-5',
        'animate',
        '720p'
      )
    ).toBe('evolink');
  });

  it('skips EvoLink when the selected model has no EvoLink route', () => {
    expect(
      pickVideoProvider(
        {
          evolink_api_key: 'e',
          grouter_api_key: 'g',
          grouter_base_url: 'https://gateway.example.com',
        },
        'minimax-h3',
        'generate',
        '2K'
      )
    ).toBe('grouter');
  });

  it('honours an explicit preference', () => {
    expect(
      pickVideoProvider({
        default_video_provider: 'replicate',
        fal_api_key: 'k',
        replicate_api_token: 't',
      })
    ).toBe('replicate');
  });

  it('falls back when the preferred provider has no credentials', () => {
    // A stale preference shouldn't take down generation that could still run.
    expect(
      pickVideoProvider({
        default_video_provider: 'replicate',
        fal_api_key: 'k',
      })
    ).toBe('fal');
  });
});
