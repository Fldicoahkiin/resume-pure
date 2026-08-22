'use client';

import { Sun, Moon } from 'lucide-react';
import { useTheme } from '@teispace/next-themes';
import { useTranslation } from 'react-i18next';

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const { t } = useTranslation();
  const isDark = resolvedTheme === 'dark';

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className="
        relative w-10 h-10 rounded-full flex items-center justify-center
        bg-gray-100 dark:bg-gray-700
        hover:bg-gray-200 dark:hover:bg-gray-600
        text-gray-600 dark:text-amber-400
        transition-colors duration-200
        focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500
      "
      aria-label={isDark ? t('theme.switchToLight') : t('theme.switchToDark')}
    >
      <div className="relative w-5 h-5">
        <Sun
          size={20}
          className={`
            absolute inset-0 transform transition-all duration-500
            ${isDark ? 'opacity-0 rotate-180 scale-0' : 'opacity-100 rotate-0 scale-100'}
          `}
        />
        <Moon
          size={20}
          className={`
            absolute inset-0 transform transition-all duration-500
            ${isDark ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 rotate-180 scale-0'}
          `}
        />
      </div>
    </button>
  );
}
