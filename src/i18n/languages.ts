export const languageOptions = [
  { code: 'zh', label: '简体中文', documentLanguage: 'zh-CN' },
  { code: 'en', label: 'English', documentLanguage: 'en' },
  { code: 'zh-TW', label: '繁體中文', documentLanguage: 'zh-TW' },
  { code: 'ja', label: '日本語', documentLanguage: 'ja' },
] as const;

export const LANGUAGE_STORAGE_KEY = 'language';

export type SupportedLanguage = (typeof languageOptions)[number]['code'];

export function resolveSupportedLanguage(language: string | undefined): SupportedLanguage {
  const normalizedLanguage = language?.toLowerCase();

  if (
    normalizedLanguage === 'zh-tw' ||
    normalizedLanguage === 'zh-hk' ||
    normalizedLanguage === 'zh-mo' ||
    normalizedLanguage?.startsWith('zh-hant')
  ) {
    return 'zh-TW';
  }

  if (normalizedLanguage?.startsWith('zh')) {
    return 'zh';
  }

  if (normalizedLanguage?.startsWith('ja')) {
    return 'ja';
  }

  return 'en';
}

export function getDocumentLanguage(language: string | undefined): string {
  const resolvedLanguage = resolveSupportedLanguage(language);
  return languageOptions.find((option) => option.code === resolvedLanguage)!.documentLanguage;
}
