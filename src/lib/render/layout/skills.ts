import { sectionAnchor, skillAnchor, skillItemAnchor } from '@/lib/previewAnchor';
import type { SectionConfig, Skill } from '@/types';
import { addSectionHeading } from './blocks';
import { HEADING_TEXT_COLOR, addBlockHitRegion, addParagraph, buildParagraphSpec, createPlainSegments, layoutInlineItems, markBreakpoint } from './context';
import type { InlinePlacementItem, LayoutContext } from './context';
import { buildSkillEntry } from './inline';

// 技能区用三级间距区分标题、换行和分类切换。
const SKILL_TITLE_TO_CONTENT_GAP = 3;
const SKILL_ROW_GAP = 4;
const SKILL_GROUP_GAP = 9;

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
  context.cursorY += titleSize.height + SKILL_TITLE_TO_CONTENT_GAP;

  const orderedItems = [
    ...skill.items.filter((item) => item.level === 'core'),
    ...skill.items.filter((item) => item.level === 'proficient'),
    ...skill.items.filter((item) => item.level === 'familiar'),
  ];

  const entries = orderedItems.map((item) => {
    const entry = buildSkillEntry(context, item);
    return {
      ...entry,
      place: (x: number, y: number) => {
        entry.place(x, y);
        addBlockHitRegion(context, skillItemAnchor(skill.id, item.id), {
          x,
          y,
          width: entry.width,
          height: entry.height,
        });
      },
    } satisfies InlinePlacementItem;
  });

  const entryLayout = layoutInlineItems(entries, {
    x: context.contentX,
    y: context.cursorY,
    maxWidth: context.contentWidth,
    rowGap: SKILL_ROW_GAP,
  });
  context.cursorY += entryLayout.height;
  addBlockHitRegion(context, skillAnchor(skill.id), {
    x: context.contentX,
    y: groupStartY,
    width: context.contentWidth,
    height: context.cursorY - groupStartY,
  });
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
      if (renderedGroups > 0) {
        markBreakpoint(context);
        context.cursorY += SKILL_GROUP_GAP;
      }
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
