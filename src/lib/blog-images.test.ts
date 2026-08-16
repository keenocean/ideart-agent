import { describe, expect, it } from 'vitest';

import {
  createBlogMarkdownIt,
  inspectBlogMarkdownImages,
  parseBlogImageRef,
  parseStoredBlogImage,
  serializeBlogImageMarkdown,
  serializeStoredBlogImage,
  type BlogImageRef,
} from './blog-images';

const image: BlogImageRef = {
  url: 'https://cdn.example.com/marketing/blog/example/abcdef0123456789.webp',
  mimeType: 'image/webp',
  width: 1200,
  height: 630,
  bytes: 42_000,
  alt: 'A useful diagram',
  caption: 'How the workflow fits together',
};

describe('blog image contract', () => {
  it('round-trips stored cover metadata', () => {
    expect(parseStoredBlogImage(serializeStoredBlogImage(image))).toEqual(
      image
    );
    expect(parseStoredBlogImage('/imgs/legacy.webp')).toBeNull();
  });

  it('round-trips typed Markdown image metadata', () => {
    const markdown = serializeBlogImageMarkdown(image);
    expect(inspectBlogMarkdownImages(markdown)).toEqual({
      images: [image],
      invalidImages: 0,
    });
  });

  it('round-trips Markdown-sensitive alt text and captions', () => {
    const escapedImage = {
      ...image,
      alt: 'A [workflow] \\ map',
      caption: 'Caption "one" \\ two',
    };
    expect(
      inspectBlogMarkdownImages(serializeBlogImageMarkdown(escapedImage)).images
    ).toEqual([escapedImage]);
  });

  it('renders a dimensioned figure and escaped caption on the public page', () => {
    const html = createBlogMarkdownIt('public').render(
      serializeBlogImageMarkdown({
        ...image,
        caption: 'Caption <script>alert(1)</script>',
      })
    );
    expect(html).toContain('<figure class="blog-image">');
    expect(html).toContain('width="1200" height="630"');
    expect(html).toContain('loading="lazy" decoding="async"');
    expect(html).toContain(
      '<figcaption>Caption &lt;script&gt;alert(1)&lt;/script&gt;</figcaption>'
    );
    expect(html).not.toContain('<script>');
  });

  it('rejects untyped or inline images from the publishable inventory', () => {
    expect(
      inspectBlogMarkdownImages('![alt](https://example.com/a.webp)')
    ).toEqual({ images: [], invalidImages: 1 });
    expect(
      inspectBlogMarkdownImages(
        `Before ${serializeBlogImageMarkdown(image)} after`
      )
    ).toEqual({ images: [], invalidImages: 1 });
  });

  it('rejects oversized metadata before it reaches storage or markup', () => {
    expect(parseBlogImageRef({ ...image, width: 12_001 })).toBeNull();
    expect(parseBlogImageRef({ ...image, bytes: 10 * 1024 * 1024 + 1 })).toBe(
      null
    );
    expect(parseBlogImageRef({ ...image, alt: 'a'.repeat(301) })).toBeNull();
  });
});
