'use client';

import { useResumeStore } from '@/store/resumeStore';
import { Settings, RotateCcw } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const fontFamilies = [
  { value: 'Inter', label: 'Inter' },
  { value: 'system-ui', labelKey: 'System Default' },
  { value: 'Georgia', label: 'Georgia' },
  { value: 'Times New Roman', label: 'Times New Roman' },
  { value: 'Arial', label: 'Arial' },
  { value: 'Helvetica', label: 'Helvetica' },
  { value: 'Noto Sans SC', label: 'Noto Sans SC' },
  { value: 'Noto Serif SC', label: 'Noto Serif SC' },
];

const presetColors = [
  '#3b82f6', // blue
  '#10b981', // green
  '#8b5cf6', // purple
  '#f59e0b', // amber
  '#ef4444', // red
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#6366f1', // indigo
  '#84cc16', // lime
  '#374151', // gray
];

export function ThemeEditor() {
  const { t } = useTranslation();
  const { resume, hasHydrated, updateTheme, reset } = useResumeStore();

  if (!hasHydrated) {
    return (
      <div className="rounded-lg bg-white dark:bg-gray-800 p-6 shadow animate-pulse">
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4"></div>
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  const { theme } = resume;

  return (
    <section className="rounded-lg bg-white dark:bg-gray-800 p-6 shadow">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Settings className="h-5 w-5 text-gray-600 dark:text-gray-400" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{t('editor.theme.title')}</h2>
        </div>
        <button
          type="button"
          onClick={() => {
            if (confirm(t('editor.theme.resetConfirm'))) {
              reset();
            }
          }}
          className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 hover:text-red-500 transition"
        >
          <RotateCcw size={14} />
          {t('editor.theme.reset')}
        </button>
      </div>

      <div className="space-y-5">
        {/* 主题色 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {t('editor.theme.primaryColor')}
          </label>
          <div className="flex items-center gap-2 flex-wrap">
            {presetColors.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => updateTheme({ primaryColor: color })}
                className={`w-8 h-8 rounded-full border-2 transition ${
                  theme.primaryColor === color
                    ? 'border-gray-900 dark:border-white scale-110'
                    : 'border-transparent hover:scale-105'
                }`}
                style={{ backgroundColor: color }}
              />
            ))}
            <input
              type="color"
              value={theme.primaryColor}
              onChange={(e) => updateTheme({ primaryColor: e.target.value })}
              className="w-8 h-8 rounded cursor-pointer border border-gray-300 dark:border-gray-600"
              title={t('editor.theme.customColor')}
            />
          </div>
        </div>

        {/* 字体 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {t('editor.theme.fontFamily')}
          </label>
          <select
            value={theme.fontFamily}
            onChange={(e) => updateTheme({ fontFamily: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            {fontFamilies.map((font) => (
              <option key={font.value} value={font.value}>
                {font.label || font.labelKey}
              </option>
            ))}
          </select>
        </div>

        {/* 字号 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {t('editor.theme.fontSize')}: {theme.fontSize}pt
          </label>
          <input
            type="range"
            min="9"
            max="14"
            step="0.5"
            value={theme.fontSize}
            onChange={(e) => updateTheme({ fontSize: parseFloat(e.target.value) })}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-gray-400 dark:text-gray-500 mt-1">
            <span>9pt</span>
            <span>14pt</span>
          </div>
        </div>

        {/* 行高 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {t('editor.theme.lineHeight')}: {theme.lineHeight}
          </label>
          <input
            type="range"
            min="1.2"
            max="2"
            step="0.1"
            value={theme.lineHeight}
            onChange={(e) => updateTheme({ lineHeight: parseFloat(e.target.value) })}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-gray-400 dark:text-gray-500 mt-1">
            <span>{t('editor.theme.compact')}</span>
            <span>{t('editor.theme.relaxed')}</span>
          </div>
        </div>

        {/* 间距 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {t('editor.theme.spacing')}: {theme.spacing}px
          </label>
          <input
            type="range"
            min="4"
            max="16"
            step="2"
            value={theme.spacing}
            onChange={(e) => updateTheme({ spacing: parseInt(e.target.value) })}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-gray-400 dark:text-gray-500 mt-1">
            <span>{t('editor.theme.compact')}</span>
            <span>{t('editor.theme.relaxed')}</span>
          </div>
        </div>

        {/* 超链接开关 */}
        <div className="flex items-center justify-between">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              {t('editor.theme.enableLinks')}
            </label>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              {t('editor.theme.enableLinksHint')}
            </p>
          </div>
          <button
            type="button"
            onClick={() => updateTheme({ enableLinks: !theme.enableLinks })}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              theme.enableLinks !== false ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                theme.enableLinks !== false ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>

      {/* 未来设置提示 */}
      <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
        <p className="text-xs text-gray-400 dark:text-gray-500 text-center">
          {t('editor.theme.moreSettings')}
        </p>
      </div>
    </section>
  );
}
