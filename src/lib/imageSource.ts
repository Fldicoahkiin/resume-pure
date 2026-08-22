const EMBEDDED_IMAGE_SOURCE = /^data:image\/[a-z0-9.+-]+;base64,([a-z0-9+/=\s]+)$/i;
const MAX_EMBEDDED_IMAGE_BYTES = 512 * 1024;

function getEmbeddedImageSize(payload: string) {
  const compact = payload.replace(/\s/g, '');
  const padding = compact.endsWith('==') ? 2 : compact.endsWith('=') ? 1 : 0;
  return Math.floor(compact.length * 3 / 4) - padding;
}

function isPrivateIpv4(hostname: string) {
  const octets = hostname.split('.').map(Number);
  if (octets.length !== 4 || octets.some((octet) => !Number.isInteger(octet) || octet < 0 || octet > 255)) {
    return false;
  }

  const [first, second] = octets;
  return first === 0
    || first === 10
    || first === 127
    || (first === 100 && second >= 64 && second <= 127)
    || (first === 169 && second === 254)
    || (first === 172 && second >= 16 && second <= 31)
    || (first === 192 && second === 168);
}

function isPrivateHostname(value: string) {
  const hostname = value.toLowerCase().replace(/^\[|\]$/g, '');
  if (hostname === 'localhost' || hostname.endsWith('.localhost') || hostname.endsWith('.local')) {
    return true;
  }
  if (!hostname.includes('.') && !hostname.includes(':')) {
    return true;
  }
  if (isPrivateIpv4(hostname)) {
    return true;
  }

  if (!hostname.includes(':')) {
    return false;
  }

  return hostname === '::'
    || hostname === '::1'
    || hostname.startsWith('::ffff:')
    || hostname.startsWith('fc')
    || hostname.startsWith('fd')
    || /^fe[89ab]/.test(hostname);
}

export function isSvgImageContentType(value: string | null): boolean {
  return value?.split(';', 1)[0].trim().toLowerCase() === 'image/svg+xml';
}

export function normalizeImageSource(value: string | undefined): string | undefined {
  const source = value?.trim();
  if (!source) {
    return undefined;
  }

  const embeddedMatch = source.match(EMBEDDED_IMAGE_SOURCE);
  if (embeddedMatch) {
    return getEmbeddedImageSize(embeddedMatch[1]) <= MAX_EMBEDDED_IMAGE_BYTES
      ? source
      : undefined;
  }

  try {
    const url = new URL(source);
    if (url.protocol !== 'https:') {
      return undefined;
    }
    if (url.username || url.password || isPrivateHostname(url.hostname)) {
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
