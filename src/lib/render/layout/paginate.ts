import { PAGE_GAP } from '@/lib/render/constants';
import type { ResumeLayoutMetrics } from '@/lib/render/metrics';
import type {
  LayoutPage,
  OutlineEntry,
  RenderDrawOp,
  RenderHitRegion,
  RenderLinkRegion,
  SemanticTextRun,
} from '@/lib/render/types';
import type { BreakMark } from './context';

/** 分页只依赖布局上下文的这个结构子集（LayoutContext 天然满足），便于独立测试 */
export interface PaginateInput {
  metrics: Pick<ResumeLayoutMetrics, 'pageTopPadding' | 'pageBottomPadding'>;
  breakMarks: BreakMark[];
  drawOps: RenderDrawOp[];
  textRuns: SemanticTextRun[];
  linkRegions: RenderLinkRegion[];
  hitRegions: RenderHitRegion[];
  outline: OutlineEntry[];
  cursorY: number;
}

/** 取绘制元素的纵向范围，分页时据此判断块是否越过页底 */
function getDrawOpBounds(op: RenderDrawOp): { top: number; bottom: number } {
  switch (op.kind) {
    case 'rect':
      return { top: op.rect.y, bottom: op.rect.y + op.rect.height };
    case 'line':
      return { top: Math.min(op.y1, op.y2), bottom: Math.max(op.y1, op.y2) };
    case 'path':
    case 'image':
      return { top: op.y, bottom: op.y + op.height };
    case 'paragraph':
      return { top: op.box.y, bottom: op.box.y + op.box.height };
  }
}

function shiftDrawOp(op: RenderDrawOp, dy: number) {
  switch (op.kind) {
    case 'rect':
      op.rect.y += dy;
      return;
    case 'line':
      op.y1 += dy;
      op.y2 += dy;
      return;
    case 'path':
    case 'image':
      op.y += dy;
      return;
    case 'paragraph':
      op.box.y += dy;
      op.box.paragraph.y += dy;
      return;
  }
}

interface ReflowChunk {
  ops: RenderDrawOp[];
  runs: SemanticTextRun[];
  links: RenderLinkRegion[];
  top: number;
  bottom: number;
}


/** 按断点切块，块整体下移到下一页；返回分页切片并原位修改所有坐标。 */
export function paginateDocument(context: PaginateInput, paperHeight: number): LayoutPage[] {
  const { metrics } = context;
  const marks: BreakMark[] = [
    { y: 0, opIndex: 0, runIndex: 0, linkIndex: 0, hitIndex: 0 },
    ...context.breakMarks,
    {
      y: context.cursorY,
      opIndex: context.drawOps.length,
      runIndex: context.textRuns.length,
      linkIndex: context.linkRegions.length,
      hitIndex: context.hitRegions.length,
    },
  ];

  const chunks: ReflowChunk[] = [];
  for (let index = 0; index < marks.length - 1; index += 1) {
    const from = marks[index];
    const to = marks[index + 1];
    const ops = context.drawOps.slice(from.opIndex, to.opIndex);
    if (ops.length === 0) {
      continue;
    }

    let top = Infinity;
    let bottom = -Infinity;
    for (const op of ops) {
      const bounds = getDrawOpBounds(op);
      top = Math.min(top, bounds.top);
      bottom = Math.max(bottom, bounds.bottom);
    }

    chunks.push({
      ops,
      runs: context.textRuns.slice(from.runIndex, to.runIndex),
      links: context.linkRegions.slice(from.linkIndex, to.linkIndex),
      top,
      bottom,
    });
  }

  const usableFollowingPage = paperHeight - metrics.pageTopPadding - metrics.pageBottomPadding;
  const pages: LayoutPage[] = [
    { top: 0, height: paperHeight, drawOps: [], textRuns: [], linkRegions: [] },
  ];
  // (原始 y, 累计偏移) 时间线：跨块的 hitRegion 按几何位置分别映射上下边
  const offsetTimeline: Array<{ fromY: number; offset: number }> = [{ fromY: 0, offset: 0 }];
  let offset = 0;

  for (const chunk of chunks) {
    const page = pages[pages.length - 1];
    const pageBottomLimit = page.top + paperHeight - metrics.pageBottomPadding;
    const chunkHeight = chunk.bottom - chunk.top;

    if (chunk.bottom + offset > pageBottomLimit && chunk.top + offset > page.top) {
      if (chunkHeight > usableFollowingPage) {
        console.warn('渲染分页：单个内容块高于一页，将从新页顶部开始并溢出裁切。');
      }

      const nextPageTop = page.top + paperHeight + PAGE_GAP;
      const delta = nextPageTop + metrics.pageTopPadding - (chunk.top + offset);
      if (delta > 0) {
        offset += delta;
        offsetTimeline.push({ fromY: chunk.top, offset });
        pages.push({ top: nextPageTop, height: paperHeight, drawOps: [], textRuns: [], linkRegions: [] });
      }
    }

    if (offset > 0) {
      for (const op of chunk.ops) shiftDrawOp(op, offset);
      for (const run of chunk.runs) {
        run.y += offset;
        run.baselineY += offset;
      }
      for (const link of chunk.links) link.y += offset;
    }

    const target = pages[pages.length - 1];
    target.drawOps.push(...chunk.ops);
    target.textRuns.push(...chunk.runs);
    target.linkRegions.push(...chunk.links);
  }

  // hitRegion 可能跨多个块（如整节区域）：上下边分别按原始 y 查偏移，实现跨页拉伸。
  const offsetAt = (y: number) => {
    let applied = 0;
    for (const entry of offsetTimeline) {
      if (y >= entry.fromY) {
        applied = entry.offset;
      }
    }
    return applied;
  };

  for (const region of context.hitRegions) {
    const topOffset = offsetAt(region.y);
    const bottomOffset = offsetAt(region.y + region.height);
    region.y += topOffset;
    region.height += bottomOffset - topOffset;
  }

  for (const entry of context.outline) {
    entry.y += offsetAt(entry.y);
  }

  return pages;
}
