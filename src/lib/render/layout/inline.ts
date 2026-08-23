import type { RenderImage } from '@/lib/render/types';
import { normalizeImageSource } from '@/lib/imageSource';
import { formatProofRefLabel, isSafePdfUrl, sanitizeUrl } from '@/lib/resumeUtils';
import { resolveSkillLogo, type SkillLogoMeta } from '@/lib/skillLogo';
import type { ProjectProof, SkillItem } from '@/types';
import { DEFAULT_TEXT_COLOR, LARGE_PARAGRAPH_WIDTH, LIGHT_MUTED_TEXT_COLOR, addParagraph, buildParagraphSpec, createMarkdownSegments, createPath, createPlainSegments, createRectFill, measureParagraph, mergeSegmentGroups, ptToPx, withPointDelta } from './context';
import type { ContactVisual, InlinePlacementItem, LayoutContext } from './context';
import { pushVisualPaths } from './icons';

const BORDER_LIGHT = '#e5e7eb';

const BACKGROUND_LIGHT = '#f9fafb';

const DENSE_TECHNOLOGY_PILL_HORIZONTAL_PADDING = 6;

const DEFAULT_TECHNOLOGY_PILL_HORIZONTAL_PADDING = 7;

const TECHNOLOGY_PILL_ICON_GAP = 2;

const SKILL_ENTRY_ICON_GAP = 5;

const DENSE_SKILL_ENTRY_DIVIDER_SPACING = 4;

const DEFAULT_SKILL_ENTRY_DIVIDER_SPACING = 6;

const DENSE_SKILL_ENTRY_GAP = 9;

const DEFAULT_SKILL_ENTRY_GAP = 12;

export function getTechnologyPillIconWidth(iconBoxSize: number, hasIcon: boolean) {
  return hasIcon ? iconBoxSize + TECHNOLOGY_PILL_ICON_GAP : 0;
}

function pushSkillLogo(
  context: LayoutContext,
  logo: SkillLogoMeta,
  x: number,
  y: number,
  size: number,
) {
  const sourceToOutputScale = Math.min(
    size / logo.viewBox.width,
    size / logo.viewBox.height,
  );

  for (const path of logo.paths) {
    context.drawOps.push(
      createPath(
        path.d,
        x,
        y,
        size,
        size,
        path.fill,
        path.stroke,
        path.strokeWidth ? path.strokeWidth * sourceToOutputScale : undefined,
        path.strokeLineCap,
        logo.viewBox,
      ),
    );
  }
}

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
  icon: SkillLogoMeta | undefined,
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
  const iconBoxWidth = getTechnologyPillIconWidth(metrics.inlineIconBoxSize, Boolean(icon));
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
        pushSkillLogo(
          context,
          icon,
          cursorX,
          y + (pillHeight - metrics.inlineIconSize) / 2,
          metrics.inlineIconSize,
        );
        cursorX += iconBoxWidth;
      }

      addParagraph(context, {
        ...textSpec,
        x: cursorX,
        y: y + (pillHeight - textSize.height) / 2,
      });
    },
  };
}

function getSkillEntryStyle(level: SkillItem['level']) {
  switch (level) {
    case 'core':
      return {
        color: '#111827',
        fontWeight: 600 as const,
        contextColor: '#4b5563',
        dividerColor: '#d1d5db',
      };
    case 'proficient':
      return {
        color: '#374151',
        fontWeight: 500 as const,
        contextColor: '#6b7280',
        dividerColor: '#e5e7eb',
      };
    case 'familiar':
      return {
        color: '#6b7280',
        fontWeight: 400 as const,
        contextColor: LIGHT_MUTED_TEXT_COLOR,
        dividerColor: '#d1d5db',
      };
  }
}

export function buildSkillEntry(
  context: LayoutContext,
  item: SkillItem,
): InlinePlacementItem {
  const { metrics } = context;
  const { theme } = context.data;
  const entryStyle = getSkillEntryStyle(item.level);
  const labelSpec = buildParagraphSpec(
    0,
    0,
    LARGE_PARAGRAPH_WIDTH,
    createPlainSegments(item.name, {
      color: entryStyle.color,
      fontWeight: entryStyle.fontWeight,
    }),
    {
      fontFamily: theme.fontFamily,
      fontSize: withPointDelta(theme.fontSize, -(metrics.isDenseLayout ? 1 : 0.5)),
      lineHeight: metrics.capsuleLabelLineHeight,
      color: entryStyle.color,
    },
  );
  const labelSize = measureParagraph(context, labelSpec);
  const contextSpec = item.showContext !== false && item.context
    ? buildParagraphSpec(
        0,
        0,
        LARGE_PARAGRAPH_WIDTH,
        createPlainSegments(item.context, { color: entryStyle.contextColor }),
        {
          fontFamily: theme.fontFamily,
          fontSize: withPointDelta(theme.fontSize, -(metrics.isDenseLayout ? 2.5 : 1.5)),
          lineHeight: metrics.capsuleContextLineHeight,
          color: entryStyle.contextColor,
        },
      )
    : null;
  const contextSize = contextSpec ? measureParagraph(context, contextSpec) : null;
  const customLogo = item.showLogo === false ? undefined : normalizeImageSource(item.logo);
  const logo = item.showLogo === false || customLogo ? undefined : resolveSkillLogo(item.name);
  const gapAfterLogo = customLogo || logo ? SKILL_ENTRY_ICON_GAP : 0;
  const dividerSpacing = contextSize
    ? metrics.isDenseLayout
      ? DENSE_SKILL_ENTRY_DIVIDER_SPACING
      : DEFAULT_SKILL_ENTRY_DIVIDER_SPACING
    : 0;
  const dividerWidth = contextSize ? ptToPx(1) : 0;
  const iconSize = withPointDelta(theme.fontSize, -1);
  const iconWidth = customLogo || logo ? iconSize : 0;
  const entryGap = metrics.isDenseLayout
    ? DENSE_SKILL_ENTRY_GAP
    : DEFAULT_SKILL_ENTRY_GAP;
  const width =
    iconWidth +
    gapAfterLogo +
    labelSize.width +
    (contextSize ? dividerSpacing * 2 + dividerWidth + contextSize.width : 0) +
    entryGap;
  const height = Math.max(
    metrics.skillCapsuleMinHeight,
    labelSize.height,
    contextSize?.height ?? 0,
    theme.fontSize,
  );

  return {
    width,
    height,
    place: (x: number, y: number) => {
      let cursorX = x;
      const centerY = y + height / 2;

      if (customLogo) {
        context.drawOps.push({
          kind: 'image',
          x: cursorX,
          y: centerY - iconSize / 2,
          width: iconSize,
          height: iconSize,
          src: customLogo,
          fit: 'contain',
        } satisfies RenderImage);
        cursorX += iconSize + gapAfterLogo;
      } else if (logo) {
        pushSkillLogo(
          context,
          logo,
          cursorX,
          centerY - iconSize / 2,
          iconSize,
        );
        cursorX += iconSize + gapAfterLogo;
      }

      addParagraph(context, {
        ...labelSpec,
        x: cursorX,
        y: y + (height - labelSize.height) / 2,
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
            entryStyle.dividerColor,
          ),
        );
        cursorX += dividerWidth + dividerSpacing;
        addParagraph(context, {
          ...contextSpec,
          x: cursorX,
          y: y + (height - contextSize.height) / 2,
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
