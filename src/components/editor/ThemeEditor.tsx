'use client';

import { useState, useEffect, useCallback } from 'react';
import { useResumeStore } from '@/store/resumeStore';
import { Settings, RotateCcw, Github, LogOut, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { FontSelector } from './FontSelector';
import { PAPER_SIZE_OPTIONS } from '@/lib/paper';
import {
  getStoredUser,
  clearAuth,
  requestDeviceCode,
  completeDeviceFlow,
} from '@/lib/githubAuth';
import type { GitHubUser } from '@/lib/githubAuth';
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
  const [githubUser, setGithubUser] = useState<GitHubUser | null>(null);
  const [deviceUserCode, setDeviceUserCode] = useState('');
  const [deviceVerifyUrl, setDeviceVerifyUrl] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');

  useEffect(() => {
    setGithubUser(getStoredUser());
  }, []);

  const handleLogin = useCallback(async () => {
    setAuthLoading(true);
    setAuthError('');
    setDeviceUserCode('');
    try {
      const deviceData = await requestDeviceCode();
      setDeviceUserCode(deviceData.user_code);
      setDeviceVerifyUrl(deviceData.verification_uri);
      window.open(deviceData.verification_uri, '_blank');
      const user = await completeDeviceFlow(deviceData.device_code, deviceData.interval);
      setGithubUser(user);
      setDeviceUserCode('');
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'unknown';
      setAuthError(msg === 'expired' ? t('editor.theme.githubAuthExpired') : t('editor.theme.githubAuthFailed'));
    } finally {
      setAuthLoading(false);
    }
  }, [t]);

  const handleLogout = useCallback(() => {
    clearAuth();
    setGithubUser(null);
    setDeviceUserCode('');
    setAuthError('');
  }, []);

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
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${theme.enableLinks !== false ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'
              }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${theme.enableLinks !== false ? 'translate-x-6' : 'translate-x-1'
                }`}
            />
          </button>
        </div>

        {/* GitHub 账号 */}
        <div className="border-t border-gray-200 pt-4 dark:border-gray-700">
          <div className="mb-3 flex items-center gap-2">
            <Github size={16} className="text-gray-600 dark:text-gray-400" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">GitHub</span>
          </div>

          {githubUser ? (
            <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 dark:border-gray-600 dark:bg-gray-700/40">
              <div className="flex items-center gap-2.5">
                <img
                  src={githubUser.avatar_url}
                  alt={githubUser.login}
                  className="h-8 w-8 rounded-full"
                />
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{githubUser.login}</p>
                  <p className="text-xs text-green-600 dark:text-green-400">{t('editor.theme.githubConnected')}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex items-center gap-1 rounded-full border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-500 transition hover:border-red-300 hover:text-red-500 dark:border-gray-600 dark:text-gray-400"
              >
                <LogOut size={12} />
                {t('editor.theme.githubLogout')}
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => void handleLogin()}
                disabled={authLoading}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
              >
                {authLoading ? <Loader2 size={16} className="animate-spin" /> : <Github size={16} />}
                {authLoading ? t('editor.theme.githubAuthWaiting') : t('editor.theme.githubLogin')}
              </button>

              {deviceUserCode && (
                <div className="rounded-xl border border-blue-200 bg-blue-50 px-3 py-2.5 dark:border-blue-500/30 dark:bg-blue-500/10">
                  <p className="text-xs text-blue-700 dark:text-blue-300">
                    {t('editor.theme.githubDeviceHint')}
                  </p>
                  <div className="mt-1.5 flex items-center gap-2">
                    <code className="rounded bg-white px-2 py-1 text-lg font-bold tracking-widest text-gray-900 dark:bg-gray-800 dark:text-white">
                      {deviceUserCode}
                    </code>
                    <a
                      href={deviceVerifyUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-600 underline hover:text-blue-800 dark:text-blue-400"
                    >
                      {t('editor.theme.githubOpenVerify')}
                    </a>
                  </div>
                </div>
              )}

              {authError && (
                <p className="text-xs text-red-500 dark:text-red-400">{authError}</p>
              )}

              <p className="text-xs text-gray-400 dark:text-gray-500">
                {t('editor.theme.githubTokenHint')}
              </p>
            </div>
          )}
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
