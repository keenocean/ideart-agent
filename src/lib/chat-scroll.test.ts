import { describe, expect, it, vi } from 'vitest';

import {
  CHAT_BOTTOM_THRESHOLD,
  ChatAutoScroll,
  type ChatScrollViewport,
} from './chat-scroll';

function viewport(
  overrides: Partial<ChatScrollViewport> = {}
): ChatScrollViewport {
  return {
    clientHeight: 600,
    scrollHeight: 1_200,
    scrollTop: 600,
    scrollTo: vi.fn(),
    ...overrides,
  };
}

describe('ChatAutoScroll', () => {
  it('keeps new transcript content pinned while the reader is at the bottom', () => {
    const autoScroll = new ChatAutoScroll();
    const element = viewport({ scrollHeight: 1_500 });

    expect(autoScroll.sync(element)).toBe(true);
    expect(element.scrollTo).toHaveBeenCalledWith({
      top: 1_500,
      behavior: 'auto',
    });
  });

  it('does not pull the reader away from older messages', () => {
    const autoScroll = new ChatAutoScroll();
    const element = viewport({ scrollTop: 300 });

    expect(autoScroll.updateFromViewport(element)).toBe(false);
    element.scrollHeight = 1_500;
    expect(autoScroll.sync(element)).toBe(false);
    expect(element.scrollTo).not.toHaveBeenCalled();
  });

  it('resumes following when the reader sends a new message', () => {
    const autoScroll = new ChatAutoScroll();
    const element = viewport({ scrollTop: 300 });
    autoScroll.updateFromViewport(element);

    autoScroll.followLatest();
    element.scrollHeight = 1_500;

    expect(autoScroll.sync(element, 'smooth')).toBe(true);
    expect(element.scrollTo).toHaveBeenCalledWith({
      top: 1_500,
      behavior: 'smooth',
    });
  });

  it('uses the same near-bottom threshold as the chat UI', () => {
    const autoScroll = new ChatAutoScroll();

    expect(
      autoScroll.updateFromViewport(
        viewport({ scrollTop: 600 - CHAT_BOTTOM_THRESHOLD + 1 })
      )
    ).toBe(true);
    expect(
      autoScroll.updateFromViewport(
        viewport({ scrollTop: 600 - CHAT_BOTTOM_THRESHOLD })
      )
    ).toBe(false);
  });
});
