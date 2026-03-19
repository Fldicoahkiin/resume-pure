'use client';

import { useReducer, useCallback } from 'react';
import Image from 'next/image';
import { Github, LogOut, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
  getStoredUser,
  getStoredToken,
  clearAuth,
  setManualToken,
  requestDeviceCode,
  completeDeviceFlow,
} from '@/lib/githubAuth';
import type { GitHubUser } from '@/lib/githubAuth';

interface AuthState {
  user: GitHubUser | null;
  deviceUserCode: string;
  deviceVerifyUrl: string;
  loading: boolean;
  error: string;
}

type AuthAction =
  | { type: 'START_LOGIN' }
  | { type: 'DEVICE_CODE'; userCode: string; verifyUrl: string }
  | { type: 'LOGIN_SUCCESS'; user: GitHubUser }
  | { type: 'LOGIN_ERROR'; error: string }
  | { type: 'LOGOUT' };

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'START_LOGIN':
      return { ...state, loading: true, error: '', deviceUserCode: '' };
    case 'DEVICE_CODE':
      return { ...state, deviceUserCode: action.userCode, deviceVerifyUrl: action.verifyUrl };
    case 'LOGIN_SUCCESS':
      return { ...state, user: action.user, deviceUserCode: '', loading: false };
    case 'LOGIN_ERROR':
      return { ...state, error: action.error, loading: false };
    case 'LOGOUT':
      return { ...state, user: null, deviceUserCode: '', error: '' };
  }
}

export function GitHubAuthSection() {
  const { t } = useTranslation();

  const [auth, dispatch] = useReducer(authReducer, null, () => ({
    user: getStoredUser(),
    deviceUserCode: '',
    deviceVerifyUrl: '',
    loading: false,
    error: '',
  }));

  const handleLogin = useCallback(async () => {
    dispatch({ type: 'START_LOGIN' });
    try {
      const deviceData = await requestDeviceCode();
      dispatch({ type: 'DEVICE_CODE', userCode: deviceData.user_code, verifyUrl: deviceData.verification_uri });
      window.open(deviceData.verification_uri, '_blank');
      const user = await completeDeviceFlow(deviceData.device_code, deviceData.interval);
      dispatch({ type: 'LOGIN_SUCCESS', user });
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'unknown';
      dispatch({
        type: 'LOGIN_ERROR',
        error: msg === 'expired' ? t('editor.theme.githubAuthExpired') : t('editor.theme.githubAuthFailed'),
      });
    }
  }, [t]);

  const handleLogout = useCallback(() => {
    clearAuth();
    dispatch({ type: 'LOGOUT' });
  }, []);

  return (
    <div className="border-t border-gray-200 pt-4 dark:border-gray-700">
      <div className="mb-3 flex items-center gap-2">
        <Github size={16} className="text-gray-600 dark:text-gray-400" />
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">GitHub</span>
      </div>

      {auth.user ? (
        <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 dark:border-gray-600 dark:bg-gray-700/40">
          <div className="flex items-center gap-2.5">
            <Image
              src={auth.user.avatar_url}
              alt={auth.user.login}
              width={32}
              height={32}
              unoptimized
              className="h-8 w-8 rounded-full"
            />
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">{auth.user.login}</p>
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
            disabled={auth.loading}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
          >
            {auth.loading ? <Loader2 size={16} className="animate-spin" /> : <Github size={16} />}
            {auth.loading ? t('editor.theme.githubAuthWaiting') : t('editor.theme.githubLogin')}
          </button>

          {auth.deviceUserCode && (
            <div className="rounded-xl border border-blue-200 bg-blue-50 px-3 py-2.5 dark:border-blue-500/30 dark:bg-blue-500/10">
              <p className="text-xs text-blue-700 dark:text-blue-300">
                {t('editor.theme.githubDeviceHint')}
              </p>
              <div className="mt-1.5 flex items-center gap-2">
                <code className="rounded bg-white px-2 py-1 text-lg font-bold tracking-widest text-gray-900 dark:bg-gray-800 dark:text-white">
                  {auth.deviceUserCode}
                </code>
                <a
                  href={auth.deviceVerifyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-600 underline hover:text-blue-800 dark:text-blue-400"
                >
                  {t('editor.theme.githubOpenVerify')}
                </a>
              </div>
            </div>
          )}

          {auth.error && (
            <p className="text-xs text-red-500 dark:text-red-400">{auth.error}</p>
          )}

          <p className="text-xs text-gray-400 dark:text-gray-500">
            {t('editor.theme.githubTokenHint')}
          </p>

          <details className="group">
            <summary className="cursor-pointer text-xs text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300">
              {t('editor.theme.githubManualToken')}
            </summary>
            <input
              type="password"
              defaultValue={getStoredToken()}
              onChange={(e) => setManualToken(e.target.value)}
              className="mt-1.5 block w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              placeholder="ghp_xxxxxxxxxxxx"
            />
          </details>
        </div>
      )}
    </div>
  );
}
