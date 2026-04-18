import fontManifest from '@/lib/fontManifest.json';

export type FontCategory = 'sans-serif' | 'serif' | 'handwriting';
export type FontLanguage = 'en' | 'zh';
export type FontStyle = 'normal' | 'italic';
export type FontFormat = 'truetype' | 'woff2' | 'woff' | 'opentype';

export interface FontFaceConfig {
  style: FontStyle;
  weight: number;
  src: string;
  format: FontFormat;
}

export interface FontConfig {
  family: string;
  displayName: string;
  category: FontCategory;
  language: FontLanguage;
  faces: readonly FontFaceConfig[];
}

function isFontCategory(value: unknown): value is FontCategory {
  return value === 'sans-serif' || value === 'serif' || value === 'handwriting';
}

function isFontLanguage(value: unknown): value is FontLanguage {
  return value === 'en' || value === 'zh';
}

function isFontStyle(value: unknown): value is FontStyle {
  return value === 'normal' || value === 'italic';
}

function isFontFormat(value: unknown): value is FontFormat {
  return value === 'truetype' || value === 'woff2' || value === 'woff' || value === 'opentype';
}

function isFontFaceConfig(value: unknown): value is FontFaceConfig {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  return (
    isFontStyle(candidate.style) &&
    typeof candidate.weight === 'number' &&
    typeof candidate.src === 'string' &&
    isFontFormat(candidate.format)
  );
}

function isFontConfig(value: unknown): value is FontConfig {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.family === 'string' &&
    typeof candidate.displayName === 'string' &&
    isFontCategory(candidate.category) &&
    isFontLanguage(candidate.language) &&
    Array.isArray(candidate.faces) &&
    candidate.faces.every(isFontFaceConfig)
  );
}

function readFontManifest(): readonly FontConfig[] {
  if (!Array.isArray(fontManifest) || !fontManifest.every(isFontConfig)) {
    throw new Error('invalid-font-manifest');
  }

  // JSON import 不保留字面量联合类型，这里在运行时校验通过后收窄到领域类型。
  return fontManifest as readonly FontConfig[];
}

const FONT_FAMILIES = readFontManifest();

export function getFontOptions() {
  const enSansSerif = FONT_FAMILIES.filter((font) => font.language === 'en' && font.category === 'sans-serif');
  const enSerif = FONT_FAMILIES.filter((font) => font.language === 'en' && font.category === 'serif');
  const zhFonts = FONT_FAMILIES.filter((font) => font.language === 'zh');

  return {
    enSansSerif,
    enSerif,
    zhFonts,
    all: FONT_FAMILIES,
  };
}

export function getFontManifest() {
  return FONT_FAMILIES;
}
