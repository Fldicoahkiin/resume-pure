#!/usr/bin/env bash
# 渲染字体资产生成脚本。
#
# 从 Google Fonts 官方 static TTF 生成 public/fonts/ 下的子集字体，
# 保证 name 表与 cmap 正确（CanvasKit 预览与 pdf-lib 文本嵌入共用这些文件，
# cmap 损坏会导致 PDF 复制/ATS 解析出乱码）。
#
# 依赖：curl、pyftsubset（brew install fonttools）。
# 手动运行：bash scripts/generate-render-fonts.sh
# 刷新源 URL：curl -A "curl/8" "https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@400;700"
set -euo pipefail

cd "$(dirname "$0")/.."
OUT_DIR="public/fonts"
TMP_DIR="$(mktemp -d)"
trap 'rm -rf "$TMP_DIR"' EXIT

NOTO_SANS_SC_400_URL="https://fonts.gstatic.com/s/notosanssc/v40/k3kCo84MPvpLmixcA63oeAL7Iqp5IZJF9bmaG9_FnYw.ttf"
NOTO_SANS_SC_700_URL="https://fonts.gstatic.com/s/notosanssc/v40/k3kCo84MPvpLmixcA63oeAL7Iqp5IZJF9bmaGzjCnYw.ttf"
NOTO_EMOJI_400_URL="https://fonts.gstatic.com/s/notoemoji/v62/bMrnmSyK7YY-MEu6aWjPDs-ar6uWaGWuob-r0jwv.ttf"

# 中文字符集清单见 scripts/render-font-unicodes.txt（通用规范汉字 + 拉丁/符号/假名/全角）。
CJK_UNICODES_FILE="scripts/render-font-unicodes.txt"

# Emoji 区段 + ZWJ/变体选择符/键帽组合所需码点。
EMOJI_UNICODES="U+200D,U+20E3,U+2139,U+2194-2199,U+21A9-21AA,U+231A-231B,U+2328,U+23CF,U+23E9-23FA,U+24C2,U+25AA-25AB,U+25B6,U+25C0,U+25FB-25FE,U+2600-27BF,U+2934-2935,U+2B05-2B07,U+2B1B-2B1C,U+2B50,U+2B55,U+3030,U+303D,U+3297,U+3299,U+FE0E-FE0F,U+1F000-1FAFF"

subset() {
  local src="$1" unicodes_arg="$2" out="$3"
  # 去 hinting / OpenType layout / 子程序，产出结构简单的字体：
  # pdf-lib 的 fontkit 对带这些表的 CJK 字体做子集/读字宽时会出错
  # （表现为丢字形、拉丁 advance 被当全宽）。name 表保留以修正 PostScript/family 名。
  pyftsubset "$src" \
    "$unicodes_arg" \
    --layout-features='' \
    --no-hinting \
    --desubroutinize \
    --drop-tables+=GSUB,GPOS,GDEF \
    --recalc-bounds \
    --name-IDs='*' \
    --name-legacy \
    --output-file="$out"
  echo "✅ $(basename "$out") $(du -h "$out" | cut -f1)"
}

download() {
  local url="$1" out="$2"
  curl -sfL --max-time 120 "$url" -o "$out"
}

echo "⬇️  下载官方 static 字体..."
download "$NOTO_SANS_SC_400_URL" "$TMP_DIR/sc-400.ttf"
download "$NOTO_SANS_SC_700_URL" "$TMP_DIR/sc-700.ttf"
download "$NOTO_EMOJI_400_URL" "$TMP_DIR/emoji-400.ttf"

echo "✂️  子集化..."
subset "$TMP_DIR/sc-400.ttf" "--unicodes-file=$CJK_UNICODES_FILE" "$OUT_DIR/noto-sans-sc-400.ttf"
subset "$TMP_DIR/sc-700.ttf" "--unicodes-file=$CJK_UNICODES_FILE" "$OUT_DIR/noto-sans-sc-700.ttf"
subset "$TMP_DIR/emoji-400.ttf" "--unicodes=$EMOJI_UNICODES" "$OUT_DIR/noto-emoji-400.ttf"

echo "🎉 渲染字体已更新到 $OUT_DIR/"
