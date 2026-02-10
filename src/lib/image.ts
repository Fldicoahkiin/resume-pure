import { ResumeData } from '@/types';

/**
 * 导出为 PNG 图片
 */
export async function exportToPNG(elementId: string, filename: string = 'resume.png'): Promise<void> {
  // 动态导入 html-to-image
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
      skipFonts: true, // 跳过字体嵌入，避免 font is undefined 错误
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
