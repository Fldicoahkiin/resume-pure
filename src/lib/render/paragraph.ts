import type {
  CanvasKit,
  FontMgr,
  LineMetrics,
  RectHeightStyle,
  RectWidthStyle,
  RectWithDirection,
} from 'canvaskit-wasm';
import { parseInlineMarkdown } from '@/lib/markdown';
import type { RenderFontSet } from '@/lib/render/fontSet';
import { createCanvasKitTextStyle, resolveSegmentColor } from '@/lib/render/textStyle';
import { isSafePdfUrl } from '@/lib/resumeUtils';
import type {
  ParagraphSpec,
  RenderLinkRegion,
  RenderRect,
  RenderTextSegment,
  SemanticTextRun,
} from '@/lib/render/types';

const DEFAULT_RECT_HEIGHT_STYLE = 1 as unknown as RectHeightStyle;
const DEFAULT_RECT_WIDTH_STYLE = 1 as unknown as RectWidthStyle;

function getSegmentFontWeight(kind: RenderTextSegment['kind']): RenderTextSegment['fontWeight'] {
  if (kind === 'bold') {
    return 700;
  }

  return 400;
}

function getSegmentFontStyle(kind: RenderTextSegment['kind']): RenderTextSegment['fontStyle'] {
  if (kind === 'italic') {
    return 'italic';
  }

  return 'normal';
}

export function buildParagraphSegments(text: string) {
  const tokens = parseInlineMarkdown(text);
  const segments: RenderTextSegment[] = [];
  let offset = 0;

  for (const token of tokens) {
    if (!token.content) {
      continue;
    }

    const start = offset;
    const end = start + token.content.length;
    offset = end;

    const safeHref = token.type === 'link' && token.url && isSafePdfUrl(token.url) ? token.url : undefined;

    segments.push({
      text: token.content,
      kind: token.type === 'link' && !safeHref ? 'text' : token.type,
      href: safeHref,
      start,
      end,
      fontWeight: getSegmentFontWeight(token.type),
      fontStyle: getSegmentFontStyle(token.type),
    });
  }

  return {
    rawText: segments.map((segment) => segment.text).join(''),
    segments,
  };
}

export function layoutParagraph(
  CanvasKitModule: CanvasKit,
  fontManager: FontMgr,
  paragraph: ParagraphSpec,
  fallbackFamilies: string[],
) {
  const builder = CanvasKitModule.ParagraphBuilder.Make(
    new CanvasKitModule.ParagraphStyle({
      textAlign:
        paragraph.align === 'center'
          ? CanvasKitModule.TextAlign.Center
          : paragraph.align === 'right'
            ? CanvasKitModule.TextAlign.Right
            : CanvasKitModule.TextAlign.Left,
      textStyle: {
        fontFamilies: fallbackFamilies,
        fontSize: paragraph.fontSize,
        heightMultiplier: paragraph.lineHeight,
      },
    }),
    fontManager,
  );

  for (const segment of paragraph.segments) {
    builder.pushStyle(createCanvasKitTextStyle(CanvasKitModule, paragraph, segment, fallbackFamilies));
    builder.addText(segment.text);
    builder.pop();
  }

  const built = builder.build();
  built.layout(paragraph.width);

  builder.delete();

  return built;
}

function decodeRectArray(rawRects: RectWithDirection[]) {
  const rects: RenderRect[] = [];

  for (const entry of rawRects) {
    const left = entry.rect[0];
    const top = entry.rect[1];
    const right = entry.rect[2];
    const bottom = entry.rect[3];

    rects.push({
      x: left,
      y: top,
      width: Math.max(0, right - left),
      height: Math.max(0, bottom - top),
    });
  }

  return rects;
}

interface FamilyRun {
  start: number;
  end: number;
  text: string;
  family: string;
}

/**
 * 将 [start, end) 的文本按实际命中的字体族拆成连续子段。
 * 与 CanvasKit 段落的逐字形回退一致，保证 PDF 用同一字体绘制同一段文本。
 */
