import type {
  CanvasKit,
  FontMgr,
  LineMetrics,
  RectHeightStyle,
  RectWidthStyle,
  RectWithDirection,
} from 'canvaskit-wasm';
import { parseInlineMarkdown } from '@/lib/markdown';
import { createCanvasKitTextStyle } from '@/lib/render/textStyle';
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

    segments.push({
      text: token.content,
      kind: token.type,
      href: token.type === 'link' ? token.url : undefined,
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
        fontFamilies: [paragraph.fontFamily, 'Noto Sans SC'],
        fontSize: paragraph.fontSize,
        heightMultiplier: paragraph.lineHeight,
      },
    }),
    fontManager,
  );

  for (const segment of paragraph.segments) {
    builder.pushStyle(createCanvasKitTextStyle(CanvasKitModule, paragraph, segment));
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

function buildTextRunsForSegmentLine(
  segment: RenderTextSegment,
  paragraph: ParagraphSpec,
  line: LineMetrics,
  text: string,
  boxes: RenderRect[],
) {
  if (!text.trim()) {
    return [];
  }

  return boxes.map<SemanticTextRun>((box) => ({
    text,
    x: paragraph.x + box.x,
    y: paragraph.y + box.y,
    width: box.width,
    height: box.height || line.height,
    fontFamily: paragraph.fontFamily,
    fontSize: paragraph.fontSize * (paragraph.semanticScale ?? 1),
    fontWeight: segment.fontWeight,
    fontStyle: segment.fontStyle,
    href: segment.href,
  }));
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
  CanvasKitModule: CanvasKit,
  builtParagraph: ReturnType<typeof layoutParagraph>,
  paragraph: ParagraphSpec,
) {
  const lineMetrics = builtParagraph.getLineMetrics();
  const textRuns: SemanticTextRun[] = [];
  const linkRegions: RenderLinkRegion[] = [];

  for (const segment of paragraph.segments) {
    for (const line of lineMetrics) {
      const rangeStart = Math.max(segment.start, line.startIndex);
      const rangeEnd = Math.min(segment.end, line.endExcludingWhitespaces);

      if (rangeStart >= rangeEnd) {
        continue;
      }

      const text = paragraph.rawText.slice(rangeStart, rangeEnd);
      const rawRects = builtParagraph.getRectsForRange(
        rangeStart,
        rangeEnd,
        DEFAULT_RECT_HEIGHT_STYLE,
        DEFAULT_RECT_WIDTH_STYLE,
      );
      const boxes = decodeRectArray(rawRects);

      textRuns.push(...buildTextRunsForSegmentLine(segment, paragraph, line, text, boxes));

      if (segment.href) {
        linkRegions.push(...buildLinkRegionsForBoxes(paragraph, segment.href, boxes));
      }
    }
  }

  return {
    textRuns,
    linkRegions,
    height: builtParagraph.getHeight(),
  };
}
