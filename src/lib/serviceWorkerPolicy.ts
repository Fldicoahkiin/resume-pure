export function shouldBypassRuntimeCache(url: URL) {
  return url.hostname === 'api.github.com';
}
