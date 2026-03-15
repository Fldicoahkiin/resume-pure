export const MAX_EMBEDDED_LOGO_BYTES = 512 * 1024;

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


export async function exportToPNG(elementId: string, filename: string = 'resume.png'): Promise<void> {
  const htmlToImage = await import('html-to-image');

  const element = document.getElementById(elementId);
  if (!element) {
    throw new Error('未找到要导出的元素');
  }

  try {
    const dataUrl = await htmlToImage.toPng(element, {
      quality: 1,
      pixelRatio: 2,
      backgroundColor: '#ffffff',
      skipFonts: true,
    });

    const link = document.createElement('a');
    link.download = filename;
    link.href = dataUrl;
    link.click();
  } catch (error) {
    console.error('PNG 导出失败:', error);
    throw new Error('PNG 导出失败');
  }
}
