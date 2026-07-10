import type { RenderImage } from '@/lib/render/types';
import { formatProofRefLabel, isSafePdfUrl, sanitizeUrl } from '@/lib/resumeUtils';
import { resolveSkillLogo } from '@/lib/skillLogo';
import type { ProjectProof, SkillItem } from '@/types';
import { BACKGROUND_MUTED, DEFAULT_TEXT_COLOR, LARGE_PARAGRAPH_WIDTH, LIGHT_MUTED_TEXT_COLOR, addParagraph, buildParagraphSpec, createMarkdownSegments, createPath, createPlainSegments, createRectFill, measureParagraph, mergeSegmentGroups, ptToPx, withPointDelta } from './context';
import type { ContactVisual, InlinePlacementItem, LayoutContext } from './context';
import { pushVisualPaths } from './icons';

const BORDER_LIGHT = '#e5e7eb';

const BACKGROUND_LIGHT = '#f9fafb';

const DENSE_TECHNOLOGY_PILL_HORIZONTAL_PADDING = 6;

const DEFAULT_TECHNOLOGY_PILL_HORIZONTAL_PADDING = 7;

const DENSE_SKILL_CAPSULE_HORIZONTAL_PADDING = 5.5;

const DEFAULT_SKILL_CAPSULE_HORIZONTAL_PADDING = 7.5;

const SKILL_CAPSULE_ICON_GAP = 5;

const DENSE_SKILL_CAPSULE_DIVIDER_SPACING = 4;

const DEFAULT_SKILL_CAPSULE_DIVIDER_SPACING = 7;

const DENSE_SKILL_CAPSULE_TRAILING_WIDTH = 5;

const DEFAULT_SKILL_CAPSULE_TRAILING_WIDTH = 8;

export function buildInlineMetadataItem(
  context: LayoutContext,
  item: {
    value: string;
    href?: string;
    color: string;
    fontSize: number;
    lineHeight: number;
    iconBoxSize: number;
    iconGap: number;
    iconVisual: ContactVisual;
    marginLeft?: number;
    marginRight?: number;
  },
) {
  const safeHref = item.href ? sanitizeUrl(item.href) : undefined;
  const paragraphData = createPlainSegments(item.value, {
    color: item.color,
    href: safeHref && isSafePdfUrl(safeHref) ? safeHref : undefined,
  });
  const paragraphSpec = buildParagraphSpec(
    0,
    0,
    LARGE_PARAGRAPH_WIDTH,
    paragraphData,
    {
      fontFamily: context.data.theme.fontFamily,
      fontSize: item.fontSize,
      lineHeight: item.lineHeight,
      color: item.color,
      linkColor: item.color,
    },
  );
  const textSize = measureParagraph(context, paragraphSpec);
  const width = (item.marginLeft ?? 0) + item.iconBoxSize + item.iconGap + textSize.width + (item.marginRight ?? 0);
  const height = Math.max(item.iconBoxSize, textSize.height);

  return {
    width,
    height,
    place: (x: number, y: number) => {
      const iconX = x + (item.marginLeft ?? 0);
      const iconY = y + (height - item.iconBoxSize) / 2;
      pushVisualPaths(context, iconX, iconY, item.iconVisual);
      addParagraph(context, {
        ...paragraphSpec,
        x: iconX + item.iconBoxSize + item.iconGap,
        y: y + (height - textSize.height) / 2,
      });
    },
  } satisfies InlinePlacementItem;
}

