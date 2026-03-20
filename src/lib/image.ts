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


const TRANSPARENT_PX =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVQI12NgAAIABQABNjN9GQAAAABJRU5ErkJggg==';

/** 外部图片 → data URL，直连失败时回退到 /api/image-proxy 同源代理 */
async function toDataUrl(src: string): Promise<string> {
  async function fetchAsDataUrl(url: string): Promise<string | null> {
    try {
      const resp = await fetch(url);
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


  const direct = await fetchAsDataUrl(src);
  if (direct) return direct;


  const proxied = await fetchAsDataUrl(`/api/image-proxy?url=${encodeURIComponent(src)}`);
  return proxied || TRANSPARENT_PX;
}

export async function exportToPNG(elementId: string, filename: string = 'resume.png'): Promise<void> {
  const { toBlob } = await import('html-to-image');

  const element = document.getElementById(elementId);
  if (!element) {
    throw new Error('未找到要导出的元素');
  }

  await document.fonts.ready;


  const scaleWrapper = document.getElementById('resume-preview-scale-wrapper');
  const savedTransform = scaleWrapper?.style.transform ?? '';
  if (scaleWrapper) scaleWrapper.style.transform = 'none';

  // 外部图片预转 data URL，避免 html-to-image 的 CORS 错误
  const images = element.querySelectorAll('img');
  const savedSrcs = new Map<HTMLImageElement, string>();

  await Promise.all(
    Array.from(images).map(async (img) => {
      const src = img.src;
      if (!src || src.startsWith('data:') || src.startsWith('blob:')) return;
      savedSrcs.set(img, src);
      img.src = await toDataUrl(src);
    }),
  );

  try {
    const blob = await toBlob(element, {
      pixelRatio: 2,
      backgroundColor: '#ffffff',
      skipFonts: true,
      cacheBust: false,
      imagePlaceholder: TRANSPARENT_PX,
      filter: (node: Node) => {
        if (node instanceof HTMLElement && node.classList.contains('hide-in-export')) {
          return false;
        }
        return true;
      },
    });

    if (!blob) throw new Error('导出引擎未生成有效数据');

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = filename;
    link.href = url;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  } catch (error) {
    console.error('PNG 导出失败:', error);
    throw new Error('PNG 导出失败');
  } finally {
    if (scaleWrapper) scaleWrapper.style.transform = savedTransform;
    savedSrcs.forEach((src, img) => {
      img.src = src;
    });
  }
}
