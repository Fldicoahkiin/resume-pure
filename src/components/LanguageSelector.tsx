'use client';

import { useId } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown, Languages } from 'lucide-react';
import { languageOptions, resolveSupportedLanguage } from '@/i18n/languages';

export function LanguageSelector() {
  const { t, i18n } = useTranslation();
  const selectId = useId();
  const currentLanguage = resolveSupportedLanguage(i18n.resolvedLanguage ?? i18n.language);

  return (
    <div className="relative shrink-0">
      <label htmlFor={selectId} className="sr-only">
        {t('common.selectLanguage')}
      </label>
      <Languages
        aria-hidden="true"
        size={16}
        className="pointer-events-none absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 sm:left-2.5 sm:translate-x-0"
      />
      <select
        id={selectId}
        title={t('common.selectLanguage')}
        value={currentLanguage}
        onChange={(event) => void i18n.changeLanguage(event.target.value)}
        className="h-9 w-9 cursor-pointer appearance-none rounded-md border border-gray-200 bg-white text-transparent outline-none transition-colors hover:border-gray-300 focus:border-gray-400 focus:ring-2 focus:ring-gray-300/60 dark:border-gray-700 dark:bg-gray-800 dark:hover:border-gray-600 dark:focus:border-gray-500 dark:focus:ring-gray-600/60 sm:w-[7.75rem] sm:pl-8 sm:pr-7 sm:text-sm sm:text-gray-700 sm:dark:text-gray-200"
      >
        {languageOptions.map((language) => (
          <option key={language.code} value={language.code} className="text-gray-900">
            {language.label}
          </option>
        ))}
      </select>
      <ChevronDown
        aria-hidden="true"
        size={14}
        className="pointer-events-none absolute right-2.5 top-1/2 hidden -translate-y-1/2 text-gray-500 dark:text-gray-400 sm:block"
      />
    </div>
  );
}
