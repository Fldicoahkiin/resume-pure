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

  it('does not confuse public hostnames with private IPv6 prefixes', () => {
    expect(normalizeImageSource('https://fc.example.com/product.png')).toBe(
      'https://fc.example.com/product.png',
    );
    expect(normalizeImageSource('https://fe80.example.com/product.png')).toBe(
      'https://fe80.example.com/product.png',
    );
  });

  it.each([
    'http://cdn.example.com/product.png',
    'https://localhost/product.png',
    'https://resume.local/product.png',
    'https://127.0.0.1/product.png',
    'https://10.0.0.8/product.png',
    'https://172.16.0.8/product.png',
    'https://192.168.1.8/product.png',
    'https://169.254.1.8/product.png',
    'https://[::1]/product.png',
    'https://[fd00::1]/product.png',
    'https://user:password@cdn.example.com/product.png',
    'javascript:alert(1)',
    'file:///tmp/product.png',
    'blob:https://example.com/id',
    'data:text/html;base64,PHNjcmlwdD4=',
    'not a URL',
  ])('rejects unsupported image source %s', (source) => {
    expect(normalizeImageSource(source)).toBeUndefined();
  });

  it('rejects embedded images larger than the import limit', () => {
    const oversizedPayload = 'A'.repeat(700_000);
    expect(normalizeImageSource(`data:image/png;base64,${oversizedPayload}`)).toBeUndefined();
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
