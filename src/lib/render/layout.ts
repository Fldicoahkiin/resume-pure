import { getResumeLayoutMetrics } from '@/components/resume/layoutMetrics';
import type { ResumeLayoutMetrics } from '@/components/resume/layoutTypes';
import { getPaperDimensions } from '@/lib/paper';
import {
  buildParagraphSegments,
  extractParagraphSemantics,
  layoutParagraph,
} from '@/lib/render/paragraph';
import type {
  LayoutDocument,
  ParagraphSpec,
  RenderBuildOptions,
  RenderDrawOp,
  RenderHitRegion,
  RenderImage,
  RenderLinkRegion,
  RenderParagraph,
  RenderPath,
  RenderRect,
  RenderRectFill,
  RenderTextSegment,
  SemanticTextRun,
} from '@/lib/render/types';
import {
  customContactAnchor,
  customItemAnchor,
  educationAnchor,
  experienceAnchor,
  personalInfoFieldAnchor,
  projectAnchor,
  projectProofAnchor,
  sectionAnchor,
  skillAnchor,
  skillItemAnchor,
} from '@/lib/previewAnchor';
import {
  formatCompactNumber,
  formatGitHubPath,
  formatProofRefLabel,
  getDateRange,
  inferCustomSectionType,
  isSafePdfUrl,
  sanitizeUrl,
} from '@/lib/resumeUtils';
import { resolveSkillLogo } from '@/lib/skillLogo';
import type {
  ContactItem,
  CustomSection,
  CustomSectionItem,
  Education,
  Experience,
  Project,
  ProjectProof,
  ResumeData,
  SectionConfig,
  Skill,
  SkillItem,
} from '@/types';
import type { CanvasKit, FontMgr } from 'canvaskit-wasm';

const LARGE_PARAGRAPH_WIDTH = 4096;
const DEFAULT_TEXT_COLOR = '#374151';
const MUTED_TEXT_COLOR = '#6b7280';
const LIGHT_MUTED_TEXT_COLOR = '#9ca3af';
const HEADING_TEXT_COLOR = '#333333';
const BORDER_LIGHT = '#e5e7eb';
const BACKGROUND_LIGHT = '#f9fafb';
const BACKGROUND_MUTED = '#f3f4f6';
const STAR_COLOR = '#d97706';
const POINT_TO_CSS_PIXEL = 96 / 72;
const TOP_BAR_MARGIN = 0;
const ROW_GAP = 8;
const INLINE_ICON_GAP = 2;
const INLINE_ICON_LINK_GAP = 3;
const INLINE_METADATA_GAP = 6;
const CONTACT_ITEM_GAP = 12;
const BULLET_GAP = 4;
const BULLET_COLUMN_WIDTH = 8;
const PROJECT_LOGO_GAP = 9;
const CONTACT_TOP_GAP_DENSE = 3;
const CONTACT_TOP_GAP_DEFAULT = 4;
const SUMMARY_TOP_GAP_DENSE = 4;
const SUMMARY_TOP_GAP_DEFAULT = 6;
const HEADER_FALLBACK_ICON = 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z';
const CONTACT_MAIL_ICON = 'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z';
const CONTACT_PHONE_ICON = 'M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z';
const CONTACT_GITHUB_ICON = 'M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z';
const CONTACT_LINKEDIN_ICON = 'M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6zM2 9h4v12H2z M4 6a2 2 0 110-4 2 2 0 010 4z';
const CONTACT_LOCATION_ICON = 'M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z M12 13a3 3 0 100-6 3 3 0 000 6z';
const CONTACT_GLOBE_OUTER_ICON = 'M12 2A10 10 0 1012 22A10 10 0 1012 2z';
const CONTACT_GLOBE_INNER_ICON = 'M12 2a14.5 14.5 0 000 20 14.5 14.5 0 000-20zM2 12h20';
const GITHUB_ICON = CONTACT_GITHUB_ICON;
const STAR_ICON = 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z';
const LINK_ICON = 'M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z';

type FontManager = FontMgr;

function ptToPx(value: number) {
  return value * POINT_TO_CSS_PIXEL;
}

function withPointDelta(base: number, delta: number) {
  return base + ptToPx(delta);
}

