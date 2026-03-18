import type { PaperSize } from '@/types';

const PAPER_CSS_SIZE: Record<string, string> = {
  A4: '210mm 297mm',
  Letter: '8.5in 11in',
  Legal: '8.5in 14in',
  A3: '297mm 420mm',
};

/**
 * 使用浏览器原生打印导出 PDF。
 * 依赖 @media print CSS 规则隐藏编辑器等非预览 UI，
 * 动态注入 @page 规则设置纸张尺寸和零边距。
 * 优势：与预览 100% 一致，保留超链接、图标、图片。
 */
export async function exportToPDF(
  elementId: string,
  filename: string = 'resume.pdf',
  paperSize: PaperSize = 'A4'
): Promise<void> {
  // 保持调用签名兼容，原生打印不需要 elementId 和 filename
  void elementId;
  void filename;

  const cssSize = PAPER_CSS_SIZE[paperSize] || PAPER_CSS_SIZE.A4;

  // 动态注入 @page 规则
  const styleId = 'print-page-size';
  let style = document.getElementById(styleId) as HTMLStyleElement | null;
  if (!style) {
    style = document.createElement('style');
    style.id = styleId;
    document.head.appendChild(style);
  }
  style.textContent = `@page { size: ${cssSize}; margin: 0; }`;

  // 触发打印
  window.print();
}
