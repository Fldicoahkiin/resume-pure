const EMBEDDED_IMAGE_SOURCE = /^data:image\/[a-z0-9.+-]+;base64,[a-z0-9+/=\s]+$/i;

export function isSvgImageContentType(value: string | null): boolean {
  return value?.split(';', 1)[0].trim().toLowerCase() === 'image/svg+xml';
}

export function normalizeImageSource(value: string | undefined): string | undefined {
  const source = value?.trim();
  if (!source) {
    return undefined;
  }

  if (EMBEDDED_IMAGE_SOURCE.test(source)) {
    return source;
  }

  try {
    const url = new URL(source);
    if (url.protocol !== 'https:') {
      return undefined;
    }

    const githubProfile = url.hostname === 'github.com'
      ? url.pathname.match(/^\/([^/]+?)(?:\.png)?\/?$/i)
      : null;
    if (githubProfile) {
      return `https://avatars.githubusercontent.com/${githubProfile[1]}${url.search}`;
    }

    return url.href;
  } catch {
    return undefined;
  }
}