function getRenderLayoutMetrics(theme: ResumeData['theme']): ResumeLayoutMetrics {
  const metrics = getResumeLayoutMetrics(theme);

  return {
    ...metrics,
    sectionMarginBottom: ptToPx(metrics.sectionMarginBottom),
    headerMarginBottom: ptToPx(metrics.headerMarginBottom),
    pageHorizontalPadding: ptToPx(metrics.pageHorizontalPadding),
    pageTopPadding: ptToPx(metrics.pageTopPadding),
    pageBottomPadding: ptToPx(metrics.pageBottomPadding),
    topBarHeight: ptToPx(metrics.topBarHeight),
    itemMarginBottom: ptToPx(metrics.itemMarginBottom),
    sectionHeadingMarginBottom: ptToPx(metrics.sectionHeadingMarginBottom),
    skillCapsuleMinHeight: ptToPx(metrics.skillCapsuleMinHeight),
    technologyPillMinHeight: ptToPx(metrics.technologyPillMinHeight),
    inlineIconSize: ptToPx(metrics.inlineIconSize),
    inlineIconBoxSize: ptToPx(metrics.inlineIconBoxSize),
    contactIconSize: ptToPx(metrics.contactIconSize),
    contactIconBoxSize: ptToPx(metrics.contactIconBoxSize),
  };
}

interface LayoutContext {
  CanvasKitModule: CanvasKit;
  fontManager: FontManager;
  data: ResumeData;
  options: RenderBuildOptions;
  metrics: ResumeLayoutMetrics;
  width: number;
  contentX: number;
  contentWidth: number;
  cursorY: number;
  drawOps: RenderDrawOp[];
  textRuns: SemanticTextRun[];
  linkRegions: RenderLinkRegion[];
  hitRegions: RenderHitRegion[];
}

interface MeasuredParagraph {
  width: number;
  height: number;
}

interface InlinePlacementItem {
  width: number;
  height: number;
  place: (x: number, y: number) => void;
}

interface ContactVisual {
  paths: RenderPath[];
}

function cloneRect(rect: RenderRect): RenderRect {
  return { ...rect };
}

function createRectFill(rect: RenderRect, fill?: string, stroke?: string, strokeWidth?: number, radius?: number): RenderRectFill {
  return {
    kind: 'rect',
    rect: cloneRect(rect),
    fill,
    stroke,
    strokeWidth,
    radius,
  };
}

function createPath(path: string, x: number, y: number, width: number, height: number, fill?: string, stroke?: string, strokeWidth?: number): RenderPath {
  return {
    kind: 'path',
    path,
    x,
    y,
    width,
    height,
    fill,
    stroke,
    strokeWidth,
  };
}

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

function createPlainSegments(
  text: string,
  options: {
    fontWeight?: RenderTextSegment['fontWeight'];
    fontStyle?: RenderTextSegment['fontStyle'];
    color?: string;
    backgroundColor?: string;
    href?: string;
    kind?: RenderTextSegment['kind'];
  } = {},
) {
  const kind = options.kind || (options.href ? 'link' : 'text');
  const segment: RenderTextSegment = {
    text,
    kind,
    href: options.href,
    start: 0,
    end: text.length,
    fontWeight: options.fontWeight ?? 400,
    fontStyle: options.fontStyle ?? 'normal',
    color: options.color,
    backgroundColor: options.backgroundColor,
  };

  return {
    rawText: text,
    segments: [segment],
  };
}

function createMarkdownSegments(
  text: string,
  primaryColor: string,
  baseColor: string,
): {
  rawText: string;
  segments: RenderTextSegment[];
} {
  const parsed = buildParagraphSegments(text);
  return {
    rawText: parsed.rawText,
    segments: parsed.segments.map((segment) => ({
      ...segment,
      color:
        segment.kind === 'link'
          ? primaryColor
          : segment.kind === 'code'
            ? '#1f2937'
            : baseColor,
      backgroundColor: segment.kind === 'code' ? BACKGROUND_MUTED : undefined,
    })),
  };
}

function mergeSegmentGroups(
  groups: Array<{
    rawText: string;
    segments: RenderTextSegment[];
  }>,
) {
  const segments: RenderTextSegment[] = [];
  let offset = 0;

  for (const group of groups) {
    for (const segment of group.segments) {
      segments.push({
        ...segment,
        start: offset + segment.start,
        end: offset + segment.end,
      });
    }
    offset += group.rawText.length;
  }

  return {
    rawText: groups.map((group) => group.rawText).join(''),
    segments,
  };
}

function measureParagraph(
  context: LayoutContext,
  paragraph: ParagraphSpec,
): MeasuredParagraph {
  const built = layoutParagraph(context.CanvasKitModule, context.fontManager, paragraph);
  const measured = {
    width: Math.ceil(Math.max(built.getLongestLine(), 0)),
    height: Math.ceil(Math.max(built.getHeight(), paragraph.fontSize * paragraph.lineHeight)),
  };
  built.delete();
  return measured;
}