function splitRangeByFamily(
  rawText: string,
  start: number,
  end: number,
  preferredFamily: string,
  fontSet: RenderFontSet,
): FamilyRun[] {
  const runs: FamilyRun[] = [];
  const text = rawText.slice(start, end);
  const codepoints = Array.from(text);
  let cursor = start;
  let index = 0;

  for (const char of codepoints) {
    const codepoint = char.codePointAt(0) ?? 0;
    const next = codepoints[index + 1];
    const nextCodepoint = next ? next.codePointAt(0) : undefined;
    const resolved = fontSet.resolveFamily(preferredFamily, codepoint, nextCodepoint);
    const family = resolved ?? (runs.length > 0 ? runs[runs.length - 1].family : preferredFamily);
    const charEnd = cursor + char.length;

    const lastRun = runs[runs.length - 1];
    if (lastRun && lastRun.family === family && lastRun.end === cursor) {
      lastRun.end = charEnd;
      lastRun.text += char;
    } else {
      runs.push({ start: cursor, end: charEnd, text: char, family });
    }

    cursor = charEnd;
    index += 1;
  }

  return runs;
}

function buildLinkRegionsForBoxes(
  paragraph: ParagraphSpec,
  href: string,
  boxes: RenderRect[],
) {
  return boxes.map<RenderLinkRegion>((box) => ({
    x: paragraph.x + box.x,
    y: paragraph.y + box.y,
    width: box.width,
    height: box.height,
    href,
  }));
}

export function extractParagraphSemantics(
  builtParagraph: ReturnType<typeof layoutParagraph>,
  paragraph: ParagraphSpec,
  fontSet: RenderFontSet,
) {
  const lineMetrics = builtParagraph.getLineMetrics() as LineMetrics[];
  const textRuns: SemanticTextRun[] = [];
  const linkRegions: RenderLinkRegion[] = [];

  for (const segment of paragraph.segments) {
    const segmentColor = resolveSegmentColor(paragraph, segment);

    for (const line of lineMetrics) {
      const rangeStart = Math.max(segment.start, line.startIndex);
      const rangeEnd = Math.min(segment.end, line.endExcludingWhitespaces);

      if (rangeStart >= rangeEnd) {
        continue;
      }

      const baselineY = paragraph.y + line.baseline;
      const familyRuns = splitRangeByFamily(
        paragraph.rawText,
        rangeStart,
        rangeEnd,
        paragraph.fontFamily,
        fontSet,
      );

      for (const familyRun of familyRuns) {
        if (!familyRun.text.trim()) {
          continue;
        }

        const rawRects = builtParagraph.getRectsForRange(
          familyRun.start,
          familyRun.end,
          DEFAULT_RECT_HEIGHT_STYLE,
          DEFAULT_RECT_WIDTH_STYLE,
        );
        const boxes = decodeRectArray(rawRects);
        if (boxes.length === 0) {
          continue;
        }

        // 同一 family-run 在一行内可能被 CanvasKit 拆成多个 box（如加粗切换点）。
        // 合并成单个 run 只画一次文本——PDF 侧用相同字体的 advance 自行排列，
        // 避免逐 box 重复绘制导致的字符错位。
        const left = Math.min(...boxes.map((box) => box.x));
        const right = Math.max(...boxes.map((box) => box.x + box.width));
        const top = Math.min(...boxes.map((box) => box.y));
        const bottom = Math.max(...boxes.map((box) => box.y + box.height));

        textRuns.push({
          text: familyRun.text,
          x: paragraph.x + left,
          y: paragraph.y + top,
          width: right - left,
          height: bottom - top || line.height,
          baselineY,
          fontFamily: familyRun.family,
          fontSize: paragraph.fontSize,
          fontWeight: segment.fontWeight,
          fontStyle: segment.fontStyle,
          color: segmentColor,
          backgroundColor: segment.backgroundColor,
          strike: segment.kind === 'strike' ? true : undefined,
          href: segment.href,
        });
      }

      if (segment.href) {
        const rawRects = builtParagraph.getRectsForRange(
          rangeStart,
          rangeEnd,
          DEFAULT_RECT_HEIGHT_STYLE,
          DEFAULT_RECT_WIDTH_STYLE,
        );
        linkRegions.push(...buildLinkRegionsForBoxes(paragraph, segment.href, decodeRectArray(rawRects)));
      }
    }
  }

  return {
    textRuns,
    linkRegions,
    height: builtParagraph.getHeight(),
  };
}
