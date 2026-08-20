import { describe, expect, it } from 'vitest';
import { resolveProjectLogo } from './projectLogo';

describe('resolveProjectLogo', () => {
  it('prefers a valid custom product logo', () => {
    expect(resolveProjectLogo({
      customLogo: 'https://cdn.example.com/product.svg',
      repoAvatarUrl: 'https://avatars.githubusercontent.com/u/1',
    })).toEqual({
      src: 'https://cdn.example.com/product.svg',
      source: 'custom',
    });
  });

  it('falls back to the repository avatar when the custom source is unsafe', () => {
    expect(resolveProjectLogo({
      customLogo: 'javascript:alert(1)',
      repoAvatarUrl: 'https://avatars.githubusercontent.com/u/1',
    })).toEqual({
      src: 'https://avatars.githubusercontent.com/u/1',
      source: 'repository',
    });
  });

  it('returns no logo when neither source can be rendered', () => {
    expect(resolveProjectLogo({
      customLogo: 'http://example.com/logo.png',
      repoAvatarUrl: '',
    })).toBeUndefined();
  });
});
