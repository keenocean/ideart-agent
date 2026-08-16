import { describe, expect, it } from 'vitest';

import { formatReplicateVideoOptions } from './replicate';

describe('formatReplicateVideoOptions', () => {
  it('maps normalized MiniMax inputs to Replicate prediction fields', () => {
    expect(
      formatReplicateVideoOptions('minimax/hailuo-2.3', {
        aspect_ratio: 'adaptive',
        duration: 6,
        resolution: '2K',
        generate_audio: false,
        image_input: ['https://cdn.example.com/start.png'],
      })
    ).toEqual({
      duration: 6,
      resolution: '2K',
      prompt_optimizer: true,
      first_frame_image: 'https://cdn.example.com/start.png',
    });
  });
});
