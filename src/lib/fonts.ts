// 字体配置系统
// 预览：通过 Google Fonts CSS @import 加载
// PDF：通过 react-pdf Font.register + gstatic.com CDN URL 加载
import { Font } from '@react-pdf/renderer';

// 字体分类
export type FontCategory = 'sans-serif' | 'serif' | 'handwriting';
export type FontLanguage = 'en' | 'zh';

// 单个字体配置
export interface FontConfig {
    family: string;       // CSS font-family 名称（PDF 和预览共用）
    displayName: string;  // UI 显示名称
    category: FontCategory;
    language: FontLanguage;
    // react-pdf Font.register 所需的字体文件 URL
    // 使用 Google Fonts gstatic.com CDN（稳定、全球可用）
    pdfFonts: {
        regular: string;
        bold: string;
    };
}

// 所有可用字体定义
// PDF 字体 URL 规则：
//   1. 统一使用 fonts.gstatic.com CDN 的 TTF 格式（fontkit 兼容性最佳）
//   2. 霞鹜文楷使用 jsdelivr GitHub CDN（Google Fonts 未收录）
//   3. 避免 woff2（fontkit 不支持）和不稳定的第三方 CDN
export const FONT_FAMILIES: FontConfig[] = [
    // === 无衬线英文字体 ===
    {
        family: 'Roboto',
        displayName: 'Roboto',
        category: 'sans-serif',
        language: 'en',
        pdfFonts: {
            regular: 'https://fonts.gstatic.com/s/roboto/v50/KFOMCnqEu92Fr1ME7kSn66aGLdTylUAMQXC89YmC2DPNWubEbVmUiA8.ttf',
            bold: 'https://fonts.gstatic.com/s/roboto/v50/KFOMCnqEu92Fr1ME7kSn66aGLdTylUAMQXC89YmC2DPNWuYjalmUiA8.ttf',
        },
    },
    {
        family: 'Inter',
        displayName: 'Inter',
        category: 'sans-serif',
        language: 'en',
        pdfFonts: {
            regular: 'https://fonts.gstatic.com/s/inter/v20/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuLyfAZ9hjQ.ttf',
            bold: 'https://fonts.gstatic.com/s/inter/v20/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuFuYAZ9hjQ.ttf',
        },
    },
    {
        family: 'Lato',
        displayName: 'Lato',
        category: 'sans-serif',
        language: 'en',
        pdfFonts: {
            regular: 'https://fonts.gstatic.com/s/lato/v25/S6uyw4BMUTPHjx4wWw.ttf',
            bold: 'https://fonts.gstatic.com/s/lato/v25/S6u9w4BMUTPHh6UVSwiPHA.ttf',
        },
    },
    {
        family: 'Montserrat',
        displayName: 'Montserrat',
        category: 'sans-serif',
        language: 'en',
        pdfFonts: {
            regular: 'https://fonts.gstatic.com/s/montserrat/v31/JTUHjIg1_i6t8kCHKm4532VJOt5-QNFgpCtr6Hw5aX8.ttf',
            bold: 'https://fonts.gstatic.com/s/montserrat/v31/JTUHjIg1_i6t8kCHKm4532VJOt5-QNFgpCuM73w5aX8.ttf',
        },
    },
    {
        family: 'Open Sans',
        displayName: 'Open Sans',
        category: 'sans-serif',
        language: 'en',
        pdfFonts: {
            regular: 'https://fonts.gstatic.com/s/opensans/v44/memSYaGs126MiZpBA-UvWbX2vVnXBbObj2OVZyOOSr4dVJWUgsjZ0B4gaVc.ttf',
            bold: 'https://fonts.gstatic.com/s/opensans/v44/memSYaGs126MiZpBA-UvWbX2vVnXBbObj2OVZyOOSr4dVJWUgsg-1x4gaVc.ttf',
        },
    },
    {
        family: 'Raleway',
        displayName: 'Raleway',
        category: 'sans-serif',
        language: 'en',
        pdfFonts: {
            regular: 'https://fonts.gstatic.com/s/raleway/v37/1Ptxg8zYS_SKggPN4iEgvnHyvveLxVvaorCIPrQ.ttf',
            bold: 'https://fonts.gstatic.com/s/raleway/v37/1Ptxg8zYS_SKggPN4iEgvnHyvveLxVs9pbCIPrQ.ttf',
        },
    },

    // === 衬线英文字体 ===
    {
        family: 'Merriweather',
        displayName: 'Merriweather',
        category: 'serif',
        language: 'en',
        pdfFonts: {
            regular: 'https://fonts.gstatic.com/s/merriweather/v33/u-4D0qyriQwlOrhSvowK_l5UcA6zuSYEqOzpPe3HOZJ5eX1WtLaQwmYiScCmDxhtNOKl8yDr3icaFF3w.ttf',
            bold: 'https://fonts.gstatic.com/s/merriweather/v33/u-4D0qyriQwlOrhSvowK_l5UcA6zuSYEqOzpPe3HOZJ5eX1WtLaQwmYiScCmDxhtNOKl8yDrOSAaFF3w.ttf',
        },
    },
    {
        family: 'Lora',
        displayName: 'Lora',
        category: 'serif',
        language: 'en',
        pdfFonts: {
            regular: 'https://fonts.gstatic.com/s/lora/v37/0QI6MX1D_JOuGQbT0gvTJPa787weuxJBkqg.ttf',
            bold: 'https://fonts.gstatic.com/s/lora/v37/0QI6MX1D_JOuGQbT0gvTJPa787z5vBJBkqg.ttf',
        },
    },
    {
        family: 'Playfair Display',
        displayName: 'Playfair Display',
        category: 'serif',
        language: 'en',
        pdfFonts: {
            regular: 'https://fonts.gstatic.com/s/playfairdisplay/v40/nuFvD-vYSZviVYUb_rj3ij__anPXJzDwcbmjWBN2PKdFvXDXbtY.ttf',
            bold: 'https://fonts.gstatic.com/s/playfairdisplay/v40/nuFvD-vYSZviVYUb_rj3ij__anPXJzDwcbmjWBN2PKeiunDXbtY.ttf',
        },
    },

    // === 中文字体 ===
    // 中文字体文件较大（~5-27MB），仅在导出 PDF 时按需加载
    {
        family: 'Noto Sans SC',
        displayName: '思源黑体',
        category: 'sans-serif',
        language: 'zh',
        pdfFonts: {
            regular: 'https://fonts.gstatic.com/s/notosanssc/v40/k3kCo84MPvpLmixcA63oeAL7Iqp5IZJF9bmaG9_Fra5HaA.ttf',
            bold: 'https://fonts.gstatic.com/s/notosanssc/v40/k3kCo84MPvpLmixcA63oeAL7Iqp5IZJF9bmaGzjCra5HaA.ttf',
        },
    },
    {
        family: 'Noto Serif SC',
        displayName: '思源宋体',
        category: 'serif',
        language: 'zh',
        pdfFonts: {
            regular: 'https://fonts.gstatic.com/s/notoserifsc/v35/H4cyBXePl9DZ0Xe7gG9cyOj7uK2-n-D2rd4FY7SCqxWN-Yo.ttf',
            bold: 'https://fonts.gstatic.com/s/notoserifsc/v35/H4cyBXePl9DZ0Xe7gG9cyOj7uK2-n-D2rd4FY7RlrBWN-Yo.ttf',
        },
    },
    {
        family: 'LXGW WenKai',
        displayName: '霞鹜文楷',
        category: 'handwriting',
        language: 'zh',
        // 霞鹜文楷 webfont 仅提供 woff2（fontkit 不支持），使用 GitHub 发布的 TTF
        pdfFonts: {
            regular: 'https://cdn.jsdelivr.net/gh/lxgw/LxgwWenKai@v1.501/fonts/TTF/LXGWWenKai-Regular.ttf',
            bold: 'https://cdn.jsdelivr.net/gh/lxgw/LxgwWenKai@v1.501/fonts/TTF/LXGWWenKai-Bold.ttf',
        },
    },
];

