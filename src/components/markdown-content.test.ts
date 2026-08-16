import { describe, expect, it } from 'vitest';

import { serializeBlogImageMarkdown } from '@/lib/blog-images';

import { MarkdownContent } from './markdown-content';

function renderMarkdown(content: string): string {
  const element = MarkdownContent({ content });
  return element.props.dangerouslySetInnerHTML.__html;
}

describe('MarkdownContent', () => {
  it('keeps the page title as the only h1 and preserves Unicode heading anchors', () => {
    expect(renderMarkdown('# 中文标题')).toContain(
      '<h2 id="中文标题">中文标题</h2>'
    );
  });

  it('keeps trusted external citations followable', () => {
    const html = renderMarkdown('[Source](https://example.com/reference)');

    expect(html).toContain('rel="noopener"');
    expect(html).not.toContain('nofollow');
  });

  it('renders typed Blog images with dimensions, alt text and captions', () => {
    const html = renderMarkdown(
      serializeBlogImageMarkdown({
        url: 'https://cdn.example.com/marketing/blog/post/abcdef0123456789.webp',
        mimeType: 'image/webp',
        width: 1200,
        height: 630,
        bytes: 1234,
        alt: 'Workflow diagram',
        caption: 'The complete workflow',
      })
    );
    expect(html).toContain('alt="Workflow diagram"');
    expect(html).toContain('width="1200" height="630"');
    expect(html).toContain('<figcaption>The complete workflow</figcaption>');
  });

  it('does not render untyped Markdown images', () => {
    expect(
      renderMarkdown('![unsafe](https://example.com/a.webp)')
    ).not.toContain('<img');
  });
});
