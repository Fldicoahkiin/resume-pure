export interface DeviceCodeResponse {
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

const TOKEN_KEY = 'resume-pure:github-token';
const USER_KEY = 'resume-pure:github-user';

export function getStoredToken(): string {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem(TOKEN_KEY) || '';
}

export function getStoredUser(): GitHubUser | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) as GitHubUser : null;
  } catch {
    return null;
  }
}

function saveAuth(token: string, user: GitHubUser) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearAuth() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function setManualToken(token: string) {
  const trimmed = token.trim();
  if (trimmed) {
    localStorage.setItem(TOKEN_KEY, trimmed);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
}

export async function requestDeviceCode(): Promise<DeviceCodeResponse> {
  const response = await fetch('/api/github/device', { method: 'POST' });
  if (!response.ok) {
    throw new Error('device-code-failed');
  }
  return response.json() as Promise<DeviceCodeResponse>;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function pollForToken(deviceCode: string, interval: number): Promise<string> {
  let pollMs = Math.max(interval, 5) * 1000;

  for (;;) {
    await delay(pollMs);

    const response = await fetch('/api/github/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ device_code: deviceCode }),
    });

    if (!response.ok) {
      throw new Error('token-exchange-failed');
    }

    const data = await response.json() as {
      access_token?: string;
      error?: string;
    };

    if (data.access_token) {
      return data.access_token;
    }

    if (data.error === 'slow_down') {
      pollMs += 5000;
      continue;
    }

    if (data.error === 'expired_token') {
      throw new Error('expired');
    }

    if (data.error === 'access_denied') {
      throw new Error('denied');
    }
  }
}

async function fetchUser(token: string): Promise<GitHubUser> {
  const response = await fetch('https://api.github.com/user', {
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('fetch-user-failed');
  }

  const data = await response.json() as GitHubUser;
  return { login: data.login, avatar_url: data.avatar_url, html_url: data.html_url };
}

export async function completeDeviceFlow(deviceCode: string, interval: number): Promise<GitHubUser> {
  const token = await pollForToken(deviceCode, interval);
  const user = await fetchUser(token);
  saveAuth(token, user);
  return user;
}
