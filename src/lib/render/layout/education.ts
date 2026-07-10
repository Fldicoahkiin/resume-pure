import { educationAnchor, sectionAnchor } from '@/lib/previewAnchor';
import { getDateRange } from '@/lib/resumeUtils';
import type { Education, SectionConfig } from '@/types';
import { addDescriptionLines, addSectionHeading } from './blocks';
import { DEFAULT_TEXT_COLOR, HEADING_TEXT_COLOR, LARGE_PARAGRAPH_WIDTH, MUTED_TEXT_COLOR, ROW_GAP, addBlockHitRegion, addParagraph, buildParagraphSpec, createPlainSegments, markBreakpoint, measureParagraph, mergeSegmentGroups, ptToPx, withPointDelta } from './context';
import type { LayoutContext } from './context';

function addEducationItem(context: LayoutContext, item: Education, previous: Education | undefined) {
  const { metrics, options } = context;
  const { theme } = context.data;
  const hideSchool = Boolean(previous && item.school === previous.school);
  const itemStartY = context.cursorY;
  const dateText = getDateRange(item.startDate, item.endDate, false, options.translations.present);
  const dateSpec = buildParagraphSpec(
    0,
    0,
    LARGE_PARAGRAPH_WIDTH,
    createPlainSegments(dateText, { color: '#666666' }),
    {
      fontFamily: theme.fontFamily,
      fontSize: withPointDelta(theme.fontSize, -1),
      lineHeight: metrics.metadataLineHeight,
      color: '#666666',
    },
  );
  const dateSize = measureParagraph(context, dateSpec);

  if (!hideSchool) {
    const schoolSpec = buildParagraphSpec(
      context.contentX,
      context.cursorY,
      context.contentWidth,
      createPlainSegments(item.school, { color: HEADING_TEXT_COLOR, fontWeight: 700 }),
      {
        fontFamily: theme.fontFamily,
        fontSize: theme.fontSize,
        lineHeight: metrics.headingLineHeight,
        color: HEADING_TEXT_COLOR,
      },
    );
    const schoolSize = addParagraph(context, schoolSpec);
    context.cursorY += schoolSize.height + ptToPx(1);
  }

  const titleGroups = [
    createPlainSegments(item.degree, { color: DEFAULT_TEXT_COLOR }),
  ];
  if (item.major) {
    titleGroups.push(createPlainSegments(` - ${item.major}`, { color: DEFAULT_TEXT_COLOR }));
  }
  if (item.gpa) {
    titleGroups.push(createPlainSegments(` · GPA: ${item.gpa}`, { color: MUTED_TEXT_COLOR }));
  }
  const titleSpec = buildParagraphSpec(
    context.contentX,
    context.cursorY,
    Math.max(context.contentWidth - dateSize.width - ROW_GAP, context.contentWidth * 0.5),
    mergeSegmentGroups(titleGroups),
    {
      fontFamily: theme.fontFamily,
      fontSize: withPointDelta(theme.fontSize, -1),
      lineHeight: metrics.detailLineHeight,
      color: DEFAULT_TEXT_COLOR,
    },
  );
  const titleSize = addParagraph(context, titleSpec);
  addParagraph(context, {
    ...dateSpec,
    x: context.contentX + context.contentWidth - dateSize.width,
    y: context.cursorY,
  });
  context.cursorY += Math.max(titleSize.height, dateSize.height) + ptToPx(2);

  addDescriptionLines(context, item.description || [], {
    x: context.contentX,
    width: context.contentWidth,
    showBulletPoints: item.showBulletPoints !== false,
    itemGap: ptToPx(2.5),
    lineHeight: metrics.detailLineHeight,
  });
  const itemHeight = context.cursorY - itemStartY;
  addBlockHitRegion(context, educationAnchor(item.id), {
    x: context.contentX,
    y: itemStartY,
    width: context.contentWidth,
    height: itemHeight,
  });
  context.cursorY += metrics.itemMarginBottom;
}

export function addEducationSection(context: LayoutContext, section: SectionConfig, items: Education[]) {
  if (items.length === 0) return;
  markBreakpoint(context);
  const sectionStartY = context.cursorY;
  addSectionHeading(context, sectionAnchor(section.id), section.title || context.options.translations.education);
  items.forEach((item, index) => {
    if (index > 0) markBreakpoint(context);
    addEducationItem(context, item, items[index - 1]);
  });
  addBlockHitRegion(context, sectionAnchor(section.id), {
    x: context.contentX,
    y: sectionStartY,
    width: context.contentWidth,
    height: context.cursorY - sectionStartY,
  });
}
