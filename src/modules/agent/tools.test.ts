import { describe, expect, it } from 'vitest';

import {
  createAgentTools,
  durationSeconds,
  guardGenerationRetries,
  normalizeProviderAspectRatio,
  pickVideoProvider,
  providerOptionsFor,
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

describe('normalizeProviderAspectRatio', () => {
  it('turns MiniMax adaptive mode into a concrete upstream ratio', () => {
    expect(normalizeProviderAspectRatio('minimax-h3', 'adaptive')).toBe('16:9');
  });

  it('preserves concrete MiniMax and Seedance ratios', () => {
    expect(normalizeProviderAspectRatio('minimax-h3', '9:16')).toBe('9:16');
    expect(normalizeProviderAspectRatio('seedance-2-5', 'auto')).toBe('auto');
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

describe('providerOptionsFor', () => {
  it('maps Seedance 2.0 image-to-video settings to EvoLink', () => {
    expect(
      providerOptionsFor({
        provider: 'evolink',
        modelKey: 'seedance-2-0',
        kind: 'animate',
        options: {
          aspect_ratio: '16:9',
          duration: 8,
          resolution: '1080p',
          image_input: [
            'https://cdn.example.com/start.png',
            'https://cdn.example.com/end.png',
            'https://cdn.example.com/ignored.png',
          ],
        },
      })
    ).toEqual({
      aspect_ratio: '16:9',
      duration: 8,
      quality: '1080p',
      generate_audio: true,
      image_input: [
        'https://cdn.example.com/start.png',
        'https://cdn.example.com/end.png',
      ],
    });
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
