'use client';

import { useResumeStore } from '@/store/resumeStore';
import { Settings, RotateCcw } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { FontSelector } from './FontSelector';
import { PAPER_SIZE_OPTIONS } from '@/lib/paper';
import { GitHubAuthSection } from './GitHubAuthSection';
import type { PaperSize } from '@/types';

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

const THEME_SKELETON_KEYS = ['theme-1', 'theme-2', 'theme-3', 'theme-4'];

export function ThemeEditor() {
  const { t } = useTranslation();
  const { resume, hasHydrated, updateTheme, reset } = useResumeStore();

  if (!hasHydrated) {
    return (
      <div className="rounded-lg bg-white dark:bg-gray-800 p-6 shadow animate-pulse">
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4"></div>
        <div className="space-y-4">
          {THEME_SKELETON_KEYS.map((key) => (
            <div key={key} className="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
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
                className={`w-8 h-8 rounded-full border-2 transition ${theme.primaryColor === color
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
          <FontSelector
            value={theme.fontFamily}
            onChange={(fontFamily) => updateTheme({ fontFamily })}
          />
        </div>

        {/* 纸张尺寸 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {t('editor.theme.paperSize')}
          </label>
          <div className="grid grid-cols-2 gap-2">
            {PAPER_SIZE_OPTIONS.map((size) => (
              <button
                key={size}
                type="button"
                onClick={() => updateTheme({ paperSize: size })}
                className={`rounded-lg border px-3 py-2 text-left transition ${
                  theme.paperSize === size
                    ? 'border-gray-900 bg-gray-900 text-white dark:border-white dark:bg-white dark:text-gray-900'
                    : 'border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                <p className="text-sm font-semibold">{size}</p>
                <p className={`text-xs ${theme.paperSize === size ? 'text-gray-100 dark:text-gray-700' : 'text-gray-500 dark:text-gray-400'}`}>
                  {t(`editor.theme.paperSizeHint.${size.toLowerCase() as Lowercase<PaperSize>}`)}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* 字号 */}
        <div className="group">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {t('editor.theme.fontSize')}
              </label>
              {theme.fontSize !== 11 && (
                <button
                  type="button"
                  onClick={() => updateTheme({ fontSize: 11 })}
                  className="text-[10px] bg-gray-100 dark:bg-gray-700 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 px-1.5 py-0.5 rounded transition opacity-0 group-hover:opacity-100 scale-95 group-hover:scale-100"
                  title="恢复默认字号 (11pt)"
                >
                  回退默认
                </button>
              )}
            </div>
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                min="1"
                max="100"
                step="0.5"
                value={theme.fontSize}
                onChange={(e) => updateTheme({ fontSize: Number(e.target.value) || 11 })}
                className="w-14 h-7 text-xs font-semibold text-center bg-gray-50 border border-gray-200 rounded-md dark:bg-gray-900 dark:border-gray-700 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-1 focus:ring-gray-400 dark:focus:ring-gray-600 transition-shadow appearance-none"
              />
              <span className="text-xs text-gray-500 dark:text-gray-400 font-medium w-3">pt</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[10px] text-gray-400 tabular-nums">7</span>
            <input
              type="range"
              min="7"
              max="24"
              step="0.5"
              value={theme.fontSize}
              onChange={(e) => updateTheme({ fontSize: parseFloat(e.target.value) })}
              className="flex-1 accent-gray-900 dark:accent-gray-100"
            />
            <span className="text-[10px] text-gray-400 tabular-nums">24</span>
          </div>
        </div>

        {/* 行高 */}
        <div className="group">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {t('editor.theme.lineHeight')}
              </label>
              {theme.lineHeight !== 1.5 && (
                <button
                  type="button"
                  onClick={() => updateTheme({ lineHeight: 1.5 })}
                  className="text-[10px] bg-gray-100 dark:bg-gray-700 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 px-1.5 py-0.5 rounded transition opacity-0 group-hover:opacity-100 scale-95 group-hover:scale-100"
                  title="恢复默认行高 (1.5)"
                >
                  回退默认
                </button>
              )}
            </div>
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                min="0.5"
                max="5"
                step="0.05"
                value={theme.lineHeight}
                onChange={(e) => updateTheme({ lineHeight: Number(e.target.value) || 1.5 })}
                className="w-14 h-7 text-xs font-semibold text-center bg-gray-50 border border-gray-200 rounded-md dark:bg-gray-900 dark:border-gray-700 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-1 focus:ring-gray-400 dark:focus:ring-gray-600 transition-shadow appearance-none"
              />
              <span className="text-[10px] text-gray-400 font-medium w-3" />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[10px] text-gray-400 tabular-nums" title={t('editor.theme.compact')}>1.0</span>
            <input
              type="range"
              min="1.0"
              max="2.5"
              step="0.05"
              value={theme.lineHeight}
              onChange={(e) => updateTheme({ lineHeight: parseFloat(e.target.value) })}
              className="flex-1 accent-gray-900 dark:accent-gray-100"
            />
            <span className="text-[10px] text-gray-400 tabular-nums" title={t('editor.theme.relaxed')}>2.5</span>
          </div>
        </div>

        {/* 间距 */}
        <div className="group">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {t('editor.theme.spacing')}
              </label>
              {theme.spacing !== 8 && (
                <button
                  type="button"
                  onClick={() => updateTheme({ spacing: 8 })}
                  className="text-[10px] bg-gray-100 dark:bg-gray-700 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 px-1.5 py-0.5 rounded transition opacity-0 group-hover:opacity-100 scale-95 group-hover:scale-100"
                  title="恢复默认间距 (8px)"
                >
                  回退默认
                </button>
              )}
            </div>
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                min="0"
                max="100"
                step="1"
                value={theme.spacing}
                onChange={(e) => updateTheme({ spacing: Number(e.target.value) || 0 })}
                className="w-14 h-7 text-xs font-semibold text-center bg-gray-50 border border-gray-200 rounded-md dark:bg-gray-900 dark:border-gray-700 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-1 focus:ring-gray-400 dark:focus:ring-gray-600 transition-shadow appearance-none"
              />
              <span className="text-xs text-gray-500 dark:text-gray-400 font-medium w-3">px</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[10px] text-gray-400 tabular-nums">0</span>
            <input
              type="range"
              min="0"
              max="32"
              step="1"
              value={theme.spacing}
              onChange={(e) => updateTheme({ spacing: parseInt(e.target.value) })}
              className="flex-1 accent-gray-900 dark:accent-gray-100"
            />
            <span className="text-[10px] text-gray-400 tabular-nums">32</span>
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
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${theme.enableLinks !== false ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'
              }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${theme.enableLinks !== false ? 'translate-x-6' : 'translate-x-1'
                }`}
            />
          </button>
        </div>

        <GitHubAuthSection />
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
