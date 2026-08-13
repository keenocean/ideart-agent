import { describe, expect, it, vi } from 'vitest';

import { EvoLinkProvider } from './evolink';
import { AIMediaType, AITaskStatus } from './types';

const TEST_API_KEY = ['test', 'evolink', 'credential'].join('-');

function response(payload: unknown, ok = true, status = 200): Response {
  return {
    ok,
    status,
    json: async () => payload,
  } as Response;
}

describe('EvoLinkProvider', () => {
  it('submits normalized image input with Bearer authentication', async () => {
    const request = vi.fn(
      async (_input: string | URL | Request, _init?: RequestInit) =>
        response({
          id: 'task-image-1',
          status: 'pending',
          type: 'image',
        })
    );
    const provider = new EvoLinkProvider({
      apiKey: TEST_API_KEY,
      fetch: request,
    });

    const result = await provider.generate({
      params: {
        mediaType: AIMediaType.IMAGE,
        model: 'gpt-image-2',
        prompt: 'a red cube',
        callbackUrl: 'https://app.example/webhooks/evolink',
        options: {
          aspect_ratio: '16:9',
          quality: 'high',
          image_input: ['https://cdn.example.com/reference.png'],
        },
      },
    });

    expect(result.taskId).toBe('task-image-1');
    expect(result.taskStatus).toBe(AITaskStatus.PENDING);
    expect(request).toHaveBeenCalledOnce();
    const [url, init] = request.mock.calls[0];
    expect(String(url)).toBe('https://api.evolink.ai/v1/images/generations');
    expect((init?.headers as Record<string, string>).Authorization).toBe(
      `Bearer ${TEST_API_KEY}`
    );
    expect(JSON.parse(String(init?.body))).toEqual({
      quality: 'high',
      image_urls: ['https://cdn.example.com/reference.png'],
      size: '16:9',
      model: 'gpt-image-2',
      prompt: 'a red cube',
      callback_url: 'https://app.example/webhooks/evolink',
    });
  });

  it('submits Seedance video options unchanged', async () => {
    const request = vi.fn(
      async (_input: string | URL | Request, _init?: RequestInit) =>
        response({ id: 'task-video-1', status: 'pending', type: 'video' })
    );
    const provider = new EvoLinkProvider({
      apiKey: TEST_API_KEY,
      baseUrl: 'https://api.evolink.ai/',
      fetch: request,
    });

    await provider.generate({
      params: {
        mediaType: AIMediaType.VIDEO,
        model: 'seedance-2.0-image-to-video',
        prompt: 'slow cinematic push-in',
        options: {
          duration: 8,
          quality: '720p',
          aspect_ratio: '16:9',
          generate_audio: true,
          image_input: ['https://cdn.example.com/start.png'],
        },
      },
    });

    const [url, init] = request.mock.calls[0];
    expect(String(url)).toBe('https://api.evolink.ai/v1/videos/generations');
    expect(JSON.parse(String(init?.body))).toEqual({
      duration: 8,
      quality: '720p',
      aspect_ratio: '16:9',
      generate_audio: true,
      image_urls: ['https://cdn.example.com/start.png'],
      model: 'seedance-2.0-image-to-video',
      prompt: 'slow cinematic push-in',
    });
  });

  it('queries and normalizes completed video results', async () => {
    const provider = new EvoLinkProvider({
      apiKey: TEST_API_KEY,
      fetch: async () =>
        response({
          id: 'task-video-2',
          status: 'completed',
          type: 'video',
          results: ['https://temporary.example/generated.mp4'],
          created: 1_775_000_000,
        }),
    });

    const result = await provider.query({
      taskId: 'task-video-2',
      mediaType: AIMediaType.VIDEO,
    });

    expect(result.taskStatus).toBe(AITaskStatus.SUCCESS);
    expect(result.taskInfo?.videos?.[0]?.videoUrl).toBe(
      'https://temporary.example/generated.mp4'
    );
  });

  it('maps provider failures without exposing the response body', async () => {
    const provider = new EvoLinkProvider({
      apiKey: TEST_API_KEY,
      fetch: async () =>
        response({ error: { message: 'Invalid model' } }, false, 400),
    });

    await expect(
      provider.generate({
        params: {
          mediaType: AIMediaType.VIDEO,
          model: 'missing-model',
          prompt: 'test',
        },
      })
    ).rejects.toThrow('Invalid model');
  });
});
