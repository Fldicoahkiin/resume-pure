import { getFontManifest } from '@/lib/fonts';
import { stripLayoutTables } from '@/lib/render/fontSubset';

const fontBufferCache = new Map<string, Promise<ArrayBuffer>>();
const FONT_FETCH_TIMEOUT_MS = 5000;

/** 渲染必备字体：中文回退 + emoji 回退，始终随选中字体一起加载。 */
export const RENDER_FALLBACK_FAMILY = 'Noto Sans SC';
export const RENDER_EMOJI_FAMILY = 'Noto Emoji';

export interface RendererFontFace {
  family: string;
  weight: number;
  style: 'normal' | 'italic';
  buffer: ArrayBuffer;
}

function isAbsoluteUrl(value: string) {
  return /^https?:\/\//i.test(value);
}

async function fetchWithTimeout(input: RequestInfo | URL, init?: RequestInit, timeoutMs: number = FONT_FETCH_TIMEOUT_MS) {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } finally {
    window.clearTimeout(timeout);
  }
}

async function loadArrayBuffer(src: string): Promise<ArrayBuffer> {
  const response = await fetchWithTimeout(src, { cache: 'force-cache' });
  if (!response.ok) {
    throw new Error(`font-fetch-failed:${src}`);
  }
  // 剥离 kerning 等 layout 表，保证 CanvasKit 排版与 PDF 子集绘制度量一致
  return stripLayoutTables(await response.arrayBuffer());
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

  const pending = loadArrayBuffer(resolvedSrc).catch((error) => {
    fontBufferCache.delete(resolvedSrc);
    throw error;
  });
  fontBufferCache.set(resolvedSrc, pending);
  return await pending;
}

async function loadFamilyFaces(family: string): Promise<RendererFontFace[]> {
  const manifest = getFontManifest();
  const config = manifest.find((font) => font.family === family);
  if (!config) {
    throw new Error(`font-family-unknown:${family}`);
  }

  return await Promise.all(
    config.faces.map(async (face) => ({
      family,
      weight: face.weight,
      style: face.style,
      buffer: await loadFontFaceBuffer(face.src),
    })),
  );
}

/**
 * 加载渲染所需的全部字体 face。
 * 选中字体加载失败时降级到 Noto Sans SC（保持预览可用），emoji 回退加载失败时跳过；
 * 两种失败都会 console.error，Noto Sans SC 本体失败则抛出。
 */
export async function loadRendererFonts(selectedFamily: string): Promise<{ faces: RendererFontFace[] }> {
  const families: string[] = [RENDER_FALLBACK_FAMILY];
  if (selectedFamily !== RENDER_FALLBACK_FAMILY && selectedFamily !== RENDER_EMOJI_FAMILY) {
    families.unshift(selectedFamily);
  }

  const faces: RendererFontFace[] = [];

  for (const family of families) {
    if (family === RENDER_FALLBACK_FAMILY) {
      faces.push(...(await loadFamilyFaces(family)));
      continue;
    }

    try {
      faces.push(...(await loadFamilyFaces(family)));
    } catch (error) {
      console.error(`渲染字体 ${family} 加载失败，降级到 ${RENDER_FALLBACK_FAMILY}:`, error);
    }
  }

  try {
    faces.push(...(await loadFamilyFaces(RENDER_EMOJI_FAMILY)));
  } catch (error) {
    console.error('emoji 回退字体加载失败，emoji 将显示为缺字占位:', error);
  }

  return { faces };
}
