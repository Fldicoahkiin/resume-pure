import {
  getRenderArtifactKey,
  readCachedRenderArtifact,
} from '@/lib/render/cache';
import { buildRenderArtifact, disposeRenderArtifact } from '@/lib/render/surface';
import type { RenderBuildOptions } from '@/lib/render/types';
import type { ResumeData } from '@/types';

const MAX_EMBEDDED_LOGO_BYTES = 512 * 1024;

function compressImageToDataUrl(file: File, maxBytes: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      const canvas = document.createElement('canvas');
      let { width, height } = img;
      const maxDim = 256;
      if (width > maxDim || height > maxDim) {
        const scale = maxDim / Math.max(width, height);
        width = Math.round(width * scale);
        height = Math.round(height * scale);
      }
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('image-compress-failed'));
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);

      let quality = 0.8;
      let result = canvas.toDataURL('image/jpeg', quality);
      while (result.length > maxBytes * 1.37 && quality > 0.1) {
        quality -= 0.1;
        result = canvas.toDataURL('image/jpeg', quality);
      }
      resolve(result);
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('image-read-failed'));
    };

    img.src = objectUrl;
  });
}

export async function readImageFileAsDataUrl(file: File, maxBytes: number = MAX_EMBEDDED_LOGO_BYTES): Promise<string> {
  if (!file.type.startsWith('image/')) {
    throw new Error('invalid-image-type');
  }

  if (file.size <= maxBytes) {
    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          resolve(reader.result);
          return;
        }
        reject(new Error('image-read-failed'));
      };
      reader.onerror = () => reject(new Error('image-read-failed'));
      reader.readAsDataURL(file);
    });
  }

  return compressImageToDataUrl(file, maxBytes);
}

export const TRANSPARENT_PX =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVQI12NgAAIABQABNjN9GQAAAABJRU5ErkJggg==';


/** 通过 img+canvas 将外部图片转为 data URL，支持跟随 302 重定向 */
function loadImageAsDataUrl(src: string): Promise<string | null> {
  return new Promise((resolve) => {
    const timeout = setTimeout(() => {
      img.src = '';
      resolve(null);
    }, 5000);
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      clearTimeout(timeout);
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) { resolve(null); return; }
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      } catch {
        resolve(null);
      }
    };
    img.onerror = () => {
      clearTimeout(timeout);
      resolve(null);
    };
    img.src = src + (src.includes('?') ? '&' : '?') + 'cors-bypass=' + Date.now();
  });
}

/** 将 github.com/xxx.png 转为支持 CORS 的 avatars.githubusercontent.com 地址 */
function normalizeCorsUrl(src: string): string {
  // github.com/username.png -> avatars.githubusercontent.com/username
  const ghPngMatch = src.match(/^https?:\/\/github\.com\/([^/]+)\.png/);
  if (ghPngMatch) {
    return `https://avatars.githubusercontent.com/${ghPngMatch[1]}`;
  }
  // github.com/username -> avatars.githubusercontent.com/username
  const ghUserMatch = src.match(/^https?:\/\/github\.com\/([^/]+)\/?$/);
  if (ghUserMatch) {
    return `https://avatars.githubusercontent.com/${ghUserMatch[1]}`;
  }
  // raw.githubusercontent.com 无需转换，直接支持 CORS
  return src;
}

async function fetchAsDataUrl(src: string): Promise<string | null> {
  try {
    const resp = await fetch(src, { cache: 'no-cache' });
    if (!resp.ok) return null;
    const blob = await resp.blob();
    return await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string || TRANSPARENT_PX);
      reader.onerror = () => resolve(TRANSPARENT_PX);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

/** 外部图片 → data URL，失败时返回透明像素占位 */
export async function toDataUrl(src: string): Promise<string> {
  const corsUrl = normalizeCorsUrl(src);

  // img+canvas：crossOrigin=anonymous 请求支持 CORS 的服务器
  const viaImg = await loadImageAsDataUrl(corsUrl);
  if (viaImg) return viaImg;

  // Safari / Firefox 偶发会在首轮图片解码失败，这里追加一次重试。
  const viaImgRetry = await loadImageAsDataUrl(corsUrl);
  if (viaImgRetry) return viaImgRetry;

  // fallback：直接 fetch（同源或已有 CORS 头的场景）
  const viaFetch = await fetchAsDataUrl(corsUrl);
  if (viaFetch) return viaFetch;

  // fallback：用原始 URL 做 fetch（跳过已知不支持 CORS 的域名）
  const skipOriginalFetch = corsUrl !== src && /github\.com/.test(src);
  const viaOriginalFetch = !skipOriginalFetch && corsUrl !== src ? await fetchAsDataUrl(src) : null;
  return viaOriginalFetch || TRANSPARENT_PX;
}

export interface ResumePreviewCapture {
  blob: Blob;
  width: number;
  height: number;
  pixelWidth: number;
  pixelHeight: number;
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.rel = 'noopener';
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 30000);
}

export async function captureResumePreview(
  data: ResumeData,
  options: RenderBuildOptions,
): Promise<ResumePreviewCapture> {
  const cacheKey = getRenderArtifactKey(data, options);
  const cachedArtifact = readCachedRenderArtifact(cacheKey);
  const artifact = cachedArtifact || await buildRenderArtifact(data, options);

  try {
    return {
      blob: artifact.blob,
      width: artifact.width,
      height: artifact.height,
      pixelWidth: artifact.pixelWidth,
      pixelHeight: artifact.pixelHeight,
    };
  } finally {
    if (!cachedArtifact) {
      disposeRenderArtifact(artifact);
    }
  }
}

export async function exportToPNG(
  data: ResumeData,
  options: RenderBuildOptions,
  filename: string = 'resume.png',
): Promise<void> {
  const cacheKey = getRenderArtifactKey(data, options);
  const cachedArtifact = readCachedRenderArtifact(cacheKey);
  const artifact = cachedArtifact || await buildRenderArtifact(data, options);

  try {
    downloadBlob(artifact.blob, filename);
  } catch (error) {
    console.error('PNG 导出失败:', error);
    throw new Error('PNG 导出失败');
  } finally {
    if (!cachedArtifact) {
      disposeRenderArtifact(artifact);
    }
  }
}
