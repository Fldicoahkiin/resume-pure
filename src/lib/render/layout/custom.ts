import type { RenderImage } from '@/lib/render/types';
import { customItemAnchor, sectionAnchor } from '@/lib/previewAnchor';
import { formatCompactNumber, formatGitHubPath, inferCustomSectionType, sanitizeUrl } from '@/lib/resumeUtils';
import type { CustomSection, CustomSectionItem, Education, Experience, Project, SectionConfig, Skill } from '@/types';
import { addDescriptionLines, addSectionHeading } from './blocks';
import { DEFAULT_TEXT_COLOR, INLINE_ICON_GAP, INLINE_ICON_LINK_GAP, INLINE_METADATA_GAP, LARGE_PARAGRAPH_WIDTH, LIGHT_MUTED_TEXT_COLOR, MUTED_TEXT_COLOR, PROJECT_LOGO_GAP, ROW_GAP, STAR_COLOR, addBlockHitRegion, addParagraph, buildParagraphSpec, createPath, createPlainSegments, layoutInlineItems, markBreakpoint, measureParagraph, ptToPx, withPointDelta } from './context';
import type { InlinePlacementItem, LayoutContext } from './context';
import { addEducationSection } from './education';
import { addExperienceSection } from './experience';
import { GITHUB_ICON, LINK_ICON, STAR_ICON } from './icons';
import { buildInlineMetadataItem } from './inline';
import { addProjectSection } from './projects';
import { addSkillSection } from './skills';

const DENSE_CUSTOM_ITEM_EXTRA_GAP = 1;

const DEFAULT_CUSTOM_ITEM_EXTRA_GAP = 0.5;

function isProjectItem(value: CustomSection['items'][number]): value is Project {
  return 'name' in value || 'technologies' in value || 'proofs' in value;
}

function isExperienceItem(value: CustomSection['items'][number]): value is Experience {
  return 'company' in value || 'position' in value;
}

function isEducationItem(value: CustomSection['items'][number]): value is Education {
  return 'school' in value || 'degree' in value || 'major' in value;
}

function isSkillGroup(value: CustomSection['items'][number]): value is Skill {
  return 'category' in value && Array.isArray(value.items);
}

function isCustomSectionItem(value: CustomSection['items'][number]): value is CustomSectionItem {
  return (
    'title' in value ||
    'subtitle' in value ||
    'date' in value ||
    'url' in value ||
    'repoUrl' in value
  );
}

