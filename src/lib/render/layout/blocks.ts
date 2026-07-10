import { BULLET_COLUMN_WIDTH, DEFAULT_TEXT_COLOR, LIGHT_MUTED_TEXT_COLOR, addBlockHitRegion, addParagraph, buildParagraphSpec, createMarkdownSegments, createPlainSegments, createRectFill, markBreakpoint, measureParagraph, withPointDelta } from './context';
import type { LayoutContext } from './context';

const BULLET_GAP = 4;

export function addSectionHeading(context: LayoutContext, anchor: string, title: string) {
  const { metrics } = context;
  const { theme } = context.data;
  const barWidth = 32;
  const barHeight = 4;
  const gap = metrics.isDenseLayout ? 6 : 8;
  const titleData = createPlainSegments(title, { color: DEFAULT_TEXT_COLOR, fontWeight: 700 });
  const titleSpec = buildParagraphSpec(
    context.contentX + barWidth + gap,
    context.cursorY,
    context.contentWidth - barWidth - gap,
    titleData,
    {
      fontFamily: theme.fontFamily,
      fontSize: withPointDelta(theme.fontSize, 2),
      lineHeight: metrics.headingLineHeight,
      color: DEFAULT_TEXT_COLOR,
    },
  );
  const titleSize = measureParagraph(context, titleSpec);
  const headingHeight = Math.max(barHeight, titleSize.height);
  context.drawOps.push(
    createRectFill(
      {
        x: context.contentX,
        y: context.cursorY + (headingHeight - barHeight) / 2,
        width: barWidth,
        height: barHeight,
      },
      theme.primaryColor,
      undefined,
      undefined,
      999,
    ),
  );
  addParagraph(context, {
    ...titleSpec,
    y: context.cursorY + (headingHeight - titleSize.height) / 2,
  });
  addBlockHitRegion(context, anchor, {
    x: context.contentX,
    y: context.cursorY,
    width: context.contentWidth,
    height: headingHeight,
  });
  context.outline.push({ title, y: context.cursorY });
  context.cursorY += headingHeight + metrics.sectionHeadingMarginBottom;
}

export function addDescriptionLines(
  context: LayoutContext,
  items: string[],
  options: {
    x: number;
    width: number;
    showBulletPoints: boolean;
    itemGap: number;
    lineHeight: number;
  },
) {
  const lines = items.filter((line) => line.trim().length > 0);

  for (let index = 0; index < lines.length; index += 1) {
    if (index > 0) markBreakpoint(context);
    const line = lines[index];
    const bottomGap = index === lines.length - 1 ? 0 : options.itemGap;

    if (options.showBulletPoints) {
      const bulletData = createPlainSegments('•', { color: LIGHT_MUTED_TEXT_COLOR, fontWeight: 700 });
      const bulletSpec = buildParagraphSpec(
        options.x,
        context.cursorY,
        BULLET_COLUMN_WIDTH,
        bulletData,
        {
          fontFamily: context.data.theme.fontFamily,
          fontSize: withPointDelta(context.data.theme.fontSize, -1),
          lineHeight: options.lineHeight,
          color: LIGHT_MUTED_TEXT_COLOR,
        },
      );
      const contentData = createMarkdownSegments(line, context.data.theme.primaryColor, DEFAULT_TEXT_COLOR);
      const contentSpec = buildParagraphSpec(
        options.x + BULLET_COLUMN_WIDTH + BULLET_GAP,
        context.cursorY,
        options.width - BULLET_COLUMN_WIDTH - BULLET_GAP,
        contentData,
        {
          fontFamily: context.data.theme.fontFamily,
          fontSize: withPointDelta(context.data.theme.fontSize, -1),
          lineHeight: options.lineHeight,
          color: DEFAULT_TEXT_COLOR,
          linkColor: context.data.theme.primaryColor,
        },
      );
      const bulletSize = measureParagraph(context, bulletSpec);
      const contentSize = addParagraph(context, contentSpec);
      addParagraph(context, bulletSpec);
      context.cursorY += Math.max(bulletSize.height, contentSize.height) + bottomGap;
      continue;
    }

    const paragraphData = createMarkdownSegments(line, context.data.theme.primaryColor, DEFAULT_TEXT_COLOR);
    const paragraphSpec = buildParagraphSpec(
      options.x,
      context.cursorY,
      options.width,
      paragraphData,
      {
        fontFamily: context.data.theme.fontFamily,
        fontSize: withPointDelta(context.data.theme.fontSize, -1),
        lineHeight: options.lineHeight,
        color: DEFAULT_TEXT_COLOR,
        linkColor: context.data.theme.primaryColor,
      },
    );
    const paragraphSize = addParagraph(context, paragraphSpec);
    context.cursorY += paragraphSize.height + bottomGap;
  }
}
