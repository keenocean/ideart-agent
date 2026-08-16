import { describe, expect, it } from 'vitest';

import { formatGRouterVideoOptions } from './grouter';

describe('formatGRouterVideoOptions', () => {
  it('maps MiniMax normalized inputs and resolves adaptive aspect ratio', () => {
    expect(
      formatGRouterVideoOptions('minimax-h3', {
        aspect_ratio: 'adaptive',
        duration: 6,
        resolution: '2K',
        generate_audio: false,
        image_input: [
          'https://cdn.example.com/start.png',
          'https://cdn.example.com/end.png',
        ],
      })
    ).toEqual({
      aspect_ratio: '16:9',
      duration: 6,
      resolution: '2K',
      generate_audio: false,
      first_image_url: 'https://cdn.example.com/start.png',
      last_image_url: 'https://cdn.example.com/end.png',
    });
  });

  it('maps Seedance references without forwarding the internal auto ratio', () => {
    expect(
      formatGRouterVideoOptions('seedance-2.5', {
        aspect_ratio: 'auto',
        duration: 12,
        resolution: '720p',
        generate_audio: true,
        reference_image_urls: ['https://cdn.example.com/subject.png'],
        reference_video_urls: ['https://cdn.example.com/motion.mp4'],
        reference_audio_urls: ['https://cdn.example.com/voice.mp3'],
      })
    ).toEqual({
      duration: 12,
      resolution: '720p',
      generate_audio: true,
      reference_image_urls: ['https://cdn.example.com/subject.png'],
      reference_audio_urls: ['https://cdn.example.com/voice.mp3'],
      reference_video_urls: ['https://cdn.example.com/motion.mp4'],
    });
  });
});
