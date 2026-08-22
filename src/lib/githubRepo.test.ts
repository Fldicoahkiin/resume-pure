import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchGitHubPullRequests, fetchGitHubRepoMeta } from './githubRepo';

describe('GitHub response boundaries', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('rejects a successful repository response with a malformed body', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({}), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })));

    await expect(fetchGitHubRepoMeta('https://github.com/example/resume')).rejects.toThrow('invalid-response');
  });

  it('rejects malformed pull request records instead of creating empty proof links', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({
      items: [{ number: 42, title: 'Merged change', pull_request: { merged_at: '2026-08-01' } }],
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })));

    await expect(fetchGitHubPullRequests('https://github.com/example/resume', 'example')).rejects.toThrow('invalid-response');
  });
});