function addParagraph(
  context: LayoutContext,
  paragraph: ParagraphSpec,
): MeasuredParagraph {
  const built = layoutParagraph(context.CanvasKitModule, context.fontManager, paragraph);
  const semantics = extractParagraphSemantics(context.CanvasKitModule, built, paragraph);
  const measured = {
    width: Math.ceil(Math.max(built.getLongestLine(), 0)),
    height: Math.ceil(Math.max(semantics.height, paragraph.fontSize * paragraph.lineHeight)),
  };

  context.drawOps.push({
    kind: 'paragraph',
    box: {
      x: paragraph.x,
      y: paragraph.y,
      width: paragraph.width,
      height: measured.height,
      paragraph,
    },
  } satisfies RenderParagraph);
  context.textRuns.push(...semantics.textRuns);
  context.linkRegions.push(...semantics.linkRegions);
  built.delete();

  return measured;
}

function layoutInlineItems(
  items: InlinePlacementItem[],
  options: {
    x: number;
    y: number;
    maxWidth: number;
    rowGap: number;
  },
) {
  const { x, y, maxWidth, rowGap } = options;
  let cursorX = x;
  let cursorY = y;
  let lineHeight = 0;
  let usedWidth = 0;

  for (const item of items) {
    if (cursorX > x && cursorX + item.width > x + maxWidth) {
      cursorX = x;
      cursorY += lineHeight + rowGap;
      lineHeight = 0;
    }

    item.place(cursorX, cursorY);
    cursorX += item.width;
    lineHeight = Math.max(lineHeight, item.height);
    usedWidth = Math.max(usedWidth, cursorX - x);
  }

  return {
    width: usedWidth,
    height: items.length === 0 ? 0 : cursorY - y + lineHeight,
  };
}

function createHitRegion(anchor: string, rect: RenderRect): RenderHitRegion {
  return {
    anchor,
    x: rect.x,
    y: rect.y,
    width: rect.width,
    height: rect.height,
  };
}

function buildParagraphSpec(
  x: number,
  y: number,
  width: number,
  paragraph: {
    rawText: string;
    segments: RenderTextSegment[];
  },
  style: {
    fontFamily: string;
    fontSize: number;
    lineHeight: number;
    color: string;
    align?: ParagraphSpec['align'];
    linkColor?: string;
  },
): ParagraphSpec {
  return {
    x,
    y,
    width,
    rawText: paragraph.rawText,
    segments: paragraph.segments,
    fontFamily: style.fontFamily,
    fontSize: style.fontSize,
    lineHeight: style.lineHeight,
    color: style.color,
    align: style.align,
    linkColor: style.linkColor,
  };
}

function getContactIconVisual(type: string, iconSize: number): ContactVisual {
  const normalized = type.toLowerCase();
  const strokeWidth = 1.5;

  if (normalized.includes('mail')) {
    return {
      paths: [
        createPath(CONTACT_MAIL_ICON, 0, 0, iconSize, iconSize, undefined, MUTED_TEXT_COLOR, strokeWidth),
      ],
    };
  }

  if (normalized.includes('phone')) {
    return {
      paths: [
        createPath(CONTACT_PHONE_ICON, 0, 0, iconSize, iconSize, undefined, MUTED_TEXT_COLOR, strokeWidth),
      ],
    };
  }

  if (normalized.includes('github')) {
    return {
      paths: [createPath(CONTACT_GITHUB_ICON, 0, 0, iconSize, iconSize, MUTED_TEXT_COLOR)],
    };
  }

  if (normalized.includes('linkedin')) {
    return {
      paths: [
        createPath(CONTACT_LINKEDIN_ICON, 0, 0, iconSize, iconSize, undefined, MUTED_TEXT_COLOR, strokeWidth),
      ],
    };
  }

  if (normalized.includes('map') || normalized.includes('location')) {
    return {
      paths: [
        createPath(CONTACT_LOCATION_ICON, 0, 0, iconSize, iconSize, undefined, MUTED_TEXT_COLOR, strokeWidth),
      ],
    };
  }

  if (normalized.includes('website') || normalized.includes('globe')) {
    return {
      paths: [
        createPath(CONTACT_GLOBE_OUTER_ICON, 0, 0, iconSize, iconSize, undefined, MUTED_TEXT_COLOR, strokeWidth),
        createPath(CONTACT_GLOBE_INNER_ICON, 0, 0, iconSize, iconSize, undefined, MUTED_TEXT_COLOR, strokeWidth),
      ],
    };
  }

  return {
    paths: [createPath(HEADER_FALLBACK_ICON, 0, 0, iconSize, iconSize, undefined, MUTED_TEXT_COLOR, strokeWidth)],
  };
}

