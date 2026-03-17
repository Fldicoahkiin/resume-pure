import { jsPDF } from 'jspdf';
import type { PaperSize } from '@/types';
import { getPaperDimensions } from '@/lib/paper';

const PAPER_MM: Record<string, { w: number; h: number }> = {
  A4: { w: 210, h: 297 },
  Letter: { w: 215.9, h: 279.4 },
  Legal: { w: 215.9, h: 355.6 },
  A3: { w: 297, h: 420 },
};

/**
 * 将预览 DOM 克隆到离屏容器中，以纸张原始尺寸渲染后截图，
 * 保证 PDF 输出与预览 100% 一致。
 */
export async function exportToPDF(
  elementId: string,
  filename: string = 'resume.pdf',
  paperSize: PaperSize = 'A4'
): Promise<void> {
  const element = document.getElementById(elementId);
  if (!element) {
    throw new Error('未找到预览元素');
  }

  const paper = getPaperDimensions(paperSize);

  // 克隆预览元素到离屏容器，以纸张标准宽度渲染
  const offscreen = document.createElement('div');
  offscreen.style.cssText = `
    position: fixed;
    left: -9999px;
    top: 0;
    width: ${paper.width}px;
    z-index: -1;
    background: white;
    overflow: visible;
  `;

  const clone = element.cloneNode(true) as HTMLElement;
  clone.removeAttribute('id');
  // 清除可能的缩放/变换，确保以原始尺寸渲染
  clone.style.transform = 'none';
  clone.style.width = `${paper.width}px`;
  clone.style.minHeight = 'auto';
  clone.style.margin = '0';
  clone.style.boxShadow = 'none';

  offscreen.appendChild(clone);
  document.body.appendChild(offscreen);

  // 等待离屏渲染完成（图片加载等）
  await new Promise(resolve => setTimeout(resolve, 200));

  const htmlToImage = await import('html-to-image');

  try {
    const dataUrl = await htmlToImage.toPng(clone, {
      quality: 1,
      pixelRatio: 3,
      backgroundColor: '#ffffff',
      skipFonts: true,
      width: paper.width,
      canvasWidth: paper.width * 3,
    });

    // 加载图片以获取实际尺寸
    const img = new Image();
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error('图片加载失败'));
      img.src = dataUrl;
    });

    const mm = PAPER_MM[paperSize] || PAPER_MM.A4;

    // 按纸张宽度铺满，等比缩放高度
    const imgAspect = img.height / img.width;
    const pdfWidth = mm.w;
    const pdfImgHeight = pdfWidth * imgAspect;

    const pageHeight = mm.h;
    const totalPages = Math.ceil(pdfImgHeight / pageHeight);

    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: [mm.w, mm.h],
    });

    for (let page = 0; page < totalPages; page++) {
      if (page > 0) {
        doc.addPage([mm.w, mm.h], 'portrait');
      }
      doc.addImage(dataUrl, 'PNG', 0, -(page * pageHeight), pdfWidth, pdfImgHeight, undefined, 'FAST');
    }

    const blob = doc.output('blob');
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  } finally {
    document.body.removeChild(offscreen);
  }
}
