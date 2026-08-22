'use client';

import { useCallback, useEffect, useReducer, useRef } from 'react';
import Image from 'next/image';
import { LogOut, Loader2 } from 'lucide-react';
import { siGithub } from 'simple-icons';
import { BrandIcon } from '@/components/BrandIcon';
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
  const loginAbortRef = useRef<AbortController | null>(null);

  useEffect(() => () => loginAbortRef.current?.abort(), []);

  const handleLogin = useCallback(async () => {
    loginAbortRef.current?.abort();
    const controller = new AbortController();
    loginAbortRef.current = controller;
    dispatch({ type: 'START_LOGIN' });
    try {
      const deviceData = await requestDeviceCode(controller.signal);
      dispatch({ type: 'DEVICE_CODE', userCode: deviceData.user_code, verifyUrl: deviceData.verification_uri });
      window.open(deviceData.verification_uri, '_blank');
      const user = await completeDeviceFlow(
        deviceData.device_code,
        deviceData.interval,
        deviceData.expires_in,
        controller.signal,
      );
      dispatch({ type: 'LOGIN_SUCCESS', user });
    } catch (error) {
      if (controller.signal.aborted) return;
      const msg = error instanceof Error ? error.message : 'unknown';
      dispatch({
        type: 'LOGIN_ERROR',
        error: msg === 'expired' ? t('editor.theme.githubAuthExpired') : t('editor.theme.githubAuthFailed'),
      });
    } finally {
      if (loginAbortRef.current === controller) {
        loginAbortRef.current = null;
      }
    }
  }, [t]);

  const handleLogout = useCallback(() => {
    loginAbortRef.current?.abort();
    loginAbortRef.current = null;
    clearAuth();
    dispatch({ type: 'LOGOUT' });
  }, []);

  return (
    <div className="border-t border-gray-200 pt-4 dark:border-gray-700">
      <div className="mb-3 flex items-center gap-2">
        <BrandIcon path={siGithub.path} size={16} className="text-gray-600 dark:text-gray-400" />
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">GitHub</span>
      </div>

      {auth.user ? (
        <div className="flex items-center justify-between gap-3">
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
              <p className="text-xs text-gray-500 dark:text-gray-400">{t('editor.theme.githubConnected')}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex items-center gap-1 px-1 py-1 text-xs font-medium text-gray-500 transition-colors hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
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
            className="inline-flex w-full items-center justify-center gap-2 rounded-md border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
          >
            {auth.loading ? <Loader2 size={16} className="animate-spin" /> : <BrandIcon path={siGithub.path} size={16} />}
            {auth.loading ? t('editor.theme.githubAuthWaiting') : t('editor.theme.githubLogin')}
          </button>

          {auth.deviceUserCode && (
            <div className="space-y-1.5 border-t border-gray-200 pt-2 dark:border-gray-700">
              <p className="text-xs text-gray-600 dark:text-gray-300">
                {t('editor.theme.githubDeviceHint')}
              </p>
              <div className="flex items-center gap-2">
                <code className="rounded-sm border border-gray-200 bg-gray-50 px-2 py-1 text-lg font-bold tracking-widest text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-white">
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
            <form onSubmit={(event) => event.preventDefault()}>
              <input
                type="text"
                name="username"
                autoComplete="username"
                value="github"
                readOnly
                tabIndex={-1}
                aria-hidden="true"
                className="sr-only"
              />
              <input
                type="password"
                name="github-token"
                autoComplete="new-password"
                aria-label={t('editor.theme.githubManualToken')}
                defaultValue={getStoredToken()}
                onChange={(e) => setManualToken(e.target.value)}
                className="mt-1.5 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                placeholder="ghp_xxxxxxxxxxxx"
              />
            </form>
          </details>
        </div>
      )}
    </div>
  );
}
