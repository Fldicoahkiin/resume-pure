import type { PaperSize } from '@/types';
import { getPaperDimensions } from '@/lib/paper';

/**
 * 使用浏览器原生打印导出 PDF。
 * 依赖 globals.css 中的 @media print 规则隐藏非预览 UI，
 * 动态注入 @page 规则匹配用户选择的纸张尺寸。
 */
export async function exportToPDF(
  elementId: string,
  filename: string = 'resume.pdf',
  paperSize: PaperSize = 'A4'
): Promise<void> {
  void elementId;
  void filename;

  const paper = getPaperDimensions(paperSize);

  // 动态注入 @page 规则，匹配用户选择的纸张
  const styleId = 'print-page-size';
  let style = document.getElementById(styleId) as HTMLStyleElement | null;
  if (!style) {
    style = document.createElement('style');
    style.id = styleId;
    document.head.appendChild(style);
  }
  style.textContent = `@page { size: ${paper.mmWidth}mm ${paper.mmHeight}mm; margin: 0; }`;

  window.print();
}
