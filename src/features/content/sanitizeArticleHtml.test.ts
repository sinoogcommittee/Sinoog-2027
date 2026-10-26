// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { sanitizeArticleHtml } from './sanitizeArticleHtml';

describe('sanitizeArticleHtml', () => {
  it('removes executable markup, event handlers, inline styles, and unsafe URLs', () => {
    const dirty = [
      '<script>alert(1)</script>',
      '<p style="color:red" onclick="alert(1)">Parish update</p>',
      '<a href="javascript:alert(1)" target="_blank">unsafe link</a>',
      '<img src="x" onerror="alert(1)" alt="Poster">',
      '<iframe src="https://example.com"></iframe>',
      '<form><input value="private"></form>',
    ].join('');

    const clean = sanitizeArticleHtml(dirty);

    expect(clean).not.toMatch(/script|onclick|onerror|style=|javascript:|iframe|form|input|target=/i);
    expect(clean).toContain('<p>Parish update</p>');
    expect(clean).toContain('alt="Poster"');
  });

  it('keeps the approved article formatting allowlist', () => {
    const clean = sanitizeArticleHtml(
      '<h2>Schedule</h2><p><strong>Confirmed</strong></p><ul><li>Mass</li></ul><a href="https://example.com" title="Details">Read more</a>'
    );

    expect(clean).toContain('<h2>Schedule</h2>');
    expect(clean).toContain('<strong>Confirmed</strong>');
    expect(clean).toContain('<ul><li>Mass</li></ul>');
    expect(clean).toContain('href="https://example.com"');
    expect(clean).toContain('title="Details"');
  });
});