export function buildTechnologyPill(
  context: LayoutContext,
  label: string,
  icon: { svgPath: string; color: string } | undefined,
  muted: boolean,
): InlinePlacementItem {
  const { metrics } = context;
  const { theme } = context.data;
  const fontSize = withPointDelta(theme.fontSize, -(metrics.isDenseLayout ? 2.5 : 2));
  const textColor = muted ? LIGHT_MUTED_TEXT_COLOR : '#4b5563';
  const textData = createPlainSegments(label, { color: textColor });
  const textSpec = buildParagraphSpec(
    0,
    0,
    LARGE_PARAGRAPH_WIDTH,
    textData,
    {
      fontFamily: theme.fontFamily,
      fontSize,
      lineHeight: metrics.capsuleLineHeight,
      color: textColor,
    },
  );
  const textSize = measureParagraph(context, textSpec);
  const horizontalPadding = metrics.isDenseLayout
    ? DENSE_TECHNOLOGY_PILL_HORIZONTAL_PADDING
    : DEFAULT_TECHNOLOGY_PILL_HORIZONTAL_PADDING;
  const marginRight = metrics.isDenseLayout ? 3 : 4;
  const marginBottom = metrics.isDenseLayout ? 1 : 2;
  const iconBoxWidth = icon ? metrics.inlineIconBoxSize + 2 : 0;
  const width = horizontalPadding * 2 + iconBoxWidth + textSize.width + marginRight;
  const height = Math.max(metrics.technologyPillMinHeight, textSize.height) + marginBottom;

  return {
    width,
    height,
    place: (x: number, y: number) => {
      const pillHeight = height - marginBottom;
      context.drawOps.push(
        createRectFill(
          { x, y, width: width - marginRight, height: pillHeight },
          BACKGROUND_LIGHT,
          BORDER_LIGHT,
          0.5,
          metrics.isDenseLayout ? 7 : 8,
        ),
      );

      let cursorX = x + horizontalPadding;
      if (icon) {
        context.drawOps.push(
          createPath(
            icon.svgPath,
            cursorX,
            y + (pillHeight - metrics.inlineIconSize) / 2,
            metrics.inlineIconSize,
            metrics.inlineIconSize,
            icon.color,
          ),
        );
        cursorX += metrics.inlineIconBoxSize;
      }

      addParagraph(context, {
        ...textSpec,
        x: cursorX,
        y: y + (pillHeight - textSize.height) / 2,
      });
    },
  };
}

function getSkillCapsuleStyle(level: SkillItem['level'], primaryColor: string) {
  switch (level) {
    case 'core':
      return {
        backgroundColor: '#ffffff',
        color: '#111827',
        borderColor: primaryColor,
        fontWeight: 600 as const,
        contextColor: '#4b5563',
        dividerColor: `${primaryColor}40`,
      };
    case 'proficient':
      return {
        backgroundColor: '#ffffff',
        color: '#4b5563',
        borderColor: '#d1d5db',
        fontWeight: 500 as const,
        contextColor: '#6b7280',
        dividerColor: '#e5e7eb',
      };
    case 'familiar':
      return {
        backgroundColor: BACKGROUND_MUTED,
        color: '#6b7280',
        borderColor: 'transparent',
        fontWeight: 400 as const,
        contextColor: LIGHT_MUTED_TEXT_COLOR,
        dividerColor: '#d1d5db',
      };
  }
}

