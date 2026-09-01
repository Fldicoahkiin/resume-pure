import { customItemAnchor, sectionAnchor } from '@/lib/previewAnchor';
import { formatGitHubPath, sanitizeUrl } from '@/lib/resumeUtils';
import type { CustomSectionItem, SectionConfig } from '@/types';
import { addDescriptionLines, addSectionHeading } from './blocks';
import {
  INLINE_ICON_GAP,
  INLINE_ICON_LINK_GAP,
  INLINE_METADATA_GAP,
  LARGE_PARAGRAPH_WIDTH,
  LIGHT_MUTED_TEXT_COLOR,
  MUTED_TEXT_COLOR,
  addBlockHitRegion,
  addParagraph,
  buildParagraphSpec,
  createPath,
  createPlainSegments,
  layoutInlineItems,
  markBreakpoint,
  measureParagraph,
  ptToPx,
  withPointDelta,
} from './context';
import type { InlinePlacementItem, LayoutContext } from './context';
import { GITHUB_ICON, LINK_ICON } from './icons';
import { buildInlineMetadataItem } from './inline';

const ITEM_GAP = 5;
const DESCRIPTION_GAP = 2;

function buildHeadingItems(context: LayoutContext, item: CustomSectionItem) {
  const { metrics } = context;
  const { theme } = context.data;
  const items: InlinePlacementItem[] = [];
  const titleSpec = buildParagraphSpec(
    0,
    0,
    LARGE_PARAGRAPH_WIDTH,
    createPlainSegments(item.title || '', { color: '#111827', fontWeight: 700 }),
    {
      fontFamily: theme.fontFamily,
      fontSize: theme.fontSize,
      lineHeight: metrics.headingLineHeight,
      color: '#111827',
    },
  );
  const titleSize = measureParagraph(context, titleSpec);
  items.push({
    width: titleSize.width,
    height: titleSize.height,
    place: (x, y) => addParagraph(context, { ...titleSpec, x, y }),
  });

  if (item.subtitle) {
    const subtitleSpec = buildParagraphSpec(
      0,
      0,
      LARGE_PARAGRAPH_WIDTH,
      createPlainSegments(item.subtitle, { color: MUTED_TEXT_COLOR }),
      {
        fontFamily: theme.fontFamily,
        fontSize: withPointDelta(theme.fontSize, -1),
        lineHeight: metrics.metadataLineHeight,
        color: MUTED_TEXT_COLOR,
      },
    );
    const subtitleSize = measureParagraph(context, subtitleSpec);
    items.push({
      width: INLINE_METADATA_GAP + subtitleSize.width,
      height: subtitleSize.height,
      place: (x, y) => addParagraph(context, { ...subtitleSpec, x: x + INLINE_METADATA_GAP, y }),
    });
  }

  if (item.repoUrl) {
    items.push(buildInlineMetadataItem(context, {
      value: formatGitHubPath(item.repoUrl),
      href: theme.enableLinks === false ? undefined : sanitizeUrl(item.repoUrl),
      color: LIGHT_MUTED_TEXT_COLOR,
      fontSize: withPointDelta(theme.fontSize, -2),
      lineHeight: metrics.metadataLineHeight,
      iconBoxSize: metrics.inlineIconBoxSize,
      iconGap: INLINE_ICON_GAP,
      marginLeft: INLINE_METADATA_GAP,
      iconVisual: { paths: [createPath(GITHUB_ICON, 0, 0, metrics.inlineIconSize, metrics.inlineIconSize, LIGHT_MUTED_TEXT_COLOR)] },
    }));
  }

  if (item.url) {
    items.push(buildInlineMetadataItem(context, {
      value: item.url,
      href: theme.enableLinks === false ? undefined : sanitizeUrl(item.url),
      color: LIGHT_MUTED_TEXT_COLOR,
      fontSize: withPointDelta(theme.fontSize, -2),
      lineHeight: metrics.metadataLineHeight,
      iconBoxSize: metrics.inlineIconBoxSize,
      iconGap: INLINE_ICON_LINK_GAP,
      marginLeft: INLINE_METADATA_GAP,
      iconVisual: { paths: [createPath(LINK_ICON, 0, 0, metrics.inlineIconSize, metrics.inlineIconSize, LIGHT_MUTED_TEXT_COLOR)] },
    }));
  }

  return items;
}

export function addAgentSkillSection(
  context: LayoutContext,
  section: SectionConfig,
  items: CustomSectionItem[],
) {
  if (items.length === 0) return;
  markBreakpoint(context);
  const sectionStartY = context.cursorY;
  addSectionHeading(
    context,
    sectionAnchor(section.id),
    section.title || context.options.translations.customSection,
  );

  items.forEach((item, index) => {
    if (index > 0) {
      markBreakpoint(context);
      context.cursorY += ITEM_GAP;
    }
    const itemStartY = context.cursorY;
    const heading = layoutInlineItems(buildHeadingItems(context, item), {
      x: context.contentX,
      y: context.cursorY,
      maxWidth: context.contentWidth,
      rowGap: 0,
    });
    context.cursorY += heading.height;
    if (item.description.length > 0) {
      context.cursorY += DESCRIPTION_GAP;
      addDescriptionLines(context, item.description, {
        x: context.contentX,
        width: context.contentWidth,
        showBulletPoints: item.showBulletPoints === true,
        itemGap: ptToPx(context.metrics.isDenseLayout ? 0.5 : 1),
        lineHeight: context.metrics.detailLineHeight,
      });
    }
    addBlockHitRegion(context, customItemAnchor(section.id, item.id), {
      x: context.contentX,
      y: itemStartY,
      width: context.contentWidth,
      height: context.cursorY - itemStartY,
    });
  });

  context.cursorY += context.metrics.itemMarginBottom;
  addBlockHitRegion(context, sectionAnchor(section.id), {
    x: context.contentX,
    y: sectionStartY,
    width: context.contentWidth,
    height: context.cursorY - sectionStartY,
  });
}
