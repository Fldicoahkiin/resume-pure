import { experienceAnchor, sectionAnchor } from '@/lib/previewAnchor';
import { getDateRange } from '@/lib/resumeUtils';
import type { Experience, SectionConfig } from '@/types';
import { addDescriptionLines, addSectionHeading } from './blocks';
import { DEFAULT_TEXT_COLOR, HEADING_TEXT_COLOR, LARGE_PARAGRAPH_WIDTH, MUTED_TEXT_COLOR, ROW_GAP, addBlockHitRegion, addParagraph, buildParagraphSpec, createPlainSegments, markBreakpoint, measureParagraph, mergeSegmentGroups, ptToPx, withPointDelta } from './context';
import type { LayoutContext } from './context';

function addExperienceItem(context: LayoutContext, item: Experience, previous: Experience | undefined) {
  const { metrics, options } = context;
  const { theme } = context.data;
  const hideCompany = Boolean(previous && item.company === previous.company);
  const itemStartY = context.cursorY;
  const dateText = getDateRange(item.startDate, item.endDate, item.current, options.translations.present);
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

  if (!hideCompany) {
    const companySpec = buildParagraphSpec(
      context.contentX,
      context.cursorY,
      context.contentWidth,
      createPlainSegments(item.company, { color: HEADING_TEXT_COLOR, fontWeight: 700 }),
      {
        fontFamily: theme.fontFamily,
        fontSize: theme.fontSize,
        lineHeight: metrics.headingLineHeight,
        color: HEADING_TEXT_COLOR,
      },
    );
    const companySize = addParagraph(context, companySpec);
    context.cursorY += companySize.height + ptToPx(1);
  }

  const roleGroups = [
    createPlainSegments(item.position, { color: DEFAULT_TEXT_COLOR }),
  ];
  if (item.location) {
    roleGroups.push(createPlainSegments(` · ${item.location}`, { color: MUTED_TEXT_COLOR }));
  }
  const roleSpec = buildParagraphSpec(
    context.contentX,
    context.cursorY,
    Math.max(context.contentWidth - dateSize.width - ROW_GAP, context.contentWidth * 0.5),
    mergeSegmentGroups(roleGroups),
    {
      fontFamily: theme.fontFamily,
      fontSize: withPointDelta(theme.fontSize, -1),
      lineHeight: metrics.detailLineHeight,
      color: DEFAULT_TEXT_COLOR,
    },
  );
  const roleSize = addParagraph(context, roleSpec);
  addParagraph(context, {
    ...dateSpec,
    x: context.contentX + context.contentWidth - dateSize.width,
    y: context.cursorY,
  });
  context.cursorY += Math.max(roleSize.height, dateSize.height) + ptToPx(2);

  addDescriptionLines(context, item.description, {
    x: context.contentX,
    width: context.contentWidth,
    showBulletPoints: item.showBulletPoints !== false,
    itemGap: ptToPx(2.5),
    lineHeight: metrics.detailLineHeight,
  });
  const itemHeight = context.cursorY - itemStartY;
  addBlockHitRegion(context, experienceAnchor(item.id), {
    x: context.contentX,
    y: itemStartY,
    width: context.contentWidth,
    height: itemHeight,
  });
  context.cursorY += metrics.itemMarginBottom;
}

export function addExperienceSection(context: LayoutContext, section: SectionConfig, items: Experience[]) {
  if (items.length === 0) return;
  markBreakpoint(context);
  const sectionStartY = context.cursorY;
  addSectionHeading(context, sectionAnchor(section.id), section.title || context.options.translations.experience);
  items.forEach((item, index) => {
    if (index > 0) markBreakpoint(context);
    addExperienceItem(context, item, items[index - 1]);
  });
  addBlockHitRegion(context, sectionAnchor(section.id), {
    x: context.contentX,
    y: sectionStartY,
    width: context.contentWidth,
    height: context.cursorY - sectionStartY,
  });
}