function pushVisualPaths(context: LayoutContext, x: number, y: number, visual: ContactVisual) {
  for (const path of visual.paths) {
    context.drawOps.push({
      ...path,
      x: x + path.x,
      y: y + path.y,
    });
  }
}

function buildInlineMetadataItem(
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

function buildTechnologyPill(
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
  const horizontalPadding = metrics.isDenseLayout ? 5 : 6;
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

function buildSkillCapsule(
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
  const basePadding = metrics.isDenseLayout ? 4.5 : 6.5;
  const gapAfterLogo = customLogo || logo ? 4 : 0;
  const dividerSpacing = contextSize ? (metrics.isDenseLayout ? 3 : 6) : 0;
  const dividerWidth = contextSize ? ptToPx(1) : 0;
  const iconSize = withPointDelta(theme.fontSize, -1);
  const iconWidth = customLogo || logo ? iconSize : 0;
  const width =
    basePadding * 2 +
    iconWidth +
    gapAfterLogo +
    labelSize.width +
    (contextSize ? dividerSpacing * 2 + dividerWidth + contextSize.width : 0) +
    (metrics.isDenseLayout ? 4 : 7);
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
      const capsuleWidth = width - (metrics.isDenseLayout ? 4 : 7);
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

function addBlockHitRegion(context: LayoutContext, anchor: string, rect: RenderRect) {
  context.hitRegions.push(createHitRegion(anchor, rect));
}

function addSectionHeading(context: LayoutContext, anchor: string, title: string) {
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
  context.cursorY += headingHeight + metrics.sectionHeadingMarginBottom;
}

function addDescriptionLines(
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

function buildProofParagraph(
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

function addHeader(context: LayoutContext) {
  const { data, metrics, width } = context;
  const { personalInfo, theme } = data;
  context.drawOps.push(
    createRectFill(
      { x: 0, y: TOP_BAR_MARGIN, width, height: metrics.topBarHeight },
      theme.primaryColor,
    ),
  );
  context.cursorY = metrics.topBarHeight + metrics.pageTopPadding;

  const headerStartY = context.cursorY;
  const nameSpec = buildParagraphSpec(
    context.contentX,
    context.cursorY,
    context.contentWidth,
    createPlainSegments(personalInfo.name, {
      color: theme.primaryColor,
      fontWeight: 700,
    }),
    {
      fontFamily: theme.fontFamily,
      fontSize: withPointDelta(theme.fontSize, 8),
      lineHeight: metrics.headingLineHeight,
      color: theme.primaryColor,
    },
  );
  const nameSize = addParagraph(context, nameSpec);
  context.cursorY += nameSize.height;

  if (personalInfo.title) {
    const titleGap = ptToPx(metrics.isDenseLayout ? 3 : 4);
    const titleSpec = buildParagraphSpec(
      context.contentX,
      context.cursorY + titleGap,
      context.contentWidth,
      createPlainSegments(personalInfo.title, { color: '#4b5563' }),
      {
        fontFamily: theme.fontFamily,
        fontSize: withPointDelta(theme.fontSize, 2),
        lineHeight: metrics.headingLineHeight,
        color: '#4b5563',
      },
    );
    const titleSize = addParagraph(context, titleSpec);
    context.cursorY += titleGap + titleSize.height;
  }

  if (personalInfo.summary) {
    const summaryGap = metrics.isDenseLayout ? SUMMARY_TOP_GAP_DENSE : SUMMARY_TOP_GAP_DEFAULT;
    const summarySpec = buildParagraphSpec(
      context.contentX,
      context.cursorY + summaryGap,
      context.contentWidth,
      createMarkdownSegments(personalInfo.summary, theme.primaryColor, DEFAULT_TEXT_COLOR),
      {
        fontFamily: theme.fontFamily,
        fontSize: withPointDelta(theme.fontSize, -1),
        lineHeight: metrics.detailLineHeight,
        color: DEFAULT_TEXT_COLOR,
        linkColor: theme.primaryColor,
      },
    );
    const summarySize = addParagraph(context, summarySpec);
    context.cursorY += summaryGap + summarySize.height;
  }

  const contacts = [
    {
      anchor: personalInfoFieldAnchor('email'),
      type: personalInfo.iconConfig?.emailIcon || 'mail',
      value: personalInfo.email,
      href: sanitizeUrl(personalInfo.email),
    },
    {
      anchor: personalInfoFieldAnchor('phone'),
      type: personalInfo.iconConfig?.phoneIcon || 'phone',
      value: personalInfo.phone,
      href: sanitizeUrl(personalInfo.phone),
    },
    {
      anchor: personalInfoFieldAnchor('location'),
      type: personalInfo.iconConfig?.locationIcon || 'map-pin',
      value: personalInfo.location,
      href: undefined,
    },
    {
      anchor: personalInfoFieldAnchor('website'),
      type: personalInfo.iconConfig?.websiteIcon || 'globe',
      value: personalInfo.website,
      href: sanitizeUrl(personalInfo.website),
    },
    {
      anchor: personalInfoFieldAnchor('linkedin'),
      type: personalInfo.iconConfig?.linkedinIcon || 'linkedin',
      value: personalInfo.linkedin,
      href: sanitizeUrl(personalInfo.linkedin),
    },
    {
      anchor: personalInfoFieldAnchor('github'),
      type: personalInfo.iconConfig?.githubIcon || 'github',
      value: personalInfo.github,
      href: sanitizeUrl(personalInfo.github),
    },
    ...(personalInfo.contacts || [])
      .filter((contact) => contact.value)
      .sort((left, right) => left.order - right.order)
      .map((contact: ContactItem) => ({
        anchor: customContactAnchor(contact.id),
        type: contact.type,
        value: contact.value,
        href: contact.href ? sanitizeUrl(contact.href) : sanitizeUrl(contact.value),
      })),
  ].filter((contact) => contact.value);

  const contactTopGap = personalInfo.summary
    ? metrics.isDenseLayout
      ? CONTACT_TOP_GAP_DENSE
      : CONTACT_TOP_GAP_DEFAULT
    : 1;
  const normalizedContactTopGap = ptToPx(contactTopGap);

  const contactItems = contacts.map((contact) => {
    const metadata = buildInlineMetadataItem(context, {
      value: contact.value || '',
      href: theme.enableLinks === false ? undefined : contact.href,
      color: '#4b5563',
      fontSize: withPointDelta(theme.fontSize, -1),
      lineHeight: metrics.metadataLineHeight,
      iconBoxSize: metrics.contactIconBoxSize,
      iconGap: 4,
      iconVisual: getContactIconVisual(contact.type || 'link', metrics.contactIconSize),
      marginRight: CONTACT_ITEM_GAP,
    });

    return {
      ...metadata,
      place: (x: number, y: number) => {
        metadata.place(x, y);
        addBlockHitRegion(context, contact.anchor, {
          x,
          y,
          width: metadata.width,
          height: metadata.height,
        });
      },
    } satisfies InlinePlacementItem;
  });

  const contactsLayout = layoutInlineItems(contactItems, {
    x: context.contentX,
    y: context.cursorY + normalizedContactTopGap,
    maxWidth: context.contentWidth,
    rowGap: 0,
  });

  context.cursorY += normalizedContactTopGap + contactsLayout.height;
  addBlockHitRegion(context, 'personalInfo', {
    x: context.contentX,
    y: headerStartY,
    width: context.contentWidth,
    height: context.cursorY - headerStartY,
  });
  context.cursorY += metrics.headerMarginBottom;
}

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

function buildProjectInlineItems(
  context: LayoutContext,
  project: Project,
) {
  const { metrics } = context;
  const { theme } = context.data;
  const items: InlinePlacementItem[] = [];
  const nameSpec = buildParagraphSpec(
    0,
    0,
    LARGE_PARAGRAPH_WIDTH,
    createPlainSegments(project.name, { color: '#111827', fontWeight: 700 }),
    {
      fontFamily: theme.fontFamily,
      fontSize: theme.fontSize,
      lineHeight: metrics.headingLineHeight,
      color: '#111827',
    },
  );
  const nameSize = measureParagraph(context, nameSpec);
  items.push({
    width: nameSize.width,
    height: nameSize.height,
    place: (x, y) => {
      addParagraph(context, { ...nameSpec, x, y });
    },
  });

  if (project.role) {
    const roleSpec = buildParagraphSpec(
      0,
      0,
      LARGE_PARAGRAPH_WIDTH,
      createPlainSegments(project.role, { color: MUTED_TEXT_COLOR }),
      {
        fontFamily: theme.fontFamily,
        fontSize: withPointDelta(theme.fontSize, -1),
        lineHeight: metrics.detailLineHeight,
        color: MUTED_TEXT_COLOR,
      },
    );
    const roleSize = measureParagraph(context, roleSpec);
    items.push({
      width: (metrics.isDenseLayout ? 4 : 6) + roleSize.width,
      height: roleSize.height,
      place: (x, y) => {
        addParagraph(context, { ...roleSpec, x: x + (metrics.isDenseLayout ? 4 : 6), y });
      },
    });
  }

  if (project.repoUrl) {
    items.push(
      buildInlineMetadataItem(context, {
        value: formatGitHubPath(project.repoUrl),
        href: theme.enableLinks === false ? undefined : sanitizeUrl(project.repoUrl),
        color: LIGHT_MUTED_TEXT_COLOR,
        fontSize: withPointDelta(theme.fontSize, -2),
        lineHeight: metrics.metadataLineHeight,
        iconBoxSize: metrics.inlineIconBoxSize,
        iconGap: INLINE_ICON_GAP,
        marginLeft: INLINE_METADATA_GAP,
        iconVisual: { paths: [createPath(GITHUB_ICON, 0, 0, metrics.inlineIconSize, metrics.inlineIconSize, LIGHT_MUTED_TEXT_COLOR)] },
      }),
    );
  }

  if (project.showStars !== false && typeof project.repoStars === 'number' && project.repoStars > 0) {
    items.push(
      buildInlineMetadataItem(context, {
        value: formatCompactNumber(project.repoStars),
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

  if (project.url) {
    items.push(
      buildInlineMetadataItem(context, {
        value: project.url,
        href: theme.enableLinks === false ? undefined : sanitizeUrl(project.url),
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

  return items;
}

function addProjectItem(context: LayoutContext, project: Project) {
  const { metrics, options } = context;
  const { theme } = context.data;
  const itemStartY = context.cursorY;
  const isCompact = project.layout === 'compact';
  const hasProjectDescription = project.description.some((line) => line.trim().length > 0);
  const projectProofs = project.proofs || [];
  const hasProjectLogo =
    project.showLogo !== false && Boolean(project.customLogo?.length || project.repoAvatarUrl?.length);
  const projectLogoSize = isCompact
    ? (metrics.isDenseLayout ? 20 : 24)
    : (metrics.isDenseLayout ? 28 : 36);
  const listTopMargin = ptToPx(
    metrics.isDenseLayout ? (isCompact ? 1 : 2) : (isCompact ? 1.5 : 3.5),
  );
  const descriptionGap = ptToPx(
    metrics.isDenseLayout ? (isCompact ? 1 : 1.5) : (isCompact ? 1.5 : 2.5),
  );
  const proofIndent = hasProjectLogo ? projectLogoSize + PROJECT_LOGO_GAP : 0;
  const dateText = getDateRange(project.startDate, project.endDate, project.current, options.translations.present);
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

  const contentX = context.contentX + (hasProjectLogo ? projectLogoSize + PROJECT_LOGO_GAP : 0);
  const contentWidth = context.contentWidth - (hasProjectLogo ? projectLogoSize + PROJECT_LOGO_GAP : 0);
  const headingItems = buildProjectInlineItems(context, project);
  const inlineWidth = Math.max(contentWidth - dateSize.width - (metrics.isDenseLayout ? 6 : 8), contentWidth * 0.55);
  const headingLayout = layoutInlineItems(headingItems, {
    x: contentX,
    y: context.cursorY,
    maxWidth: inlineWidth,
    rowGap: 0,
  });
  addParagraph(context, {
    ...dateSpec,
    x: context.contentX + context.contentWidth - dateSize.width,
    y: context.cursorY,
  });

  const blockTop = context.cursorY;
  const blockHeight = Math.max(headingLayout.height, dateSize.height, hasProjectLogo ? projectLogoSize : 0);

  if (hasProjectLogo) {
    context.drawOps.push({
      kind: 'image',
      x: context.contentX,
      y: blockTop,
      width: projectLogoSize,
      height: projectLogoSize,
      src: project.customLogo || project.repoAvatarUrl || '',
      radius: projectLogoSize / 2,
    } satisfies RenderImage);
  }

  context.cursorY += blockHeight;

  if (hasProjectDescription) {
    context.cursorY += listTopMargin;
    addDescriptionLines(context, project.description, {
      x: contentX,
      width: contentWidth,
      showBulletPoints: project.showBulletPoints !== false,
      itemGap: descriptionGap,
      lineHeight: metrics.detailLineHeight,
    });
  }

  if (project.showTechnologies !== false && project.technologies && project.technologies.length > 0) {
    const maxVisible = isCompact ? 4 : project.technologies.length;
    const pills = project.technologies.slice(0, maxVisible).map((technology) =>
      buildTechnologyPill(context, technology, resolveSkillLogo(technology), false),
    );
    if (project.technologies.length > maxVisible) {
      pills.push(buildTechnologyPill(context, `+${project.technologies.length - maxVisible}`, undefined, true));
    }
    const technologyLayout = layoutInlineItems(pills, {
      x: contentX,
      y: context.cursorY + listTopMargin,
      maxWidth: contentWidth,
      rowGap: 0,
    });
    context.cursorY += listTopMargin + technologyLayout.height;
  }

  if (project.showProofs !== false && projectProofs.length > 0) {
    context.cursorY += ptToPx(metrics.isDenseLayout ? 1.5 : (isCompact ? 2 : 2.5));
    const proofX = context.contentX + proofIndent;
    const proofWidth = context.contentWidth - proofIndent;

    for (const proof of projectProofs) {
      const proofStartY = context.cursorY;
      const bulletSpec = buildParagraphSpec(
        proofX,
        context.cursorY,
        BULLET_COLUMN_WIDTH,
        createPlainSegments('•', { color: LIGHT_MUTED_TEXT_COLOR }),
        {
          fontFamily: theme.fontFamily,
          fontSize: withPointDelta(theme.fontSize, -1),
          lineHeight: metrics.detailLineHeight,
          color: LIGHT_MUTED_TEXT_COLOR,
        },
      );
      const proofSpec = buildParagraphSpec(
        proofX + BULLET_COLUMN_WIDTH,
        context.cursorY,
        proofWidth - BULLET_COLUMN_WIDTH,
        buildProofParagraph(proof.summary, proof.refs, theme.primaryColor),
        {
          fontFamily: theme.fontFamily,
          fontSize: withPointDelta(theme.fontSize, -1),
          lineHeight: metrics.detailLineHeight,
          color: DEFAULT_TEXT_COLOR,
          linkColor: LIGHT_MUTED_TEXT_COLOR,
        },
      );
      const bulletSize = addParagraph(context, bulletSpec);
      const proofSize = addParagraph(context, proofSpec);
      const proofHeight = Math.max(bulletSize.height, proofSize.height);
      addBlockHitRegion(context, projectProofAnchor(project.id, proof.id), {
        x: proofX,
        y: proofStartY,
        width: proofWidth,
        height: proofHeight,
      });
      context.cursorY += proofHeight + ptToPx(metrics.isDenseLayout ? 0 : 0.5);
    }
  }

  addBlockHitRegion(context, projectAnchor(project.id), {
    x: context.contentX,
    y: itemStartY,
    width: context.contentWidth,
    height: context.cursorY - itemStartY,
  });
  context.cursorY += metrics.itemMarginBottom;
}

function addSkillGroup(context: LayoutContext, skill: Skill) {
  const { metrics } = context;
  const { theme } = context.data;
  const groupStartY = context.cursorY;
  const titleSpec = buildParagraphSpec(
    context.contentX,
    context.cursorY,
    context.contentWidth,
    createPlainSegments(skill.category, { color: HEADING_TEXT_COLOR, fontWeight: 700 }),
    {
      fontFamily: theme.fontFamily,
      fontSize: theme.fontSize,
      lineHeight: metrics.headingLineHeight,
      color: HEADING_TEXT_COLOR,
    },
  );
  const titleSize = addParagraph(context, titleSpec);
  context.cursorY += titleSize.height + ptToPx(metrics.isDenseLayout ? 0 : 1);

  const orderedItems = [
    ...skill.items.filter((item) => item.level === 'core'),
    ...skill.items.filter((item) => item.level === 'proficient'),
    ...skill.items.filter((item) => item.level === 'familiar'),
  ];

  const capsules = orderedItems.map((item) => {
    const capsule = buildSkillCapsule(context, item);
    return {
      ...capsule,
      place: (x: number, y: number) => {
        capsule.place(x, y);
        addBlockHitRegion(context, skillItemAnchor(skill.id, item.id), {
          x,
          y,
          width: capsule.width,
          height: capsule.height,
        });
      },
    } satisfies InlinePlacementItem;
  });

  const capsuleLayout = layoutInlineItems(capsules, {
    x: context.contentX,
    y: context.cursorY,
    maxWidth: context.contentWidth,
    rowGap: 0,
  });
  context.cursorY += capsuleLayout.height;
  addBlockHitRegion(context, skillAnchor(skill.id), {
    x: context.contentX,
    y: groupStartY,
    width: context.contentWidth,
    height: context.cursorY - groupStartY,
  });
  context.cursorY += metrics.isDenseLayout ? 4 : metrics.itemMarginBottom;
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
  context.cursorY += metrics.itemMarginBottom;
}

function addExperienceSection(context: LayoutContext, section: SectionConfig, items: Experience[]) {
  if (items.length === 0) return;
  const sectionStartY = context.cursorY;
  addSectionHeading(context, sectionAnchor(section.id), section.title || context.options.translations.experience);
  items.forEach((item, index) => addExperienceItem(context, item, items[index - 1]));
  addBlockHitRegion(context, sectionAnchor(section.id), {
    x: context.contentX,
    y: sectionStartY,
    width: context.contentWidth,
    height: context.cursorY - sectionStartY,
  });
}

function addEducationSection(context: LayoutContext, section: SectionConfig, items: Education[]) {
  if (items.length === 0) return;
  const sectionStartY = context.cursorY;
  addSectionHeading(context, sectionAnchor(section.id), section.title || context.options.translations.education);
  items.forEach((item, index) => addEducationItem(context, item, items[index - 1]));
  addBlockHitRegion(context, sectionAnchor(section.id), {
    x: context.contentX,
    y: sectionStartY,
    width: context.contentWidth,
    height: context.cursorY - sectionStartY,
  });
}

function addProjectSection(context: LayoutContext, section: SectionConfig, items: Project[]) {
  const visibleProjects = items.filter((item) => item.visible !== false);
  if (visibleProjects.length === 0) return;
  const sectionStartY = context.cursorY;
  addSectionHeading(context, sectionAnchor(section.id), section.title || context.options.translations.projects);
  visibleProjects.forEach((item) => addProjectItem(context, item));
  addBlockHitRegion(context, sectionAnchor(section.id), {
    x: context.contentX,
    y: sectionStartY,
    width: context.contentWidth,
    height: context.cursorY - sectionStartY,
  });
}

function addSkillSection(context: LayoutContext, section: SectionConfig, items: Skill[]) {
  const visibleSkills = items.filter((item) => item.visible !== false);
  if (visibleSkills.length === 0) return;
  const sectionStartY = context.cursorY;
  addSectionHeading(context, sectionAnchor(section.id), section.title || context.options.translations.skills);
  visibleSkills.forEach((skill) => {
    if (skill.items.length > 0) {
      addSkillGroup(context, skill);
    }
  });
  addBlockHitRegion(context, sectionAnchor(section.id), {
    x: context.contentX,
    y: sectionStartY,
    width: context.contentWidth,
    height: context.cursorY - sectionStartY,
  });
}

function addCustomSection(context: LayoutContext, section: SectionConfig, customSection: CustomSection) {
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
  const sectionStartY = context.cursorY;
  addSectionHeading(
    context,
    sectionAnchor(section.id),
    section.title || context.options.translations.customSection || '自定义模块',
  );
  customItems.forEach((item) => addGenericCustomItem(context, section, item));
  addBlockHitRegion(context, sectionAnchor(section.id), {
    x: context.contentX,
    y: sectionStartY,
    width: context.contentWidth,
    height: context.cursorY - sectionStartY,
  });
}

export async function buildLayoutDocument(
  CanvasKitModule: CanvasKit,
  fontManager: FontManager,
  data: ResumeData,
  options: RenderBuildOptions,
): Promise<LayoutDocument> {
  const paper = getPaperDimensions(data.theme.paperSize);
  const metrics = getRenderLayoutMetrics(data.theme);
  const renderData: ResumeData = {
    ...data,
    theme: {
      ...data.theme,
      fontSize: ptToPx(data.theme.fontSize),
    },
  };
  const context: LayoutContext = {
    CanvasKitModule,
    fontManager,
    data: renderData,
    options,
    metrics,
    width: paper.width,
    contentX: metrics.pageHorizontalPadding,
    contentWidth: paper.width - metrics.pageHorizontalPadding * 2,
    cursorY: 0,
    drawOps: [],
    textRuns: [],
    linkRegions: [],
    hitRegions: [],
  };

  addHeader(context);

  for (const section of data.sections
    .filter((sectionItem) => sectionItem.visible)
    .sort((left, right) => left.order - right.order)) {
    if (section.id === 'summary') {
      continue;
    }

    if (section.id === 'experience') {
      addExperienceSection(context, section, data.experience);
      continue;
    }

    if (section.id === 'education') {
      addEducationSection(context, section, data.education);
      continue;
    }

    if (section.id === 'projects') {
      addProjectSection(context, section, data.projects);
      continue;
    }

    if (section.id === 'skills') {
      addSkillSection(context, section, data.skills);
      continue;
    }

    if (!section.isCustom) {
      continue;
    }

    const customSection = data.customSections.find((record) => record.id === section.id);
    if (!customSection || customSection.items.length === 0) {
      continue;
    }

    addCustomSection(context, section, customSection);
  }

  return {
    width: paper.width,
    height: Math.ceil(context.cursorY + metrics.pageBottomPadding),
    drawOps: context.drawOps,
    textRuns: context.textRuns,
    linkRegions: context.linkRegions,
    hitRegions: context.hitRegions,
  };
}
