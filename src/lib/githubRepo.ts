export interface GitHubRepoReference {
  owner: string;
  repo: string;
  normalizedUrl: string;
}

export interface GitHubRepoMeta extends GitHubRepoReference {
  stars: number;
  avatarUrl?: string;
  htmlUrl: string;
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

  const response = await fetch(`https://api.github.com/repos/${reference.owner}/${reference.repo}`, {
    headers: {
      Accept: 'application/vnd.github+json',
    },
  });

  if (!response.ok) {
    if (response.status === 403) {
      throw new Error('rate-limited');
    }

    if (response.status === 404) {
      throw new Error('not-found');
    }

    throw new Error(`request-failed:${response.status}`);
  }

  const payload = await response.json() as {
    stargazers_count?: number;
    html_url?: string;
    owner?: { avatar_url?: string };
  };

  return {
    ...reference,
    stars: typeof payload.stargazers_count === 'number' ? payload.stargazers_count : 0,
    avatarUrl: payload.owner?.avatar_url,
    htmlUrl: payload.html_url || reference.normalizedUrl,
  };
}