function addGenericCustomItem(context: LayoutContext, section: SectionConfig, item: CustomSectionItem) {
  const { metrics } = context;
  const { theme } = context.data;
  const itemStartY = context.cursorY;
  const hasLogo = item.showLogo !== false && Boolean(item.repoAvatarUrl);
  const logoSize = metrics.isDenseLayout ? 20 : 24;
  const blockX = context.contentX + (hasLogo ? logoSize + PROJECT_LOGO_GAP : 0);
  const blockWidth = context.contentWidth - (hasLogo ? logoSize + PROJECT_LOGO_GAP : 0);
  const dateSpec = item.date
    ? buildParagraphSpec(
        0,
        0,
        LARGE_PARAGRAPH_WIDTH,
        createPlainSegments(item.date, { color: '#666666' }),
        {
          fontFamily: theme.fontFamily,
          fontSize: withPointDelta(theme.fontSize, -1),
          lineHeight: metrics.metadataLineHeight,
          color: '#666666',
        },
      )
    : null;
  const dateSize = dateSpec ? measureParagraph(context, dateSpec) : null;
  const titleSpec = buildParagraphSpec(
    blockX,
    context.cursorY,
    dateSize ? Math.max(blockWidth - dateSize.width - ROW_GAP, blockWidth * 0.55) : blockWidth,
    createPlainSegments(item.title || 'Untitled', { color: DEFAULT_TEXT_COLOR, fontWeight: 700 }),
    {
      fontFamily: theme.fontFamily,
      fontSize: theme.fontSize,
      lineHeight: metrics.headingLineHeight,
      color: DEFAULT_TEXT_COLOR,
    },
  );
  const titleSize = addParagraph(context, titleSpec);
  if (dateSpec && dateSize) {
    addParagraph(context, {
      ...dateSpec,
      x: context.contentX + context.contentWidth - dateSize.width,
      y: context.cursorY,
    });
  }

  if (hasLogo) {
    context.drawOps.push({
      kind: 'image',
      x: context.contentX,
      y: itemStartY,
      width: logoSize,
      height: logoSize,
      src: item.repoAvatarUrl || '',
      radius: logoSize / 2,
    } satisfies RenderImage);
  }

  context.cursorY += Math.max(titleSize.height, dateSize?.height ?? 0, hasLogo ? logoSize : 0);

  const metaItems: InlinePlacementItem[] = [];
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
    metaItems.push({
      width: subtitleSize.width,
      height: subtitleSize.height,
      place: (x, y) => addParagraph(context, { ...subtitleSpec, x, y }),
    });
  }
  if (item.repoUrl) {
    metaItems.push(
      buildInlineMetadataItem(context, {
        value: formatGitHubPath(item.repoUrl),
        href: theme.enableLinks === false ? undefined : sanitizeUrl(item.repoUrl),
        color: LIGHT_MUTED_TEXT_COLOR,
        fontSize: withPointDelta(theme.fontSize, -2),
        lineHeight: metrics.metadataLineHeight,
        iconBoxSize: metrics.inlineIconBoxSize,
        iconGap: INLINE_ICON_GAP,
        marginLeft: item.subtitle ? INLINE_METADATA_GAP : 0,
        iconVisual: { paths: [createPath(GITHUB_ICON, 0, 0, metrics.inlineIconSize, metrics.inlineIconSize, LIGHT_MUTED_TEXT_COLOR)] },
      }),
    );
  }
  if (item.showStars !== false && typeof item.repoStars === 'number' && item.repoStars > 0) {
    metaItems.push(
      buildInlineMetadataItem(context, {
        value: formatCompactNumber(item.repoStars),
        color: STAR_COLOR,
        fontSize: withPointDelta(theme.fontSize, -2),
        lineHeight: metrics.metadataLineHeight,
        iconBoxSize: metrics.inlineIconBoxSize,
        iconGap: INLINE_ICON_GAP,
        marginLeft: INLINE_METADATA_GAP,
        iconVisual: { paths: [createPath(STAR_ICON, 0, 0, metrics.inlineIconSize, metrics.inlineIconSize, STAR_COLOR)] },
      }),
    );
  }
  if (item.url) {
    metaItems.push(
      buildInlineMetadataItem(context, {
        value: item.url,
        href: theme.enableLinks === false ? undefined : sanitizeUrl(item.url),
        color: LIGHT_MUTED_TEXT_COLOR,
        fontSize: withPointDelta(theme.fontSize, -2),
        lineHeight: metrics.metadataLineHeight,
        iconBoxSize: metrics.inlineIconBoxSize,
        iconGap: INLINE_ICON_LINK_GAP,
        marginLeft: INLINE_METADATA_GAP,
        iconVisual: { paths: [createPath(LINK_ICON, 0, 0, metrics.inlineIconSize, metrics.inlineIconSize, LIGHT_MUTED_TEXT_COLOR)] },
      }),
    );
  }

  if (metaItems.length > 0) {
    const metaLayout = layoutInlineItems(metaItems, {
      x: blockX,
      y: context.cursorY + ptToPx(1),
      maxWidth: blockWidth,
      rowGap: 0,
    });
    context.cursorY += ptToPx(1) + metaLayout.height;
  }

  addDescriptionLines(context, item.description, {
    x: blockX,
    width: blockWidth,
    showBulletPoints: item.showBulletPoints !== false,
    itemGap: ptToPx(metrics.isDenseLayout ? 1 : 1.5),
    lineHeight: metrics.detailLineHeight,
  });
  addBlockHitRegion(context, customItemAnchor(section.id, item.id), {
    x: context.contentX,
    y: itemStartY,
    width: context.contentWidth,
    height: context.cursorY - itemStartY,
  });
  context.cursorY +=
    metrics.itemMarginBottom +
    ptToPx(metrics.isDenseLayout ? DENSE_CUSTOM_ITEM_EXTRA_GAP : DEFAULT_CUSTOM_ITEM_EXTRA_GAP);
}

export function addCustomSection(context: LayoutContext, section: SectionConfig, customSection: CustomSection) {
  const customType = inferCustomSectionType(customSection);

  if (customType === 'experience') {
    addExperienceSection(
      context,
      section,
      customSection.items.filter(isExperienceItem),
    );
    return;
  }

  if (customType === 'education') {
    addEducationSection(
      context,
      section,
      customSection.items.filter(isEducationItem),
    );
    return;
  }

  if (customType === 'skill') {
    addSkillSection(
      context,
      section,
      customSection.items.filter(isSkillGroup),
    );
    return;
  }

  if (customType === 'project') {
    addProjectSection(
      context,
      section,
      customSection.items.filter(isProjectItem),
    );
    return;
  }

  const customItems = customSection.items.filter(isCustomSectionItem);
  if (customItems.length === 0) return;
  markBreakpoint(context);
  const sectionStartY = context.cursorY;
  addSectionHeading(
    context,
    sectionAnchor(section.id),
    section.title || context.options.translations.customSection,
  );
  customItems.forEach((item, index) => {
    if (index > 0) markBreakpoint(context);
    addGenericCustomItem(context, section, item);
  });
  addBlockHitRegion(context, sectionAnchor(section.id), {
    x: context.contentX,
    y: sectionStartY,
    width: context.contentWidth,
    height: context.cursorY - sectionStartY,
  });
}

