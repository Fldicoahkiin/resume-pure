import { getPaperDimensions } from '@/lib/paper';

export const RENDER_SCALE = 2;
export const EXPORT_BACKGROUND = '#ffffff';
/** 预览中页与页之间的空隙（文档 CSS 像素），空隙区域透明 */
export const PAGE_GAP = 16;
export const PAGE_BORDER_COLOR = '#e5e7eb';
export const PREVIEW_OBJECT_FIT = 'contain';
export const SECTION_BAR_WIDTH = 32;
export const SECTION_BAR_HEIGHT = 4;
export const FULL_OPACITY = 1;
export const TRANSPARENT_OPACITY = 0;

export function getResumePaperWidth(themePaperSize: Parameters<typeof getPaperDimensions>[0]) {
  return getPaperDimensions(themePaperSize).width;
}
