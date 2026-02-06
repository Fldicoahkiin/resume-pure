'use client';

import { useTranslation } from 'react-i18next';
import { Languages } from 'lucide-react';

export function LanguageToggle() {
  const { i18n } = useTranslation();

  const toggleLanguage = () => {
    const newLang = i18n.language === 'zh' ? 'en' : 'zh';
    i18n.changeLanguage(newLang);
  };

  return (
    <button
      onClick={toggleLanguage}
      className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition"
      title={i18n.language === 'zh' ? 'Switch to English' : '切换到中文'}
    >
      <Languages size={20} className="text-gray-600 dark:text-gray-400" />
    </button>
  );
}