// 用于 ThemeEditor 下拉列表的字体选项
export function getFontOptions() {
    const enSansSerif = FONT_FAMILIES.filter(f => f.language === 'en' && f.category === 'sans-serif');
    const enSerif = FONT_FAMILIES.filter(f => f.language === 'en' && f.category === 'serif');
    const zhFonts = FONT_FAMILIES.filter(f => f.language === 'zh');

    return {
        enSansSerif,
        enSerif,
        zhFonts,
        all: FONT_FAMILIES,
    };
}

// 根据 font family 名称查找配置
export function getFontConfig(family: string): FontConfig | undefined {
    return FONT_FAMILIES.find(f => f.family === family);
}

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
    FONT_FAMILIES.forEach(font => {
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

// 生成 Google Fonts CSS @import URL（用于预览）
export function getGoogleFontsCSSUrl(): string {
    const families = FONT_FAMILIES
        .filter(f => f.language === 'en')
        .map(f => f.family.replace(/ /g, '+') + ':wght@400;700')
        .join('&family=');

    const zhFamilies = FONT_FAMILIES
        .filter(f => f.language === 'zh' && f.family !== 'LXGW WenKai')
        .map(f => f.family.replace(/ /g, '+') + ':wght@400;700')
        .join('&family=');

    let url = `https://fonts.googleapis.com/css2?family=${families}`;
    if (zhFamilies) {
        url += `&family=${zhFamilies}`;
    }
    url += '&display=swap';
    return url;
}
