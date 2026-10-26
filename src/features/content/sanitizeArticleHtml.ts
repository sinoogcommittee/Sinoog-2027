import DOMPurify from 'dompurify';

const ARTICLE_TAGS = [
  'p', 'br', 'strong', 'em', 'b', 'i', 'u', 's',
  'h2', 'h3', 'h4', 'ul', 'ol', 'li', 'blockquote',
  'a', 'img', 'figure', 'figcaption', 'hr', 'code', 'pre',
];

const ARTICLE_ATTRIBUTES = [
  'href', 'title', 'src', 'alt', 'width', 'height', 'loading',
];

export function sanitizeArticleHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ARTICLE_TAGS,
    ALLOWED_ATTR: ARTICLE_ATTRIBUTES,
    ALLOW_DATA_ATTR: false,
    ALLOW_ARIA_ATTR: false,
    FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed', 'form', 'input', 'button', 'video', 'audio'],
    FORBID_ATTR: ['style', 'class', 'id', 'target'],
    USE_PROFILES: { html: true },
  });
}
