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

export async function requestDeviceCode(): Promise<DeviceCodeResponse> {
  const response = await fetch('/api/github/device', { method: 'POST' });
  if (!response.ok) {
    throw new Error('device-code-failed');
  }
  return response.json() as Promise<DeviceCodeResponse>;
}

async function pollForToken(deviceCode: string, interval: number): Promise<string> {
  const pollInterval = Math.max(interval, 5) * 1000;

  return new Promise((resolve, reject) => {
    const timer = setInterval(async () => {
      try {
        const response = await fetch('/api/github/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ device_code: deviceCode }),
        });

        if (!response.ok) {
          clearInterval(timer);
          reject(new Error('token-exchange-failed'));
          return;
        }

        const data = await response.json() as {
          access_token?: string;
          error?: string;
        };

        if (data.access_token) {
          clearInterval(timer);
          resolve(data.access_token);
          return;
        }

        if (data.error === 'expired_token') {
          clearInterval(timer);
          reject(new Error('expired'));
          return;
        }

        if (data.error === 'access_denied') {
          clearInterval(timer);
          reject(new Error('denied'));
          return;
        }

        // authorization_pending or slow_down → keep polling
      } catch (error) {
        clearInterval(timer);
        reject(error);
      }
    }, pollInterval);
  });
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
