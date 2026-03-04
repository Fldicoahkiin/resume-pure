import type { PaperSize } from '@/types';

interface PaperDimensions {
  width: number;
  height: number;
}

const PAPER_DIMENSIONS: Record<PaperSize, PaperDimensions> = {
  A4: { width: 595, height: 842 },
  Letter: { width: 612, height: 792 },
  Legal: { width: 612, height: 1008 },
  A3: { width: 842, height: 1191 },
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

export const PAPER_SIZE_OPTIONS: PaperSize[] = ['A4', 'Letter', 'Legal', 'A3'];
