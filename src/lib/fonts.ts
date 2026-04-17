// 字体配置系统
// 预览：通过全局 @font-face 规则加载
// PDF：由 pdfFonts.ts 在导出阶段按需注册

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
const FONT_FAMILIES: FontConfig[] = [
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
