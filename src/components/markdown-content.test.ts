import { describe, expect, it } from 'vitest';

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
});
