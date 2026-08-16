import { describe, expect, it } from 'vitest';

import { formatFalVideoOptions } from './fal';

describe('formatFalVideoOptions', () => {
  it('maps Seedance image-to-video fields to Fal names', () => {
    expect(
      formatFalVideoOptions('bytedance/seedance-2.5/image-to-video', {
        aspect_ratio: '9:16',
        duration: 8,
        resolution: '720p',
        generate_audio: true,
        image_input: [
          'https://cdn.example.com/start.png',
          'https://cdn.example.com/end.png',
        ],
      })
    ).toEqual({
      aspect_ratio: '9:16',
      duration: '8',
      resolution: '720p',
      generate_audio: true,
      image_url: 'https://cdn.example.com/start.png',
      end_image_url: 'https://cdn.example.com/end.png',
    });
  });

  it('uses the MiniMax endpoint variant to shape standard and pro inputs', () => {
    expect(
      formatFalVideoOptions(
        'fal-ai/minimax/hailuo-2.3/standard/image-to-video',
        {
          duration: 6,
          resolution: '768P',
          image_input: ['https://cdn.example.com/start.png'],
        }
      )
    ).toEqual({
      prompt_optimizer: true,
      duration: '6',
      image_url: 'https://cdn.example.com/start.png',
    });
    expect(
      formatFalVideoOptions('fal-ai/minimax/hailuo-2.3/pro/text-to-video', {
        duration: 6,
        resolution: '2K',
      })
    ).toEqual({ prompt_optimizer: true });
  });
});
