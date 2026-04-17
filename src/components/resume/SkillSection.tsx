import { Text, View } from '@/components/core/Universal';
import { SectionHeading } from '@/components/resume/SectionHeading';
import { SkillCapsule } from '@/components/resume/SkillCapsule';
import { pxToPt } from '@/components/resume/layoutMetrics';
import type { ResumeSectionSharedProps } from '@/components/resume/layoutTypes';
import {
  sectionAnchor,
  skillAnchor,
  skillItemAnchor,
} from '@/lib/previewAnchor';
import type { SectionConfig, Skill } from '@/types';

interface SkillSectionProps {
  section: SectionConfig;
  items: Skill[];
  shared: ResumeSectionSharedProps;
}

export function SkillSection({ section, items, shared }: SkillSectionProps) {
  const { theme, translations, metrics, SelectableBlock } = shared;
  const visibleSkills = items.filter((item) => item.visible !== false);

  if (visibleSkills.length === 0) {
    return null;
  }

  return (
    <View style={{ marginBottom: Math.max(theme.spacing * 2, 0) }}>
      <SectionHeading
        anchor={sectionAnchor(section.id)}
        title={section.title || translations.skills}
        shared={shared}
      />
      {visibleSkills.map((skill) => {
        if (skill.items.length === 0) {
          return null;
        }

        const orderedItems = [
          ...skill.items.filter((item) => item.level === 'core'),
          ...skill.items.filter((item) => item.level === 'proficient'),
          ...skill.items.filter((item) => item.level === 'familiar'),
        ];

        return (
          <SelectableBlock key={skill.id} anchor={skillAnchor(skill.id)}>
            <View style={{ marginBottom: metrics.isDenseLayout ? pxToPt(4) : metrics.itemMarginBottom }}>
              <Text style={{ fontSize: theme.fontSize, fontWeight: 'bold', color: '#333', marginBottom: metrics.isDenseLayout ? 0 : 2 }}>
                {skill.category}
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', marginTop: metrics.isDenseLayout ? 0 : 1 }}>
                {orderedItems.map((item) => (
                  <SelectableBlock
                    key={item.id}
                    anchor={skillItemAnchor(skill.id, item.id)}
                  >
                    <SkillCapsule item={item} theme={theme} metrics={metrics} />
                  </SelectableBlock>
                ))}
              </View>
            </View>
          </SelectableBlock>
        );
      })}
    </View>
  );
}