export function buildSkillCapsule(
  context: LayoutContext,
  item: SkillItem,
): InlinePlacementItem {
  const { metrics } = context;
  const { theme } = context.data;
  const capsuleStyle = getSkillCapsuleStyle(item.level, theme.primaryColor);
  const labelSpec = buildParagraphSpec(
    0,
    0,
    LARGE_PARAGRAPH_WIDTH,
    createPlainSegments(item.name, {
      color: capsuleStyle.color,
      fontWeight: capsuleStyle.fontWeight,
    }),
    {
      fontFamily: theme.fontFamily,
      fontSize: withPointDelta(theme.fontSize, -(metrics.isDenseLayout ? 1 : 0.5)),
      lineHeight: metrics.capsuleLabelLineHeight,
      color: capsuleStyle.color,
    },
  );
  const labelSize = measureParagraph(context, labelSpec);
  const contextSpec = item.showContext !== false && item.context
    ? buildParagraphSpec(
        0,
        0,
        LARGE_PARAGRAPH_WIDTH,
        createPlainSegments(item.context, { color: capsuleStyle.contextColor }),
        {
          fontFamily: theme.fontFamily,
          fontSize: withPointDelta(theme.fontSize, -(metrics.isDenseLayout ? 2.5 : 1.5)),
          lineHeight: metrics.capsuleContextLineHeight,
          color: capsuleStyle.contextColor,
        },
      )
    : null;
  const contextSize = contextSpec ? measureParagraph(context, contextSpec) : null;
  const logo = item.showLogo === false ? undefined : item.logo ? null : resolveSkillLogo(item.name);
  const customLogo = item.showLogo === false ? undefined : item.logo;
  const basePadding = metrics.isDenseLayout
    ? DENSE_SKILL_CAPSULE_HORIZONTAL_PADDING
    : DEFAULT_SKILL_CAPSULE_HORIZONTAL_PADDING;
  const gapAfterLogo = customLogo || logo ? SKILL_CAPSULE_ICON_GAP : 0;
  const dividerSpacing = contextSize
    ? metrics.isDenseLayout
      ? DENSE_SKILL_CAPSULE_DIVIDER_SPACING
      : DEFAULT_SKILL_CAPSULE_DIVIDER_SPACING
    : 0;
  const dividerWidth = contextSize ? ptToPx(1) : 0;
  const iconSize = withPointDelta(theme.fontSize, -1);
  const iconWidth = customLogo || logo ? iconSize : 0;
  const trailingWidth = metrics.isDenseLayout
    ? DENSE_SKILL_CAPSULE_TRAILING_WIDTH
    : DEFAULT_SKILL_CAPSULE_TRAILING_WIDTH;
  const width =
    basePadding * 2 +
    iconWidth +
    gapAfterLogo +
    labelSize.width +
    (contextSize ? dividerSpacing * 2 + dividerWidth + contextSize.width : 0) +
    trailingWidth;
  const marginBottom = ptToPx(metrics.isDenseLayout ? 1 : 2.5);
  const height = Math.max(
    metrics.skillCapsuleMinHeight,
    labelSize.height,
    contextSize?.height ?? 0,
    theme.fontSize,
  ) + marginBottom;

  return {
    width,
    height,
    place: (x: number, y: number) => {
      const capsuleHeight = height - marginBottom;
      const capsuleWidth = width - trailingWidth;
      context.drawOps.push(
        createRectFill(
          { x, y, width: capsuleWidth, height: capsuleHeight },
          capsuleStyle.backgroundColor,
          capsuleStyle.borderColor,
          1,
          100,
        ),
      );

      let cursorX = x + basePadding;
      const centerY = y + capsuleHeight / 2;

      if (customLogo) {
        context.drawOps.push({
          kind: 'image',
          x: cursorX,
          y: centerY - iconSize / 2,
          width: iconSize,
          height: iconSize,
          src: customLogo,
        } satisfies RenderImage);
        cursorX += iconSize + gapAfterLogo;
      } else if (logo) {
        context.drawOps.push(
          createPath(
            logo.svgPath,
            cursorX,
            centerY - iconSize / 2,
            iconSize,
            iconSize,
            logo.color,
          ),
        );
        cursorX += iconSize + gapAfterLogo;
      }

      addParagraph(context, {
        ...labelSpec,
        x: cursorX,
        y: y + (capsuleHeight - labelSize.height) / 2,
      });
      cursorX += labelSize.width;

      if (contextSpec && contextSize) {
        cursorX += dividerSpacing;
        context.drawOps.push(
          createRectFill(
            {
              x: cursorX,
              y: centerY - theme.fontSize / 2,
              width: dividerWidth,
              height: theme.fontSize,
            },
            capsuleStyle.dividerColor,
          ),
        );
        cursorX += dividerWidth + dividerSpacing;
        addParagraph(context, {
          ...contextSpec,
          x: cursorX,
          y: y + (capsuleHeight - contextSize.height) / 2,
        });
      }
    },
  };
}

export function buildProofParagraph(
  summary: string,
  refs: ProjectProof['refs'],
  primaryColor: string,
) {
  const groups = [createMarkdownSegments(summary, primaryColor, DEFAULT_TEXT_COLOR)];
  for (const ref of refs) {
    const href = sanitizeUrl(ref.url);
    const label = ` ${formatProofRefLabel(ref)}`;
    groups.push(createPlainSegments(label, {
      color: LIGHT_MUTED_TEXT_COLOR,
      href: href && isSafePdfUrl(href) ? href : undefined,
      kind: href && isSafePdfUrl(href) ? 'link' : 'text',
    }));
  }
  return mergeSegmentGroups(groups);
}
