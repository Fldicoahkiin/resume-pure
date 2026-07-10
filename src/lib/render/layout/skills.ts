import { sectionAnchor, skillAnchor, skillItemAnchor } from '@/lib/previewAnchor';
import type { SectionConfig, Skill } from '@/types';
import { addSectionHeading } from './blocks';
import { HEADING_TEXT_COLOR, addBlockHitRegion, addParagraph, buildParagraphSpec, createPlainSegments, layoutInlineItems, markBreakpoint, ptToPx } from './context';
import type { InlinePlacementItem, LayoutContext } from './context';
import { buildSkillCapsule } from './inline';

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

export function addSkillSection(context: LayoutContext, section: SectionConfig, items: Skill[]) {
  const visibleSkills = items.filter((item) => item.visible !== false);
  if (visibleSkills.length === 0) return;
  markBreakpoint(context);
  const sectionStartY = context.cursorY;
  addSectionHeading(context, sectionAnchor(section.id), section.title || context.options.translations.skills);
  let renderedGroups = 0;
  visibleSkills.forEach((skill) => {
    if (skill.items.length > 0) {
      if (renderedGroups > 0) markBreakpoint(context);
      renderedGroups += 1;
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
