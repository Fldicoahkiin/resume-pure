import { describe, expect, it } from 'vitest';
import { isSvgImageContentType, normalizeImageSource } from './imageSource';

describe('normalizeImageSource', () => {
  it('accepts HTTPS and embedded image sources', () => {
    expect(normalizeImageSource('  https://cdn.example.com/product.svg  ')).toBe(
      'https://cdn.example.com/product.svg',
    );
    expect(normalizeImageSource('data:image/png;base64,iVBORw0KGgo=')).toBe(
      'data:image/png;base64,iVBORw0KGgo=',
    );
    expect(normalizeImageSource('data:image/svg+xml;base64,PHN2Zz4=')).toBe(
      'data:image/svg+xml;base64,PHN2Zz4=',
    );
  });

  it('maps GitHub profile image links to the CORS-compatible avatar host', () => {
    expect(normalizeImageSource('https://github.com/AkaraChen.png')).toBe(
      'https://avatars.githubusercontent.com/AkaraChen',
    );
    expect(normalizeImageSource('https://github.com/Fldicoahkiin')).toBe(
      'https://avatars.githubusercontent.com/Fldicoahkiin',
    );
  });

  it.each([
    'http://cdn.example.com/product.png',
    'javascript:alert(1)',
    'file:///tmp/product.png',
    'blob:https://example.com/id',
    'data:text/html;base64,PHNjcmlwdD4=',
    'not a URL',
  ])('rejects unsupported image source %s', (source) => {
    expect(normalizeImageSource(source)).toBeUndefined();
  });
});

describe('isSvgImageContentType', () => {
  it('detects SVG responses with optional charset parameters', () => {
    expect(isSvgImageContentType('image/svg+xml')).toBe(true);
    expect(isSvgImageContentType('image/svg+xml; charset=utf-8')).toBe(true);
    expect(isSvgImageContentType('image/png')).toBe(false);
    expect(isSvgImageContentType(null)).toBe(false);
  });
});
