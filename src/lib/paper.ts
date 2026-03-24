import type { PaperSize } from '@/types';

interface PaperDimensions {
  /** CSS 像素宽度 (96 DPI) */
  width: number;
  /** CSS 像素高度 (96 DPI) */
  height: number;
  /** 物理宽度 (mm) */
  mmWidth: number;
  /** 物理高度 (mm) */
  mmHeight: number;
}

/**
 * 纸张尺寸定义（CSS 96 DPI）。
 * CSS 规范定义 1in = 96px，因此 1mm = 96/25.4 ≈ 3.7795px。
 * 这确保预览渲染的宽度与浏览器打印输出完全一致。
 */
const MM_TO_PX = 96 / 25.4;

const PAPER_DIMENSIONS: Record<PaperSize, PaperDimensions> = {
  A4: {
    width: Math.round(210 * MM_TO_PX),    // 794
    height: Math.round(297 * MM_TO_PX),   // 1123
    mmWidth: 210,
    mmHeight: 297,
  },
  Letter: {
    width: Math.round(215.9 * MM_TO_PX),  // 816
    height: Math.round(279.4 * MM_TO_PX), // 1056
    mmWidth: 215.9,
    mmHeight: 279.4,
  },
  Legal: {
    width: Math.round(215.9 * MM_TO_PX),  // 816
    height: Math.round(355.6 * MM_TO_PX), // 1344
    mmWidth: 215.9,
    mmHeight: 355.6,
  },
  A3: {
    width: Math.round(297 * MM_TO_PX),    // 1123
    height: Math.round(420 * MM_TO_PX),   // 1587
    mmWidth: 297,
    mmHeight: 420,
  },
};

const PAPER_SIZE_SET = new Set<PaperSize>(Object.keys(PAPER_DIMENSIONS) as PaperSize[]);

export function normalizePaperSize(value: unknown, fallback: PaperSize = 'A4'): PaperSize {
  if (typeof value === 'string' && PAPER_SIZE_SET.has(value as PaperSize)) {
    return value as PaperSize;
  }

  return fallback;
}

export function getPaperDimensions(size: PaperSize): PaperDimensions {
  return PAPER_DIMENSIONS[size] || PAPER_DIMENSIONS.A4;
}
/** 返回 72 DPI 的 PDF 坐标（供 @react-pdf/renderer 使用） */
export function getPaperPointSize(size: PaperSize): [number, number] {
  const paper = PAPER_DIMENSIONS[size] || PAPER_DIMENSIONS.A4;
  const MM_TO_PT = 72 / 25.4;
  return [Math.round(paper.mmWidth * MM_TO_PT), Math.round(paper.mmHeight * MM_TO_PT)];
}


export const PAPER_SIZE_OPTIONS: PaperSize[] = ['A4', 'Letter', 'Legal', 'A3'];
