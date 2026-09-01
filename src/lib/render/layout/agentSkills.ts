import { normalizeImageSource } from '@/lib/imageSource';
import { customItemAnchor, sectionAnchor } from '@/lib/previewAnchor';
import type { RenderImage } from '@/lib/render/types';
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
  createRectFill,
  layoutInlineItems,
  markBreakpoint,
  measureParagraph,
  ptToPx,
  withPointDelta,
} from './context';
import type { InlinePlacementItem, LayoutContext } from './context';
import { GITHUB_ICON, LINK_ICON } from './icons';
import { buildInlineMetadataItem } from './inline';

const ITEM_GAP = 9;
const DESCRIPTION_GAP = 2;
const METADATA_GAP = 2;
const SKILL_LOGO_GAP = 9;

function formatUrlLabel(value: string) {
  try {
    const url = new URL(value);
    const path = url.pathname === '/' ? '' : url.pathname.replace(/\/$/, '');
    return `${url.hostname.replace(/^www\./, '')}${path}`;
  } catch {
    return value;
  }
}

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

  return items;
}

function buildMetadataItems(context: LayoutContext, item: CustomSectionItem) {
  const { metrics } = context;
  const { theme } = context.data;
  const items: InlinePlacementItem[] = [];

  if (item.repoUrl) {
    items.push(buildInlineMetadataItem(context, {
      value: formatGitHubPath(item.repoUrl),
      href: theme.enableLinks === false ? undefined : sanitizeUrl(item.repoUrl),
      color: LIGHT_MUTED_TEXT_COLOR,
      fontSize: withPointDelta(theme.fontSize, -2),
      lineHeight: metrics.metadataLineHeight,
      iconBoxSize: metrics.inlineIconBoxSize,
      iconGap: INLINE_ICON_GAP,
      iconVisual: { paths: [createPath(GITHUB_ICON, 0, 0, metrics.inlineIconSize, metrics.inlineIconSize, LIGHT_MUTED_TEXT_COLOR)] },
    }));
  }

  if (item.url) {
    items.push(buildInlineMetadataItem(context, {
      value: formatUrlLabel(item.url),
      href: theme.enableLinks === false ? undefined : sanitizeUrl(item.url),
      color: LIGHT_MUTED_TEXT_COLOR,
      fontSize: withPointDelta(theme.fontSize, -2),
      lineHeight: metrics.metadataLineHeight,
      iconBoxSize: metrics.inlineIconBoxSize,
      iconGap: INLINE_ICON_LINK_GAP,
      marginLeft: items.length > 0 ? INLINE_METADATA_GAP : 0,
      iconVisual: { paths: [createPath(LINK_ICON, 0, 0, metrics.inlineIconSize, metrics.inlineIconSize, LIGHT_MUTED_TEXT_COLOR)] },
    }));
  }

  return items;
}

function addSkillLogo(
  context: LayoutContext,
  item: CustomSectionItem,
  x: number,
  y: number,
  size: number,
) {
  const logo = item.showLogo === false ? undefined : normalizeImageSource(item.repoAvatarUrl);
  if (logo) {
    context.drawOps.push({
      kind: 'image',
      x,
      y,
      width: size,
      height: size,
      src: logo,
      radius: size * 0.22,
      fit: 'cover',
    } satisfies RenderImage);
    return;
  }

  context.drawOps.push(
    createRectFill(
      { x, y, width: size, height: size },
      '#f9fafb',
      '#e5e7eb',
      ptToPx(0.5),
      size * 0.22,
    ),
    createPath(
      GITHUB_ICON,
      x + size * 0.25,
      y + size * 0.25,
      size * 0.5,
      size * 0.5,
      LIGHT_MUTED_TEXT_COLOR,
    ),
  );
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
    const showLogo = item.showLogo !== false;
    const logoSize = context.metrics.isDenseLayout ? 24 : 28;
    const contentX = context.contentX + (showLogo ? logoSize + SKILL_LOGO_GAP : 0);
    const contentWidth = context.contentWidth - (contentX - context.contentX);
    const heading = layoutInlineItems(buildHeadingItems(context, item), {
      x: contentX,
      y: context.cursorY,
      maxWidth: contentWidth,
      rowGap: 0,
    });
    context.cursorY += heading.height;

    if (item.description.length > 0) {
      context.cursorY += DESCRIPTION_GAP;
      addDescriptionLines(context, item.description, {
        x: contentX,
        width: contentWidth,
        showBulletPoints: item.showBulletPoints === true,
        itemGap: ptToPx(context.metrics.isDenseLayout ? 0.5 : 1),
        lineHeight: context.metrics.detailLineHeight,
      });
    }

    const metadataItems = buildMetadataItems(context, item);
    if (metadataItems.length > 0) {
      context.cursorY += METADATA_GAP;
      const metadata = layoutInlineItems(metadataItems, {
        x: contentX,
        y: context.cursorY,
        maxWidth: contentWidth,
        rowGap: 0,
      });
      context.cursorY += metadata.height;
    }

    if (showLogo) {
      addSkillLogo(context, item, context.contentX, itemStartY, logoSize);
      context.cursorY = Math.max(context.cursorY, itemStartY + logoSize);
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
