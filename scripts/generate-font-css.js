const fs = require('fs');
const path = require('path');

const manifestPath = path.resolve(__dirname, '../src/lib/fontManifest.json');
const outputPath = path.resolve(__dirname, '../src/app/preview-fonts.css');

function formatFaceRule(font, face) {
  return `@font-face {
  font-family: '${font.family}';
  font-style: ${face.style};
  font-weight: ${face.weight};
  font-display: swap;
  src: url('${face.src}') format('${face.format}');
}`;
}

function validateFontManifest(fontManifest) {
  const familySet = new Set();

  for (const font of fontManifest) {
    if (familySet.has(font.family)) {
      throw new Error(`重复字体 family: ${font.family}`);
    }

    if (!Array.isArray(font.faces) || font.faces.length === 0) {
      throw new Error(`字体 ${font.family} 缺少 faces`);
    }

    familySet.add(font.family);
  }
}

function generateFontCss(fontManifest) {
  const sections = fontManifest.flatMap((font) => font.faces.map((face) => formatFaceRule(font, face)));
  return `/* 该文件由 scripts/generate-font-css.js 自动生成，请勿手动修改。 */\n\n${sections.join('\n\n')}\n`;
}

function main() {
  const fontManifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  validateFontManifest(fontManifest);

  const output = generateFontCss(fontManifest);
  fs.writeFileSync(outputPath, output);

  console.log(`✅ [fonts:update] 成功生成 ${fontManifest.length} 个字体族的 @font-face 声明。`);
}

main();
