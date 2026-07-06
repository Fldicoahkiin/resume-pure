import type { CanvasKit, Typeface } from 'canvaskit-wasm';
import {
  RENDER_EMOJI_FAMILY,
  RENDER_FALLBACK_FAMILY,
  type RendererFontFace,
} from '@/lib/render/fonts';

/** 组合用零宽字符：本身不决定字体，跟随所在序列。 */
const JOINER_CODEPOINTS = new Set([0x200d, 0xfe0e, 0xfe0f, 0x20e3]);

/**
 * 渲染字体集：按 CanvasKit 段落相同的回退顺序（选中字体 → Noto Sans SC → Noto Emoji）
 * 解析每个码点实际命中的字体族，供语义文本层记录真实字体（PDF 按此嵌入绘制）。
 */
export interface RenderFontSet {
  faces: RendererFontFace[];
  fallbackFamilies(preferred: string): string[];
  resolveFamily(preferred: string, codepoint: number, nextCodepoint?: number): string | null;
  dispose(): void;
}

export function createRenderFontSet(CanvasKitModule: CanvasKit, faces: RendererFontFace[]): RenderFontSet {
  const typefaces = new Map<string, Typeface>();
  const coverageCache = new Map<string, boolean>();

  for (const face of faces) {
    // 覆盖检测按字体族做（同族各字重的 cmap 一致），取每族第一个 face。
    if (!typefaces.has(face.family)) {
      const typeface = CanvasKitModule.Typeface.MakeFreeTypeFaceFromData(face.buffer);
      if (typeface) {
        typefaces.set(face.family, typeface);
      }
    }
  }

  const familyList = Array.from(typefaces.keys());

  function hasGlyph(family: string, codepoint: number): boolean {
    const key = `${family}:${codepoint}`;
    const cached = coverageCache.get(key);
    if (cached !== undefined) {
      return cached;
    }

    const typeface = typefaces.get(family);
    const covered = typeface
      ? typeface.getGlyphIDs(String.fromCodePoint(codepoint))[0] !== 0
      : false;
    coverageCache.set(key, covered);
    return covered;
  }

  function fallbackFamilies(preferred: string): string[] {
    const ordered = [preferred, RENDER_FALLBACK_FAMILY, RENDER_EMOJI_FAMILY];
    const seen = new Set<string>();
    const result: string[] = [];

    for (const family of ordered) {
      if (!seen.has(family) && familyList.includes(family)) {
        seen.add(family);
        result.push(family);
      }
    }

    return result.length > 0 ? result : [preferred];
  }

  return {
    faces,
    fallbackFamilies,
    resolveFamily(preferred, codepoint, nextCodepoint) {
      // 零宽组合字符跟随当前序列，不切换字体。
      if (JOINER_CODEPOINTS.has(codepoint)) {
        return null;
      }

      const candidates = fallbackFamilies(preferred);

      // 键帽/emoji 变体序列（如 1️⃣）：后随 FE0F/20E3 时整体归 emoji 字体，避免拆散连字。
      if (
        nextCodepoint !== undefined &&
        (nextCodepoint === 0xfe0f || nextCodepoint === 0x20e3) &&
        candidates.includes(RENDER_EMOJI_FAMILY) &&
        hasGlyph(RENDER_EMOJI_FAMILY, codepoint)
      ) {
        return RENDER_EMOJI_FAMILY;
      }

      for (const family of candidates) {
        if (hasGlyph(family, codepoint)) {
          return family;
        }
      }

      return candidates[0];
    },
    dispose() {
      for (const typeface of Array.from(typefaces.values())) {
        typeface.delete();
      }
      typefaces.clear();
      coverageCache.clear();
    },
  };
}
