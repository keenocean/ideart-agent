import { describe, expect, it } from 'vitest';

import { mediaTypeForAttachment, type PendingAttachment } from '@/lib/agent';
import {
  buildAgentMessage,
  initialTurnStorageKey,
  parseInitialTurnHandoff,
  serializeInitialTurnHandoff,
  splitAttachedImages,
} from '@/lib/agent-chat';

function attachment(
  id: string,
  kind: NonNullable<PendingAttachment['kind']>,
  url = `https://cdn.example.com/${id}`
): PendingAttachment {
  return {
    id,
    kind,
    name: id,
    preview: url,
    url,
    status: 'uploaded',
  };
}

describe('composer reference media', () => {
  it('uses the explicitly selected medium for an attachment-only turn', () => {
    const image = attachment('source.png', 'image');
    expect(buildAgentMessage('', [image], 'image')).toContain(
      'create or edit one still image'
    );
    expect(buildAgentMessage('', [image], 'video')).toContain('create a video');
  });

  it('preserves only uploaded media in the initial-turn handoff', () => {
    const uploaded = attachment('ready.png', 'image');
    const raw = serializeInitialTurnHandoff({
      prompt: 'Create this',
      skillName: 'storyboard',
      attachments: [
        uploaded,
        {
          ...attachment('pending.png', 'image'),
          status: 'uploading',
          url: undefined,
        },
      ],
    });
    expect(initialTurnStorageKey('s-123')).toBe('agent:initial-turn:s-123');
    expect(parseInitialTurnHandoff(raw)).toMatchObject({
      prompt: 'Create this',
      skillName: 'storyboard',
      attachments: [{ ...uploaded, preview: uploaded.url }],
    });
    expect(parseInitialTurnHandoff('{broken')).toBeNull();
  });

  it('keeps generic image material in order and hides its plumbing', () => {
    const message = buildAgentMessage('Animate this', [
      attachment('opening.png', 'image'),
      attachment('ending.png', 'image'),
    ]);

    expect(message).toContain('Attached media:');
    expect(message).toContain('- image 1:');
    expect(message).toContain('- image 2:');
    expect(message.indexOf('opening.png')).toBeLessThan(
      message.indexOf('ending.png')
    );
    expect(splitAttachedImages(message)).toEqual({
      text: 'Animate this',
      images: [
        'https://cdn.example.com/opening.png',
        'https://cdn.example.com/ending.png',
      ],
      audios: [],
      videos: [],
    });
  });

  it('preserves image, audio, and video without assigning generation roles', () => {
    const message = buildAgentMessage('Follow these references', [
      attachment('look.png', 'image'),
      attachment('beat.mp3', 'audio'),
      attachment('motion.mp4', 'video'),
    ]);

    expect(splitAttachedImages(message)).toEqual({
      text: 'Follow these references',
      images: ['https://cdn.example.com/look.png'],
      audios: ['https://cdn.example.com/beat.mp3'],
      videos: ['https://cdn.example.com/motion.mp4'],
    });
  });

  it('normalizes legacy parameter-specific drafts for the Agent', () => {
    expect(mediaTypeForAttachment({ kind: 'first_frame' })).toBe('image');
    expect(mediaTypeForAttachment({ kind: 'reference_image' })).toBe('image');
    expect(mediaTypeForAttachment({ kind: 'reference_audio' })).toBe('audio');
    expect(mediaTypeForAttachment({ kind: 'reference_video' })).toBe('video');
  });
});
