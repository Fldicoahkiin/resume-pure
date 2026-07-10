import type { CanvasKit, TypefaceFontProvider } from 'canvaskit-wasm';
import { getResumeLayoutMetrics } from '@/lib/render/metrics';
import type { ResumeLayoutMetrics } from '@/lib/render/metrics';
import type { RenderFontSet } from '@/lib/render/fontSet';
import { buildParagraphSegments, extractParagraphSemantics, layoutParagraph } from '@/lib/render/paragraph';
import type { OutlineEntry, ParagraphSpec, RenderBuildOptions, RenderDrawOp, RenderHitRegion, RenderLinkRegion, RenderParagraph, RenderPath, RenderRect, RenderRectFill, RenderTextSegment, SemanticTextRun } from '@/lib/render/types';
import type { ResumeData } from '@/types';

export const LARGE_PARAGRAPH_WIDTH = 4096;

export const DEFAULT_TEXT_COLOR = '#374151';

export const MUTED_TEXT_COLOR = '#6b7280';

export const LIGHT_MUTED_TEXT_COLOR = '#9ca3af';

export const HEADING_TEXT_COLOR = '#333333';

export const BACKGROUND_MUTED = '#f3f4f6';

export const STAR_COLOR = '#d97706';

const POINT_TO_CSS_PIXEL = 96 / 72;

export const ROW_GAP = 8;

export const INLINE_ICON_GAP = 2;

export const INLINE_ICON_LINK_GAP = 3;

export const INLINE_METADATA_GAP = 6;

export const BULLET_COLUMN_WIDTH = 8;

export const PROJECT_LOGO_GAP = 9;

type FontManager = TypefaceFontProvider;

export function ptToPx(value: number) {
  return value * POINT_TO_CSS_PIXEL;
}

export function withPointDelta(base: number, delta: number) {
  return base + ptToPx(delta);
}

export function getRenderLayoutMetrics(theme: ResumeData['theme']): ResumeLayoutMetrics {
  const metrics = getResumeLayoutMetrics(theme);

  return {
    ...metrics,
    sectionMarginBottom: ptToPx(metrics.sectionMarginBottom),
    headerMarginBottom: ptToPx(metrics.headerMarginBottom),
    pageHorizontalPadding: ptToPx(metrics.pageHorizontalPadding),
    pageTopPadding: ptToPx(metrics.pageTopPadding),
    pageBottomPadding: ptToPx(metrics.pageBottomPadding),
    topBarHeight: ptToPx(metrics.topBarHeight),
    itemMarginBottom: ptToPx(metrics.itemMarginBottom),
    sectionHeadingMarginBottom: ptToPx(metrics.sectionHeadingMarginBottom),
    skillCapsuleMinHeight: ptToPx(metrics.skillCapsuleMinHeight),
    technologyPillMinHeight: ptToPx(metrics.technologyPillMinHeight),
    inlineIconSize: ptToPx(metrics.inlineIconSize),
    inlineIconBoxSize: ptToPx(metrics.inlineIconBoxSize),
    contactIconSize: ptToPx(metrics.contactIconSize),
    contactIconBoxSize: ptToPx(metrics.contactIconBoxSize),
  };
}

export interface LayoutContext {
  CanvasKitModule: CanvasKit;
  fontManager: FontManager;
  fontSet: RenderFontSet;
  /** 段落字体回退链（选中字体 → Noto Sans SC → Noto Emoji），构建时算好 */
  fallbackFamilies: string[];
  data: ResumeData;
  options: RenderBuildOptions;
  metrics: ResumeLayoutMetrics;
  width: number;
  contentX: number;
  contentWidth: number;
  cursorY: number;
  drawOps: RenderDrawOp[];
  textRuns: SemanticTextRun[];
  linkRegions: RenderLinkRegion[];
  hitRegions: RenderHitRegion[];
  outline: OutlineEntry[];
  /** 允许分页的位置（元素索引快照），块与块之间可断页，块内不可 */
  breakMarks: BreakMark[];
}


/** 分页断点：记录此刻各元素数组的长度，两个断点之间的内容作为整体移动 */
export interface BreakMark {
  y: number;
  opIndex: number;
  runIndex: number;
  linkIndex: number;
  hitIndex: number;
}


/** 在当前位置登记一个可断页点。调用时机：节标题前、条目之间、描述行之间。 */
export function markBreakpoint(context: LayoutContext) {
  context.breakMarks.push({
    y: context.cursorY,
    opIndex: context.drawOps.length,
    runIndex: context.textRuns.length,
    linkIndex: context.linkRegions.length,
    hitIndex: context.hitRegions.length,
  });
}

interface MeasuredParagraph {
  width: number;
  height: number;
}

export interface InlinePlacementItem {
  width: number;
  height: number;
  place: (x: number, y: number) => void;
}

export interface ContactVisual {
  paths: RenderPath[];
}

function cloneRect(rect: RenderRect): RenderRect {
  return { ...rect };
}

export function createRectFill(rect: RenderRect, fill?: string, stroke?: string, strokeWidth?: number, radius?: number): RenderRectFill {
  return {
    kind: 'rect',
    rect: cloneRect(rect),
    fill,
    stroke,
    strokeWidth,
    radius,
  };
}

