import type { RenderImage } from '@/lib/render/types';
import { projectAnchor, projectProofAnchor, sectionAnchor } from '@/lib/previewAnchor';
import { formatCompactNumber, formatGitHubPath, getDateRange, sanitizeUrl } from '@/lib/resumeUtils';
import { resolveSkillLogo } from '@/lib/skillLogo';
import type { Project, SectionConfig } from '@/types';
import { addDescriptionLines, addSectionHeading } from './blocks';
import { BULLET_COLUMN_WIDTH, DEFAULT_TEXT_COLOR, INLINE_ICON_GAP, INLINE_ICON_LINK_GAP, INLINE_METADATA_GAP, LARGE_PARAGRAPH_WIDTH, LIGHT_MUTED_TEXT_COLOR, MUTED_TEXT_COLOR, PROJECT_LOGO_GAP, STAR_COLOR, addBlockHitRegion, addParagraph, buildParagraphSpec, createPath, createPlainSegments, layoutInlineItems, markBreakpoint, measureParagraph, ptToPx, withPointDelta } from './context';
import type { InlinePlacementItem, LayoutContext } from './context';
import { GITHUB_ICON, LINK_ICON, STAR_ICON } from './icons';
import { buildInlineMetadataItem, buildProofParagraph, buildTechnologyPill } from './inline';

const DENSE_PROJECT_ITEM_EXTRA_GAP = 1;

const DEFAULT_PROJECT_ITEM_EXTRA_GAP = 0.5;

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
  context.cursorY +=
    metrics.itemMarginBottom +
    ptToPx(metrics.isDenseLayout ? DENSE_PROJECT_ITEM_EXTRA_GAP : DEFAULT_PROJECT_ITEM_EXTRA_GAP);
}

export function addProjectSection(context: LayoutContext, section: SectionConfig, items: Project[]) {
  const visibleProjects = items.filter((item) => item.visible !== false);
  if (visibleProjects.length === 0) return;
  markBreakpoint(context);
  const sectionStartY = context.cursorY;
  addSectionHeading(context, sectionAnchor(section.id), section.title || context.options.translations.projects);
  visibleProjects.forEach((item, index) => {
    if (index > 0) markBreakpoint(context);
    addProjectItem(context, item);
  });
  addBlockHitRegion(context, sectionAnchor(section.id), {
    x: context.contentX,
    y: sectionStartY,
    width: context.contentWidth,
    height: context.cursorY - sectionStartY,
  });
}
