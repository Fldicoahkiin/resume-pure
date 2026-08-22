import { fetchWithTimeout } from './fetchWithTimeout';

interface DeviceCodeResponse {
  device_code: string;
  user_code: string;
  verification_uri: string;
  expires_in: number;
  interval: number;
}

export interface GitHubUser {
  login: string;
  avatar_url: string;
  html_url: string;
}

const GITHUB_CLIENT_ID = 'Ov23liQEMBP6qi66U653';

const TOKEN_KEY = 'resume-pure:github-token';
const USER_KEY = 'resume-pure:github-user';
const GITHUB_REQUEST_TIMEOUT_MS = 10_000;

function getSessionValue(key: string) {
  const current = sessionStorage.getItem(key);
  if (current) return current;

  const legacy = localStorage.getItem(key);
  if (!legacy) return '';

  sessionStorage.setItem(key, legacy);
  localStorage.removeItem(key);
  return legacy;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isGitHubUser(value: unknown): value is GitHubUser {
  return isRecord(value)
    && typeof value.login === 'string'
    && typeof value.avatar_url === 'string'
    && typeof value.html_url === 'string';
}

export function getStoredToken(): string {
  if (typeof window === 'undefined') return '';
  return getSessionValue(TOKEN_KEY);
}

export function getStoredUser(): GitHubUser | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = getSessionValue(USER_KEY);
    if (!raw) return null;

    const user: unknown = JSON.parse(raw);
    if (isGitHubUser(user)) return user;
    sessionStorage.removeItem(USER_KEY);
    return null;
  } catch {
    sessionStorage.removeItem(USER_KEY);
    return null;
  }
}

function saveAuth(token: string, user: GitHubUser) {
  sessionStorage.setItem(TOKEN_KEY, token);
  sessionStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearAuth() {
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(USER_KEY);
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function setManualToken(token: string) {
  const trimmed = token.trim();
  localStorage.removeItem(TOKEN_KEY);
  if (trimmed) {
    sessionStorage.setItem(TOKEN_KEY, trimmed);
  } else {
    sessionStorage.removeItem(TOKEN_KEY);
  }
}

export async function requestDeviceCode(signal?: AbortSignal): Promise<DeviceCodeResponse> {
  const response = await fetchWithTimeout('https://github.com/login/device/code', {
    method: 'POST',
    signal,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      client_id: GITHUB_CLIENT_ID,
      scope: 'read:user',
    }),
  }, GITHUB_REQUEST_TIMEOUT_MS);
  if (!response.ok) {
    throw new Error('device-code-failed');
  }
  const data: unknown = await response.json();
  if (!isRecord(data)
    || typeof data.device_code !== 'string'
    || typeof data.user_code !== 'string'
    || typeof data.verification_uri !== 'string'
    || typeof data.expires_in !== 'number'
    || typeof data.interval !== 'number') {
    throw new Error('device-code-invalid');
  }

  return {
    device_code: data.device_code,
    user_code: data.user_code,
    verification_uri: data.verification_uri,
    expires_in: data.expires_in,
    interval: data.interval,
  };
}

function delay(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    const onAbort = () => {
      clearTimeout(timeoutId);
      reject(signal?.reason instanceof Error ? signal.reason : new Error('cancelled'));
    };
    const timeoutId = setTimeout(() => {
      signal?.removeEventListener('abort', onAbort);
      resolve();
    }, ms);

    if (signal?.aborted) {
      onAbort();
      return;
    }
    signal?.addEventListener('abort', onAbort, { once: true });
  });
}

export async function exchangeDeviceCode(
  deviceCode: string,
  interval: number,
  expiresIn: number,
  signal?: AbortSignal,
): Promise<string> {
  let pollMs = Math.max(interval, 5) * 1000;
  const deadline = Date.now() + expiresIn * 1000;

  while (Date.now() < deadline) {
    await delay(Math.min(pollMs, deadline - Date.now()), signal);
    if (Date.now() >= deadline) {
      throw new Error('expired');
    }

    const response = await fetchWithTimeout('https://github.com/login/oauth/access_token', {
      method: 'POST',
      signal,
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: GITHUB_CLIENT_ID,
        device_code: deviceCode,
        grant_type: 'urn:ietf:params:oauth:grant-type:device_code',
      }),
    }, GITHUB_REQUEST_TIMEOUT_MS);

    if (!response.ok) {
      throw new Error('token-exchange-failed');
    }

    const payload: unknown = await response.json();
    if (!isRecord(payload)) {
      throw new Error('token-exchange-invalid');
    }
    const accessToken = typeof payload.access_token === 'string' ? payload.access_token : undefined;
    const providerError = typeof payload.error === 'string' ? payload.error : undefined;

    if (accessToken) {
      return accessToken;
    }

    if (providerError === 'authorization_pending') {
      continue;
    }

    if (providerError === 'slow_down') {
      pollMs += 5000;
      continue;
    }

    if (providerError === 'expired_token') {
      throw new Error('expired');
    }

    if (providerError === 'access_denied') {
      throw new Error('denied');
    }

    throw new Error('token-exchange-failed');
  }

  throw new Error('expired');
}

async function fetchUser(token: string, signal?: AbortSignal): Promise<GitHubUser> {
  const response = await fetchWithTimeout('https://api.github.com/user', {
    signal,
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${token}`,
    },
  }, GITHUB_REQUEST_TIMEOUT_MS);

  if (!response.ok) {
    throw new Error('fetch-user-failed');
  }

  const data: unknown = await response.json();
  if (!isGitHubUser(data)) {
    throw new Error('fetch-user-invalid');
  }

  return { login: data.login, avatar_url: data.avatar_url, html_url: data.html_url };
}

export async function completeDeviceFlow(
  deviceCode: string,
  interval: number,
  expiresIn: number,
  signal?: AbortSignal,
): Promise<GitHubUser> {
  const token = await exchangeDeviceCode(deviceCode, interval, expiresIn, signal);
  const user = await fetchUser(token, signal);
  saveAuth(token, user);
  return user;
}
