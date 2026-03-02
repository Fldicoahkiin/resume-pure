import { Font } from '@react-pdf/renderer';
import { getFontConfig, getFontOptions } from '@/lib/fonts';

// 已注册的字体集合（避免重复注册）
const registeredFonts = new Set<string>();

// 为 react-pdf 注册单个字体
export function registerPDFFont(family: string): boolean {
  if (registeredFonts.has(family)) return true;

  const config = getFontConfig(family);
  if (!config) {
    console.warn(`[fonts] 未知字体: ${family}，使用 Helvetica 回退`);
    return false;
  }

  try {
    Font.register({
      family: config.family,
      fonts: [
        { src: config.pdfFonts.regular, fontWeight: 400 },
        { src: config.pdfFonts.bold, fontWeight: 700 },
      ],
    });
    registeredFonts.add(family);
    console.log(`[fonts] 已注册 PDF 字体: ${config.displayName} (${config.family})`);
    return true;
  } catch (error) {
    console.error(`[fonts] 注册字体失败: ${config.family}`, error);
    return false;
  }
}

// 注册所有字体（用于初始化）
export function registerAllPDFFonts(): void {
  getFontOptions().all.forEach((font) => {
    registerPDFFont(font.family);
  });
}

// 注册中文断词回调（解决 react-pdf 中文换行问题）
export function registerCJKHyphenation(): void {
  Font.registerHyphenationCallback((word) => {
    // 检测是否包含中文字符
    const hasCJK = /[\u4e00-\u9fff\u3400-\u4dbf\uf900-\ufaff]/.test(word);
    if (hasCJK) {
      // 中文字符逐字断开，允许在任意位置换行
      return word.split('').map((char) => [char, '']).flat();
    }
    // 英文禁用连字符断词
    return [word];
  });
}

// 获取 PDF 使用的字体族名称
// 如果字体已注册，返回原始名称；否则智能回退
export function getPDFFontFamily(fontFamily: string): string {
  const config = getFontConfig(fontFamily);
  if (!config) {
    // 未知字体：尝试注册 Noto Sans SC 作为中文回退
    if (registerPDFFont('Noto Sans SC')) return 'Noto Sans SC';
    return 'Helvetica';
  }

  // 尝试注册目标字体
  if (registerPDFFont(fontFamily)) {
    return config.family;
  }

  // 注册失败：中文字体回退到 Noto Sans SC，英文回退到 Helvetica
  if (config.language === 'zh') {
    if (fontFamily !== 'Noto Sans SC' && registerPDFFont('Noto Sans SC')) {
      return 'Noto Sans SC';
    }
  }
  return 'Helvetica';
}
