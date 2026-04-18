import { getFontManifest } from '@/lib/fonts';

const fontBufferCache = new Map<string, Promise<ArrayBuffer>>();

function isAbsoluteUrl(value: string) {
  return /^https?:\/\//i.test(value);
}

async function loadArrayBuffer(src: string): Promise<ArrayBuffer> {
  const response = await fetch(src, { cache: 'force-cache' });
  if (!response.ok) {
    throw new Error(`font-fetch-failed:${src}`);
  }
  return await response.arrayBuffer();
}

function getFontSourcePath(src: string) {
  if (isAbsoluteUrl(src)) {
    return src;
  }

  if (src.startsWith('/')) {
    return src;
  }

  return `/${src}`;
}

export async function loadFontFaceBuffer(src: string) {
  const resolvedSrc = getFontSourcePath(src);
  const cached = fontBufferCache.get(resolvedSrc);
  if (cached) {
    return await cached;
  }

  const pending = loadArrayBuffer(resolvedSrc);
  fontBufferCache.set(resolvedSrc, pending);
  return await pending;
}

function getPreferredFontFamilies(selectedFamily: string) {
  const manifest = getFontManifest();
  const selected = manifest.find((font) => font.family === selectedFamily);
  const preferred = new Set<string>(['Noto Sans SC']);

  if (selected) {
    preferred.add(selected.family);
    if (selected.language === 'en') {
      preferred.add('Noto Sans SC');
    }
  }

  return Array.from(preferred);
}

export async function loadRendererFonts(selectedFamily: string) {
  const manifest = getFontManifest();
  const families = new Set(getPreferredFontFamilies(selectedFamily));
  const faces = manifest.filter((font) => families.has(font.family)).flatMap((font) => font.faces);

  const buffers = await Promise.all(faces.map((face) => loadFontFaceBuffer(face.src)));
  return { buffers, families: Array.from(families) };
}
