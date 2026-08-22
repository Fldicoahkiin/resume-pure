interface GitHubRepoReference {
  owner: string;
  repo: string;
  normalizedUrl: string;
}

export interface GitHubRepoMeta extends GitHubRepoReference {
  stars: number;
  avatarUrl?: string;
  htmlUrl: string;
}

import { clearAuth, getStoredToken } from './githubAuth';
import { fetchWithTimeout } from './fetchWithTimeout';

const GITHUB_REQUEST_TIMEOUT_MS = 10_000;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function normalizeInputUrl(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  return `https://${trimmed}`;
}

export function parseGitHubRepoUrl(input: string): GitHubRepoReference | null {
  const normalizedInput = normalizeInputUrl(input);
  if (!normalizedInput) return null;

  let url: URL;
  try {
    url = new URL(normalizedInput);
  } catch {
    return null;
  }

  const hostname = url.hostname.toLowerCase();
  if (hostname !== 'github.com' && hostname !== 'www.github.com') {
    return null;
  }

  const segments = url.pathname
    .replace(/\.git$/i, '')
    .split('/')
    .filter(Boolean);

  if (segments.length < 2) {
    return null;
  }

  const [owner, repo] = segments;
  if (!owner || !repo) {
    return null;
  }

  return {
    owner,
    repo,
    normalizedUrl: `https://github.com/${owner}/${repo}`,
  };
}

export async function fetchGitHubRepoMeta(input: string): Promise<GitHubRepoMeta> {
  const reference = parseGitHubRepoUrl(input);
  if (!reference) {
    throw new Error('invalid-url');
  }

  const headers: Record<string, string> = {
    Accept: 'application/vnd.github+json',
  };
  const token = getStoredToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetchWithTimeout(`https://api.github.com/repos/${reference.owner}/${reference.repo}`, {
    headers,
  }, GITHUB_REQUEST_TIMEOUT_MS);

  if (!response.ok) {
    if (response.status === 401 && token) {
      // token 已被吊销/失效，清掉存储让 UI 回到未登录态
      clearAuth();
    }

    if (response.status === 403) {
      throw new Error('rate-limited');
    }

    if (response.status === 404) {
      throw new Error('not-found');
    }

    throw new Error(`request-failed:${response.status}`);
  }

  const payload: unknown = await response.json();
  if (!isRecord(payload)
    || typeof payload.stargazers_count !== 'number'
    || typeof payload.html_url !== 'string'
    || !isRecord(payload.owner)
    || typeof payload.owner.avatar_url !== 'string') {
    throw new Error('invalid-response');
  }

  return {
    ...reference,
    stars: payload.stargazers_count,
    avatarUrl: payload.owner.avatar_url,
    htmlUrl: payload.html_url,
  };
}

export async function fetchGitHubPullRequests(repoUrl: string, authorLogin: string): Promise<import('@/types').ProjectProofRef[]> {
  const reference = parseGitHubRepoUrl(repoUrl);
  if (!reference) {
    throw new Error('invalid-url');
  }

  const headers: Record<string, string> = {
    Accept: 'application/vnd.github.v3+json',
  };
  const token = getStoredToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const query = encodeURIComponent(`repo:${reference.owner}/${reference.repo} author:${authorLogin} is:pr is:merged`);
  const response = await fetchWithTimeout(`https://api.github.com/search/issues?q=${query}&sort=created&order=desc&per_page=100`, {
    headers,
  }, GITHUB_REQUEST_TIMEOUT_MS);

  if (!response.ok) {
    if (response.status === 401 && token) {
      clearAuth();
    }
    if (response.status === 403) {
      throw new Error('rate-limited');
    }
    throw new Error(`request-failed:${response.status}`);
  }

  const payload: unknown = await response.json();
  if (!isRecord(payload) || !Array.isArray(payload.items)) {
    throw new Error('invalid-response');
  }
  return payload.items.map((item) => {
    if (!isRecord(item)
      || typeof item.html_url !== 'string'
      || typeof item.number !== 'number'
      || typeof item.title !== 'string'
      || !isRecord(item.pull_request)
      || typeof item.pull_request.merged_at !== 'string') {
      throw new Error('invalid-response');
    }

    return {
      id: `pr-${item.number}`,
      type: 'pr' as const,
      url: item.html_url,
      number: item.number,
      title: item.title,
      mergedAt: item.pull_request.merged_at,
    };
  });
}
