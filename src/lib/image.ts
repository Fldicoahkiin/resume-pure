import {
  createResumeExportUrl,
  openResumeExportWindow,
  removeResumeExportPayload,
  saveResumeExportPayload,
} from '@/lib/exportPayload';
import type { PDFTranslations, ResumeData } from '@/types';

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
const PNG_EXPORT_PIXEL_RATIO = 2;


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

async function replaceImagesWithDataUrls(element: HTMLElement): Promise<() => void> {
  const images = element.querySelectorAll('img');
  const savedSrcs: { img: HTMLImageElement; src: string }[] = [];
  await Promise.all(
    Array.from(images).map(async (img) => {
      const src = img.src;
      if (!src || src.startsWith('data:') || src.startsWith('blob:')) return;
      savedSrcs.push({ img, src });
      img.src = await toDataUrl(src);
    }),
  );
  return () => {
    for (const { img, src } of savedSrcs) {
      img.src = src;
    }
  };
}

function createExportClone(
  element: HTMLElement,
  width: number,
  height: number
): {
  clone: HTMLElement;
  cleanup: () => void;
} {
  const clone = element.cloneNode(true) as HTMLElement;
  const host = document.createElement('div');
  const sourceStyle = window.getComputedStyle(element);

  host.style.position = 'fixed';
  host.style.left = '-99999px';
  host.style.top = '0';
  host.style.pointerEvents = 'none';
  host.style.opacity = '0';
  host.style.zIndex = '-1';
  host.style.width = `${width}px`;
  host.style.height = `${height}px`;
  host.style.overflow = 'hidden';
  host.style.backgroundColor = sourceStyle.backgroundColor || '#ffffff';

  clone.style.boxSizing = 'border-box';
  clone.style.width = `${width}px`;
  clone.style.minWidth = `${width}px`;
  clone.style.maxWidth = `${width}px`;
  clone.style.height = `${height}px`;
  clone.style.minHeight = `${height}px`;
  clone.style.margin = '0';
  clone.style.transform = 'none';
  clone.style.backgroundColor = sourceStyle.backgroundColor || '#ffffff';

  host.appendChild(clone);
  document.body.appendChild(host);

  return {
    clone,
    cleanup: () => {
      host.remove();
    },
  };
}

export async function downloadElementToPNG(elementId: string, filename: string = 'resume.png'): Promise<void> {
  const { getFontEmbedCSS, toBlob } = await import('html-to-image');

  const element = document.getElementById(elementId);
  if (!element) {
    throw new Error('未找到要导出的元素');
  }

  await document.fonts.ready;

  try {
    const width = Math.ceil(element.offsetWidth);
    const height = Math.ceil(element.offsetHeight);
    const { clone, cleanup } = createExportClone(element, width, height);
    let blob: Blob | null = null;

    try {
      const restoreImages = await replaceImagesWithDataUrls(clone);

      try {
        const fontEmbedCSS = await getFontEmbedCSS(clone, {
          preferredFontFormat: 'woff2',
        });

        blob = await toBlob(clone, {
          width,
          height,
          pixelRatio: PNG_EXPORT_PIXEL_RATIO,
          backgroundColor: '#ffffff',
          fontEmbedCSS,
          cacheBust: false,
          imagePlaceholder: TRANSPARENT_PX,
          filter: (node: Node) => {
            if (node instanceof HTMLElement && node.classList.contains('hide-in-export')) {
              return false;
            }
            return true;
          },
        });
      } finally {
        restoreImages();
      }
    } finally {
      cleanup();
    }

    if (!blob) throw new Error('导出引擎未生成有效数据');

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
  } catch (error) {
    console.error('PNG 导出失败:', error);
    throw new Error('PNG 导出失败');
  }
}

export async function exportToPNG(
  data: ResumeData,
  filename: string = 'resume.png',
  translations: PDFTranslations
): Promise<void> {
  let exportId: string | null = null;

  try {
    exportId = saveResumeExportPayload({
      resume: data,
      translations,
      format: 'png',
      filename,
    });
    const exportUrl = createResumeExportUrl(exportId);
    openResumeExportWindow(exportUrl);
  } catch (error) {
    if (exportId) {
      removeResumeExportPayload(exportId);
    }
    console.error('PNG 导出失败:', error);
    throw new Error('PNG 导出失败');
  }
}
