import { describe, expect, it } from 'vitest';
import { shouldPrecachePublicAsset } from '../../scripts/precache-policy.js';

describe('shouldPrecachePublicAsset', () => {
  it('keeps the app shell in precache', () => {
    expect(shouldPrecachePublicAsset('manifest.json')).toBe(true);
    expect(shouldPrecachePublicAsset('icon-192.png')).toBe(true);
    expect(shouldPrecachePublicAsset('preview-fonts.css')).toBe(true);
  });

  it('loads renderer binaries and fonts on first builder use', () => {
    expect(shouldPrecachePublicAsset('vendor/canvaskit.wasm')).toBe(false);
    expect(shouldPrecachePublicAsset('vendor/canvaskit.js')).toBe(false);
    expect(shouldPrecachePublicAsset('fonts/noto-sans-sc-400.ttf')).toBe(false);
  });
});
