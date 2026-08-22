import { describe, expect, it } from 'vitest';
import en from './locales/en.json';
import ja from './locales/ja.json';
import zh from './locales/zh.json';
import zhTW from './locales/zh-TW.json';

const locales = { en, ja, zh, 'zh-TW': zhTW };

function flattenTranslations(
  value: Record<string, unknown>,
  prefix = '',
): Record<string, string> {
  return Object.entries(value).reduce<Record<string, string>>((translations, [key, child]) => {
    const path = prefix ? `${prefix}.${key}` : key;

    if (typeof child === 'string') {
      translations[path] = child;
      return translations;
    }

    return Object.assign(
      translations,
      flattenTranslations(child as Record<string, unknown>, path),
    );
  }, {});
}

function getInterpolationVariables(value: string): string[] {
  return [...value.matchAll(/{{\s*([^}\s]+)\s*}}/g)]
    .map((match) => match[1])
    .sort();
}

describe('locale resources', () => {
  const englishTranslations = flattenTranslations(en);

  it.each(Object.entries(locales))('%s has every translation key', (_, locale) => {
    expect(Object.keys(flattenTranslations(locale))).toEqual(
      Object.keys(englishTranslations),
    );
  });

  it.each(Object.entries(locales))('%s preserves interpolation variables', (_, locale) => {
    const translations = flattenTranslations(locale);

    for (const [key, englishValue] of Object.entries(englishTranslations)) {
      expect(getInterpolationVariables(translations[key])).toEqual(
        getInterpolationVariables(englishValue),
      );
    }
  });
});
