export type FontCategory = 'sans-serif' | 'serif' | 'handwriting';
export type FontLanguage = 'en' | 'zh';

export interface FontConfig {
  family: string;
  displayName: string;
  category: FontCategory;
  language: FontLanguage;
}

const FONT_FAMILIES: FontConfig[] = [
  {
    family: 'Roboto',
    displayName: 'Roboto',
    category: 'sans-serif',
    language: 'en',
  },
  {
    family: 'Inter',
    displayName: 'Inter',
    category: 'sans-serif',
    language: 'en',
  },
  {
    family: 'Lato',
    displayName: 'Lato',
    category: 'sans-serif',
    language: 'en',
  },
  {
    family: 'Montserrat',
    displayName: 'Montserrat',
    category: 'sans-serif',
    language: 'en',
  },
  {
    family: 'Open Sans',
    displayName: 'Open Sans',
    category: 'sans-serif',
    language: 'en',
  },
  {
    family: 'Raleway',
    displayName: 'Raleway',
    category: 'sans-serif',
    language: 'en',
  },
  {
    family: 'Merriweather',
    displayName: 'Merriweather',
    category: 'serif',
    language: 'en',
  },
  {
    family: 'Lora',
    displayName: 'Lora',
    category: 'serif',
    language: 'en',
  },
  {
    family: 'Playfair Display',
    displayName: 'Playfair Display',
    category: 'serif',
    language: 'en',
  },
  {
    family: 'Noto Sans SC',
    displayName: '思源黑体',
    category: 'sans-serif',
    language: 'zh',
  },
  {
    family: 'Noto Serif SC',
    displayName: '思源宋体',
    category: 'serif',
    language: 'zh',
  },
  {
    family: 'LXGW WenKai',
    displayName: '霞鹜文楷',
    category: 'handwriting',
    language: 'zh',
  },
];

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
