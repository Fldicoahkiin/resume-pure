import { describe, expect, it } from 'vitest';
import { getDocumentLanguage, resolveSupportedLanguage } from './languages';

describe('resolveSupportedLanguage', () => {
  it.each([
    ['zh', 'zh'],
    ['zh-CN', 'zh'],
    ['zh-TW', 'zh-TW'],
    ['zh-Hant-HK', 'zh-TW'],
    ['zh-HK', 'zh-TW'],
    ['ja-JP', 'ja'],
    ['en-US', 'en'],
    [undefined, 'en'],
  ])('maps %s to %s', (language, expected) => {
    expect(resolveSupportedLanguage(language)).toBe(expected);
  });

  it('returns the matching document language', () => {
    expect(getDocumentLanguage('zh-Hant')).toBe('zh-TW');
    expect(getDocumentLanguage('ja-JP')).toBe('ja');
  });
});
