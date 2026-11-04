import { describe, expect, it } from 'vitest';
import { normalizeGitHubProfileUrl } from './resumeUtils';

describe('normalizeGitHubProfileUrl', () => {
  it('turns a GitHub username into its profile URL', () => {
    expect(normalizeGitHubProfileUrl('Fldicoahkiin')).toBe('https://github.com/Fldicoahkiin');
  });

  it('accepts usernames with digits and a leading @', () => {
    expect(normalizeGitHubProfileUrl('user123')).toBe('https://github.com/user123');
    expect(normalizeGitHubProfileUrl('@a1')).toBe('https://github.com/a1');
    expect(normalizeGitHubProfileUrl('12345678')).toBe('https://github.com/12345678');
  });

  it('keeps an existing GitHub profile URL', () => {
    expect(normalizeGitHubProfileUrl('https://github.com/Fldicoahkiin')).toBe(
      'https://github.com/Fldicoahkiin',
    );
  });

  it('rejects values that are neither a username nor a URL', () => {
    expect(normalizeGitHubProfileUrl('not a github username')).toBeUndefined();
  });
});
