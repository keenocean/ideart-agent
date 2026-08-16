import MarkdownIt from 'markdown-it';

import {
  BLOG_IMAGE_MAX_BYTES,
  BLOG_IMAGE_MAX_EDGE,
  BLOG_IMAGE_MAX_PIXELS,
  type SupportedBlogImageMime,
} from './image-metadata';

export type BlogImageAsset = {
  url: string;
  mimeType: SupportedBlogImageMime;
  width: number;
  height: number;
  bytes: number;
};

export type BlogImageRef = BlogImageAsset & {
  alt: string;
  caption?: string;
};

type MarkdownMode = 'editor' | 'public';

const STORED_IMAGE_PREFIX = 'blog-image:v1:';
export const BLOG_IMAGE_ALT_MAX_LENGTH = 300;
export const BLOG_IMAGE_CAPTION_MAX_LENGTH = 500;
const IMAGE_METADATA_PATTERN =
  /^\{width=(\d+) height=(\d+) mime=(image\/(?:jpeg|png|webp)) bytes=(\d+)\}$/;

function positiveInteger(value: unknown): value is number {
  return Number.isSafeInteger(value) && Number(value) > 0;
}

function normalizedText(value: unknown): string {
  return typeof value === 'string' ? value.trim().replace(/\s+/g, ' ') : '';
}

export function parseBlogImageAsset(value: unknown): BlogImageAsset | null {
  if (!value || typeof value !== 'object') return null;
  const candidate = value as Partial<BlogImageAsset>;
  let url: URL;
  try {
    url = new URL(candidate.url || '');
  } catch {
    return null;
  }
  if (
    url.protocol !== 'https:' ||
    url.username ||
    url.password ||
    url.href.length > 2048 ||
    !['image/jpeg', 'image/png', 'image/webp'].includes(
      candidate.mimeType || ''
    ) ||
    !positiveInteger(candidate.width) ||
    !positiveInteger(candidate.height) ||
    !positiveInteger(candidate.bytes) ||
    candidate.width > BLOG_IMAGE_MAX_EDGE ||
    candidate.height > BLOG_IMAGE_MAX_EDGE ||
    candidate.width * candidate.height > BLOG_IMAGE_MAX_PIXELS ||
    candidate.bytes > BLOG_IMAGE_MAX_BYTES
  ) {
    return null;
  }
  return {
    url: url.href,
    mimeType: candidate.mimeType as SupportedBlogImageMime,
    width: candidate.width,
    height: candidate.height,
    bytes: candidate.bytes,
  };
}

export function parseBlogImageRef(value: unknown): BlogImageRef | null {
  const asset = parseBlogImageAsset(value);
  if (!asset || !value || typeof value !== 'object') return null;
  const candidate = value as Partial<BlogImageRef>;
  const alt = normalizedText(candidate.alt);
  const caption = normalizedText(candidate.caption);
  if (
    !alt ||
    alt.length > BLOG_IMAGE_ALT_MAX_LENGTH ||
    caption.length > BLOG_IMAGE_CAPTION_MAX_LENGTH
  ) {
    return null;
  }
  return { ...asset, alt, ...(caption ? { caption } : {}) };
}

export function serializeStoredBlogImage(image: BlogImageRef): string {
  const parsed = parseBlogImageRef(image);
  if (!parsed) throw new Error('Blog image metadata is invalid');
  return `${STORED_IMAGE_PREFIX}${JSON.stringify(parsed)}`;
}

export function parseStoredBlogImage(
  value: string | null | undefined
): BlogImageRef | null {
  if (!value?.startsWith(STORED_IMAGE_PREFIX)) return null;
  try {
    return parseBlogImageRef(
      JSON.parse(value.slice(STORED_IMAGE_PREFIX.length))
    );
  } catch {
    return null;
  }
}

function escapeMarkdownAlt(value: string): string {
  return value
    .replaceAll('\\', '\\\\')
    .replaceAll('[', '\\[')
    .replaceAll(']', '\\]');
}

function escapeMarkdownTitle(value: string): string {
  return value.replaceAll('\\', '\\\\').replaceAll('"', '\\"');
}

