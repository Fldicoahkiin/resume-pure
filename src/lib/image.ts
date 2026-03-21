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

/** 通过 img+canvas 将外部图片转为 data URL，支持跟随 302 重定向 */
function loadImageAsDataUrl(src: string): Promise<string | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
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
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

/** 将 github.com/xxx.png 转为支持 CORS 的 avatars.githubusercontent.com 地址 */
function normalizeCorsUrl(src: string): string {
  const ghMatch = src.match(/^https?:\/\/github\.com\/([^/]+)\.png/);
  if (ghMatch) {
    return `https://avatars.githubusercontent.com/${ghMatch[1]}`;
  }
  return src;
}

/** 外部图片 → data URL，失败时返回透明像素占位 */
export async function toDataUrl(src: string): Promise<string> {
  const corsUrl = normalizeCorsUrl(src);

  // img+canvas：crossOrigin=anonymous 请求支持 CORS 的服务器
  const viaImg = await loadImageAsDataUrl(corsUrl);
  if (viaImg) return viaImg;

  // fallback：直接 fetch（同源或已有 CORS 头的场景）
  try {
    const resp = await fetch(src);
    if (!resp.ok) return TRANSPARENT_PX;
    const blob = await resp.blob();
    return await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string || TRANSPARENT_PX);
      reader.onerror = () => resolve(TRANSPARENT_PX);
      reader.readAsDataURL(blob);
    });
  } catch {
    return TRANSPARENT_PX;
  }
}

export async function exportToPNG(elementId: string, filename: string = 'resume.png'): Promise<void> {
  const { toBlob } = await import('html-to-image');

  const element = document.getElementById(elementId);
  if (!element) {
    throw new Error('未找到要导出的元素');
  }

  await document.fonts.ready;

  // 移动端预览区可能被隐藏，临时展示以获取正确布局
  const previewArea = document.getElementById('builder-preview-area');
  const wasHidden = previewArea && window.getComputedStyle(previewArea).display === 'none';
  if (wasHidden && previewArea) {
    previewArea.style.display = 'flex';
    previewArea.style.position = 'fixed';
    previewArea.style.left = '-99999px';
    previewArea.style.top = '0';
  }

  // 临时移除缩放 transform 以获取正确尺寸
  const scaleWrapper = document.getElementById('resume-preview-scale-wrapper');
  const savedTransform = scaleWrapper?.style.transform ?? '';
  if (scaleWrapper) scaleWrapper.style.transform = 'none';

  const width = element.offsetWidth;
  const height = element.offsetHeight;

  // 在原始 DOM 上做图片预处理：保存原始 src，替换为 data URL，导出后恢复
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

  try {
    const blob = await toBlob(element, {
      width,
      height,
      pixelRatio: 2,
      backgroundColor: '#ffffff',
      skipFonts: false,
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
    // 恢复原始图片 src
    for (const { img, src } of savedSrcs) {
      img.src = src;
    }
    if (scaleWrapper) scaleWrapper.style.transform = savedTransform;
    if (wasHidden && previewArea) {
      previewArea.style.display = '';
      previewArea.style.position = '';
      previewArea.style.left = '';
      previewArea.style.top = '';
    }
  }
}

export async function exportToPDF(
  elementId: string,
  filename: string = 'resume.pdf',
  paperSize: import('@/types').PaperSize = 'A4'
): Promise<void> {
  const { toCanvas } = await import('html-to-image');
  const { default: jsPDF } = await import('jspdf');
  const { getPaperDimensions } = await import('@/lib/paper');

  const element = document.getElementById(elementId);
  if (!element) {
    throw new Error('未找到要导出的元素');
  }

  await document.fonts.ready;

  const previewArea = document.getElementById('builder-preview-area');
  const wasHidden = previewArea && window.getComputedStyle(previewArea).display === 'none';
  if (wasHidden && previewArea) {
    previewArea.style.display = 'flex';
    previewArea.style.position = 'fixed';
    previewArea.style.left = '-99999px';
    previewArea.style.top = '0';
  }

  const scaleWrapper = document.getElementById('resume-preview-scale-wrapper');
  const savedTransform = scaleWrapper?.style.transform ?? '';
  if (scaleWrapper) scaleWrapper.style.transform = 'none';

  const paper = getPaperDimensions(paperSize);
  const width = paper.width;
  const height = paper.height;

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

  try {
    const canvas = await toCanvas(element, {
      width,
      height,
      pixelRatio: 2,
      backgroundColor: '#ffffff',
      skipFonts: false,
      cacheBust: false,
      imagePlaceholder: TRANSPARENT_PX,
      filter: (node: Node) => {
        if (node instanceof HTMLElement && node.classList.contains('hide-in-export')) {
          return false;
        }
        return true;
      },
    });

    const pdf = new jsPDF({
      orientation: paper.mmWidth > paper.mmHeight ? 'landscape' : 'portrait',
      unit: 'mm',
      format: [paper.mmWidth, paper.mmHeight],
    });

    pdf.addImage(
      canvas.toDataURL('image/png'),
      'PNG',
      0, 0,
      paper.mmWidth,
      paper.mmHeight,
      undefined,
      'FAST',
    );

    pdf.save(filename);
  } catch (error) {
    console.error('PDF 导出失败:', error);
    throw new Error('PDF 导出失败');
  } finally {
    for (const { img, src } of savedSrcs) {
      img.src = src;
    }
    if (scaleWrapper) scaleWrapper.style.transform = savedTransform;
    if (wasHidden && previewArea) {
      previewArea.style.display = '';
      previewArea.style.position = '';
      previewArea.style.left = '';
      previewArea.style.top = '';
    }
  }
}
