export const CHAT_BOTTOM_THRESHOLD = 40;

export interface ChatScrollViewport {
  clientHeight: number;
  scrollHeight: number;
  scrollTop: number;
  scrollTo(options: ScrollToOptions): void;
}

/**
 * Tracks whether transcript growth should stay pinned to the latest message.
 * User scrolling is the only action that disables following; sending a new
 * message or pressing the jump-to-bottom control enables it again.
 */
export class ChatAutoScroll {
  private followingLatest = true;

  constructor(private readonly threshold = CHAT_BOTTOM_THRESHOLD) {}

  updateFromViewport(viewport: ChatScrollViewport): boolean {
    const distance =
      viewport.scrollHeight - viewport.scrollTop - viewport.clientHeight;
    this.followingLatest = distance < this.threshold;
    return this.followingLatest;
  }

  followLatest(): void {
    this.followingLatest = true;
  }

  reset(): void {
    this.followLatest();
  }

  sync(
    viewport: ChatScrollViewport,
    behavior: ScrollBehavior = 'auto'
  ): boolean {
    if (!this.followingLatest) return false;
    viewport.scrollTo({ top: viewport.scrollHeight, behavior });
    return true;
  }
}