export function createPath(path: string, x: number, y: number, width: number, height: number, fill?: string, stroke?: string, strokeWidth?: number): RenderPath {
  return {
    kind: 'path',
    path,
    x,
    y,
    width,
    height,
    fill,
    stroke,
    strokeWidth,
  };
}

export function createPlainSegments(
  text: string,
  options: {
    fontWeight?: RenderTextSegment['fontWeight'];
    fontStyle?: RenderTextSegment['fontStyle'];
    color?: string;
    backgroundColor?: string;
    href?: string;
    kind?: RenderTextSegment['kind'];
  } = {},
) {
  const kind = options.kind || (options.href ? 'link' : 'text');
  const segment: RenderTextSegment = {
    text,
    kind,
    href: options.href,
    start: 0,
    end: text.length,
    fontWeight: options.fontWeight ?? 400,
    fontStyle: options.fontStyle ?? 'normal',
    color: options.color,
    backgroundColor: options.backgroundColor,
  };

  return {
    rawText: text,
    segments: [segment],
  };
}

export function createMarkdownSegments(
  text: string,
  primaryColor: string,
  baseColor: string,
): {
  rawText: string;
  segments: RenderTextSegment[];
} {
  const parsed = buildParagraphSegments(text);
  return {
    rawText: parsed.rawText,
    segments: parsed.segments.map((segment) => ({
      ...segment,
      color:
        segment.kind === 'link'
          ? primaryColor
          : segment.kind === 'code'
            ? '#1f2937'
            : baseColor,
      backgroundColor: segment.kind === 'code' ? BACKGROUND_MUTED : undefined,
    })),
  };
}

export function mergeSegmentGroups(
  groups: Array<{
    rawText: string;
    segments: RenderTextSegment[];
  }>,
) {
  const segments: RenderTextSegment[] = [];
  let offset = 0;

  for (const group of groups) {
    for (const segment of group.segments) {
      segments.push({
        ...segment,
        start: offset + segment.start,
        end: offset + segment.end,
      });
    }
    offset += group.rawText.length;
  }

  return {
    rawText: groups.map((group) => group.rawText).join(''),
    segments,
  };
}

export function measureParagraph(
  context: LayoutContext,
  paragraph: ParagraphSpec,
): MeasuredParagraph {
  const built = layoutParagraph(context.CanvasKitModule, context.fontManager, paragraph, context.fallbackFamilies);
  const measured = {
    width: Math.ceil(Math.max(built.getLongestLine(), 0)),
    height: Math.ceil(Math.max(built.getHeight(), paragraph.fontSize * paragraph.lineHeight)),
  };
  built.delete();
  return measured;
}

export function addParagraph(
  context: LayoutContext,
  paragraph: ParagraphSpec,
): MeasuredParagraph {
  const built = layoutParagraph(context.CanvasKitModule, context.fontManager, paragraph, context.fallbackFamilies);
  const semantics = extractParagraphSemantics(built, paragraph, context.fontSet);
  const measured = {
    width: Math.ceil(Math.max(built.getLongestLine(), 0)),
    height: Math.ceil(Math.max(semantics.height, paragraph.fontSize * paragraph.lineHeight)),
  };

  context.drawOps.push({
    kind: 'paragraph',
    box: {
      x: paragraph.x,
      y: paragraph.y,
      width: paragraph.width,
      height: measured.height,
      paragraph,
    },
  } satisfies RenderParagraph);
  context.textRuns.push(...semantics.textRuns);
  context.linkRegions.push(...semantics.linkRegions);
  built.delete();

  return measured;
}

export function layoutInlineItems(
  items: InlinePlacementItem[],
  options: {
    x: number;
    y: number;
    maxWidth: number;
    rowGap: number;
  },
) {
  const { x, y, maxWidth, rowGap } = options;
  let cursorX = x;
  let cursorY = y;
  let lineHeight = 0;
  let usedWidth = 0;

  for (const item of items) {
    if (cursorX > x && cursorX + item.width > x + maxWidth) {
      cursorX = x;
      cursorY += lineHeight + rowGap;
      lineHeight = 0;
    }

    item.place(cursorX, cursorY);
    cursorX += item.width;
    lineHeight = Math.max(lineHeight, item.height);
    usedWidth = Math.max(usedWidth, cursorX - x);
  }

  return {
    width: usedWidth,
    height: items.length === 0 ? 0 : cursorY - y + lineHeight,
  };
}

function createHitRegion(anchor: string, rect: RenderRect): RenderHitRegion {
  return {
    anchor,
    x: rect.x,
    y: rect.y,
    width: rect.width,
    height: rect.height,
  };
}

export function buildParagraphSpec(
  x: number,
  y: number,
  width: number,
  paragraph: {
    rawText: string;
    segments: RenderTextSegment[];
  },
  style: {
    fontFamily: string;
    fontSize: number;
    lineHeight: number;
    color: string;
    align?: ParagraphSpec['align'];
    linkColor?: string;
  },
): ParagraphSpec {
  return {
    x,
    y,
    width,
    rawText: paragraph.rawText,
    segments: paragraph.segments,
    fontFamily: style.fontFamily,
    fontSize: style.fontSize,
    lineHeight: style.lineHeight,
    color: style.color,
    align: style.align,
    linkColor: style.linkColor,
  };
}

export function addBlockHitRegion(context: LayoutContext, anchor: string, rect: RenderRect) {
  context.hitRegions.push(createHitRegion(anchor, rect));
}
