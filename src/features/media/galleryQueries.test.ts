import { describe, expect, it } from 'vitest';
import { getYouTubeId, normalizeYouTubeEmbed } from './galleryQueries';

describe('YouTube gallery embeds', () => {
  it('extracts a video id from an iframe embed code', () => {
    const value = '<iframe src="https://www.youtube.com/embed/dQw4w9WgXcQ" allowfullscreen></iframe>';
    expect(getYouTubeId(value)).toBe('dQw4w9WgXcQ');
    expect(normalizeYouTubeEmbed(value)).toBe('https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ');
  });

  it('accepts regular and shortened YouTube links', () => {
    expect(getYouTubeId('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
    expect(getYouTubeId('https://youtu.be/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
  });

  it('rejects arbitrary iframe sources', () => {
    expect(() => normalizeYouTubeEmbed('<iframe src="https://example.com/not-youtube"></iframe>')).toThrow(
      'Paste a valid YouTube link or iframe embed code.',
    );
  });
});
