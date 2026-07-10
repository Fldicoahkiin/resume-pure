import { describe, expect, it } from 'vitest';
import { PAGE_GAP } from '@/lib/render/constants';
import type { RenderDrawOp } from '@/lib/render/types';
import type { BreakMark } from './context';
import { paginateDocument, type PaginateInput } from './paginate';

const PAPER_HEIGHT = 1000;
const METRICS = { pageTopPadding: 20, pageBottomPadding: 30 };
// 首页内容底线 970；第 2 页顶 = 1000 + PAGE_GAP，内容起点再 +20

function rectOp(y: number, height: number): RenderDrawOp {
  return { kind: 'rect', rect: { x: 0, y, width: 100, height }, fill: '#000' };
}

function markAfter(input: PaginateInput): BreakMark {
  return {
    y: 0,
    opIndex: input.drawOps.length,
    runIndex: input.textRuns.length,
    linkIndex: input.linkRegions.length,
    hitIndex: input.hitRegions.length,
  };
}

function createInput(): PaginateInput {
  return {
    metrics: METRICS,
    breakMarks: [],
    drawOps: [],
    textRuns: [],
    linkRegions: [],
    hitRegions: [],
    outline: [],
    cursorY: 0,
  };
}

describe('paginateDocument', () => {
  it('内容不超页时输出单页且不位移', () => {
    const input = createInput();
    input.drawOps.push(rectOp(0, 500));
    input.cursorY = 500;

    const pages = paginateDocument(input, PAPER_HEIGHT);

    expect(pages).toHaveLength(1);
    expect(pages[0]).toMatchObject({ top: 0, height: PAPER_HEIGHT });
    expect(pages[0].drawOps).toHaveLength(1);
    expect((input.drawOps[0] as Extract<RenderDrawOp, { kind: 'rect' }>).rect.y).toBe(0);
  });

  it('越过页底的块整体移到下一页顶部', () => {
    const input = createInput();
    input.drawOps.push(rectOp(0, 900)); // 块 1：0-900，留在首页
    input.breakMarks.push(markAfter(input));
    input.drawOps.push(rectOp(920, 100)); // 块 2：920-1020 > 970 → 下一页
    input.cursorY = 1020;

    const pages = paginateDocument(input, PAPER_HEIGHT);

    expect(pages).toHaveLength(2);
    const page2Top = PAPER_HEIGHT + PAGE_GAP;
    expect(pages[1].top).toBe(page2Top);
    // 块 2 顶部落在第 2 页内容起点
    const moved = pages[1].drawOps[0] as Extract<RenderDrawOp, { kind: 'rect' }>;
    expect(moved.rect.y).toBe(page2Top + METRICS.pageTopPadding);
    // 块 1 未动
    const kept = pages[0].drawOps[0] as Extract<RenderDrawOp, { kind: 'rect' }>;
    expect(kept.rect.y).toBe(0);
  });

  it('文本 run 与链接随所在块同步位移', () => {
    const input = createInput();
    input.drawOps.push(rectOp(0, 900));
    input.breakMarks.push(markAfter(input));
    input.drawOps.push(rectOp(950, 40));
    input.textRuns.push({
      text: 'x', x: 0, y: 955, width: 10, height: 10, baselineY: 963,
      fontFamily: 'F', fontSize: 10, fontWeight: 400, fontStyle: 'normal', color: '#000',
    });
    input.linkRegions.push({ x: 0, y: 955, width: 10, height: 10, href: 'https://a' });
    input.cursorY = 990;

    paginateDocument(input, PAPER_HEIGHT);

    const shift = PAPER_HEIGHT + PAGE_GAP + METRICS.pageTopPadding - 950;
    expect(input.textRuns[0].y).toBe(955 + shift);
    expect(input.textRuns[0].baselineY).toBe(963 + shift);
    expect(input.linkRegions[0].y).toBe(955 + shift);
  });

  it('跨块的 hitRegion 上下边分别映射（跨页拉伸）', () => {
    const input = createInput();
    input.drawOps.push(rectOp(800, 100)); // 块 1
    input.breakMarks.push(markAfter(input));
    input.drawOps.push(rectOp(910, 80)); // 块 2 → 换页
    input.cursorY = 990;
    // 整节区域覆盖两块
    input.hitRegions.push({ anchor: 'section:x', x: 0, y: 800, width: 100, height: 190 });

    paginateDocument(input, PAPER_HEIGHT);

    const region = input.hitRegions[0];
    const shift = PAPER_HEIGHT + PAGE_GAP + METRICS.pageTopPadding - 910;
    expect(region.y).toBe(800); // 顶边在块 1，无偏移
    expect(region.height).toBe(190 + shift); // 底边随块 2 拉伸
  });

  it('outline 条目随偏移平移', () => {
    const input = createInput();
    input.drawOps.push(rectOp(0, 900));
    input.breakMarks.push(markAfter(input));
    input.drawOps.push(rectOp(950, 40));
    input.outline.push({ title: '第一节', y: 10 }, { title: '第二节', y: 950 });
    input.cursorY = 990;

    paginateDocument(input, PAPER_HEIGHT);

    const shift = PAPER_HEIGHT + PAGE_GAP + METRICS.pageTopPadding - 950;
    expect(input.outline[0].y).toBe(10);
    expect(input.outline[1].y).toBe(950 + shift);
  });

  it('高于一页的块从新页顶部开始（不无限分页）', () => {
    const input = createInput();
    input.drawOps.push(rectOp(0, 960));
    input.breakMarks.push(markAfter(input));
    input.drawOps.push(rectOp(965, 2000)); // 超高块
    input.cursorY = 2965;

    const pages = paginateDocument(input, PAPER_HEIGHT);

    expect(pages).toHaveLength(2);
    const moved = pages[1].drawOps[0] as Extract<RenderDrawOp, { kind: 'rect' }>;
    expect(moved.rect.y).toBe(PAPER_HEIGHT + PAGE_GAP + METRICS.pageTopPadding);
  });

  it('paragraph 位移同步 box 与段落规格坐标', () => {
    const input = createInput();
    input.drawOps.push(rectOp(0, 900));
    input.breakMarks.push(markAfter(input));
    const paragraphOp: RenderDrawOp = {
      kind: 'paragraph',
      box: {
        x: 0, y: 950, width: 100, height: 30,
        paragraph: {
          x: 0, y: 950, width: 100, segments: [], rawText: '',
          fontFamily: 'F', fontSize: 10, lineHeight: 1.2, color: '#000',
        },
      },
    };
    input.drawOps.push(paragraphOp);
    input.cursorY = 980;

    paginateDocument(input, PAPER_HEIGHT);

    const shift = PAPER_HEIGHT + PAGE_GAP + METRICS.pageTopPadding - 950;
    expect(paragraphOp.box.y).toBe(950 + shift);
    expect(paragraphOp.box.paragraph.y).toBe(950 + shift);
  });
});
