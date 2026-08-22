const RUNTIME_ASSET_DIRECTORIES = ['fonts/', 'vendor/'];

export function shouldPrecachePublicAsset(assetPath) {
  return !RUNTIME_ASSET_DIRECTORIES.some((directory) => assetPath.startsWith(directory));
}