export function serializeBlogImageMarkdown(image: BlogImageRef): string {
  const parsed = parseBlogImageRef(image);
  if (!parsed) throw new Error('Blog image metadata is invalid');
  const title = parsed.caption
    ? ` "${escapeMarkdownTitle(parsed.caption)}"`
    : '';
  return `![${escapeMarkdownAlt(parsed.alt)}](${parsed.url}${title}){width=${parsed.width} height=${parsed.height} mime=${parsed.mimeType} bytes=${parsed.bytes}}`;
}

function parseImageToken(
  image: any,
  metadata: any,
  md: MarkdownIt
): BlogImageRef | null {
  if (image?.type !== 'image' || metadata?.type !== 'text') return null;
  const match = IMAGE_METADATA_PATTERN.exec(metadata.content);
  if (!match) return null;
  return parseBlogImageRef({
    url: image.attrGet('src'),
    alt: md.utils.unescapeAll(image.content),
    caption: image.attrGet('title') || undefined,
    width: Number(match[1]),
    height: Number(match[2]),
    mimeType: match[3],
    bytes: Number(match[4]),
  });
}

function addBlogImageBlocks(md: MarkdownIt, mode: MarkdownMode): void {
  md.core.ruler.after('inline', 'blog_image_blocks', (state) => {
    for (let index = 0; index < state.tokens.length - 2; index += 1) {
      const open = state.tokens[index];
      const inline = state.tokens[index + 1];
      const close = state.tokens[index + 2];
      if (
        open.type !== 'paragraph_open' ||
        inline.type !== 'inline' ||
        close.type !== 'paragraph_close' ||
        inline.children?.length !== 2
      ) {
        continue;
      }
      const image = parseImageToken(inline.children[0], inline.children[1], md);
      if (!image) continue;
      open.type = 'blog_image';
      open.tag = '';
      open.nesting = 0;
      open.meta = { blogImage: image };
      inline.hidden = true;
      close.hidden = true;
      index += 2;
    }
  });

  md.renderer.rules.blog_image = (tokens, index) => {
    const image = parseBlogImageRef(tokens[index].meta?.blogImage);
    if (!image) return '';
    const escape = md.utils.escapeHtml;
    const attributes = [
      `src="${escape(image.url)}"`,
      `alt="${escape(image.alt)}"`,
      `width="${image.width}"`,
      `height="${image.height}"`,
      `data-blog-image="true"`,
      `data-mime-type="${image.mimeType}"`,
      `data-bytes="${image.bytes}"`,
      ...(image.caption
        ? [
            `title="${escape(image.caption)}"`,
            `data-caption="${escape(image.caption)}"`,
          ]
        : []),
    ].join(' ');
    if (mode === 'editor') return `<img ${attributes}>`;
    return [
      '<figure class="blog-image">',
      `<img ${attributes} loading="lazy" decoding="async">`,
      ...(image.caption
        ? [`<figcaption>${escape(image.caption)}</figcaption>`]
        : []),
      '</figure>',
    ].join('');
  };

  // Only the typed standalone syntax above may render an image. A pasted or
  // hand-written untyped image stays invisible and fails publication checks.
  md.renderer.rules.image = () => '';
}

export function createBlogMarkdownIt(mode: MarkdownMode): MarkdownIt {
  const md = new MarkdownIt({ html: false, linkify: true });
  addBlogImageBlocks(md, mode);
  return md;
}

function remainingImageTokens(tokens: readonly any[]): number {
  let count = 0;
  for (const token of tokens) {
    if (token.hidden) continue;
    if (token.type === 'image') count += 1;
    if (token.children) count += remainingImageTokens(token.children);
  }
  return count;
}

export function inspectBlogMarkdownImages(markdown: string): {
  images: BlogImageRef[];
  invalidImages: number;
} {
  const tokens = createBlogMarkdownIt('public').parse(markdown, {});
  return {
    images: tokens
      .filter((token) => token.type === 'blog_image')
      .map((token) => parseBlogImageRef(token.meta?.blogImage))
      .filter((image): image is BlogImageRef => image !== null),
    invalidImages: remainingImageTokens(tokens),
  };
}
