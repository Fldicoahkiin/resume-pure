import { describe, expect, it } from 'vitest';
import { shouldBypassRuntimeCache } from './serviceWorkerPolicy';

describe('shouldBypassRuntimeCache', () => {
  it('keeps authenticated GitHub API requests out of Cache Storage', () => {
    expect(shouldBypassRuntimeCache(new URL('https://api.github.com/user'))).toBe(true);
    expect(shouldBypassRuntimeCache(new URL('https://api.github.com/repos/acme/resume'))).toBe(true);
  });

  it('allows public image assets to use the normal runtime cache', () => {
    expect(shouldBypassRuntimeCache(new URL('https://avatars.githubusercontent.com/acme'))).toBe(false);
    expect(shouldBypassRuntimeCache(new URL('https://cdn.example.com/logo.png'))).toBe(false);
  });
});
