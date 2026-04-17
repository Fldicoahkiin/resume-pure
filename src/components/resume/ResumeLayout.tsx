import React, { ReactNode } from 'react';
import {
  Text,
  View,
} from '@/components/core/Universal';
import { MarkdownUniversal as Markdown } from '@/components/core/MarkdownUniversal';
import { DescriptionLines } from '@/components/resume/DescriptionLines';
import { GenericCustomSection } from '@/components/resume/GenericCustomSection';
import { getResumeLayoutMetrics, pxToPt } from '@/components/resume/layoutMetrics';
import { ProjectSection } from '@/components/resume/ProjectSection';
import { ResumeHeader } from '@/components/resume/ResumeHeader';
import { SectionHeading } from '@/components/resume/SectionHeading';
import { SkillSection } from '@/components/resume/SkillSection';
import type {
  ResumeLayoutProps,
  ResumeSelectableBlockProps,
} from '@/components/resume/layoutTypes';
import {
  educationAnchor,
  experienceAnchor,
  sectionAnchor,
} from '@/lib/previewAnchor';
import {
  getDateRange,
  inferCustomSectionType,
} from '@/lib/resumeUtils';
import type {
  Education,
  Experience,
  Project,
  SectionConfig,
  Skill,
} from '@/types';

export type {
  ResumeLayoutProps,
  ResumeSelectableBlockProps,
} from '@/components/resume/layoutTypes';

const DefaultSelectableBlock = ({
  children,
  className,
  style,
}: ResumeSelectableBlockProps) => (
  <View className={className} style={style}>
    {children}
  </View>
);

export const ResumeLayout: React.FC<ResumeLayoutProps> = ({
  data,
  translations,
  SelectableBlock = DefaultSelectableBlock,
}) => {
  const { theme } = data;
  const linksEnabled = theme.enableLinks !== false;
  const metrics = getResumeLayoutMetrics(theme);
  const {
    sectionMarginBottom,
    pageHorizontalPadding,
    pageTopPadding,
    pageBottomPadding,
    topBarHeight,
    itemMarginBottom,
    headingLineHeight,
    metadataLineHeight,
    detailLineHeight,
  } = metrics;

  const renderMarkdown = (text: string) => (
    <Markdown text={text} enableLinks={linksEnabled} primaryColor={theme.primaryColor} />
  );
  const sharedProps = { theme, linksEnabled, translations, metrics, SelectableBlock, renderMarkdown };

  const renderSectionHeading = (anchor: string, title: string) => (
    <SectionHeading
      anchor={anchor}
      title={title}
      shared={sharedProps}
    />
  );

  const renderDescriptionLines = (
    items: string[],
    keyPrefix: string,
    showBulletPoints = true,
    itemGap = 2.5
  ) => {
    return (
      <DescriptionLines
        items={items}
        keyPrefix={keyPrefix}
        theme={theme}
        renderMarkdown={renderMarkdown}
        lineHeight={detailLineHeight}
        showBulletPoints={showBulletPoints}
        itemGap={itemGap}
      />
    );
  };

  const renderExperienceSection = (section: SectionConfig, items: Experience[]) => {
    if (items.length === 0) return null;

    return (
      <View key={section.id} style={{ marginBottom: sectionMarginBottom }}>
        {renderSectionHeading(sectionAnchor(section.id), section.title || translations.experience)}
        {items.map((experience, index, allItems) => {
          const hideCompany = index > 0 && experience.company === allItems[index - 1].company;

          return (
            <SelectableBlock key={experience.id} anchor={experienceAnchor(experience.id)}>
              <View style={{ marginBottom: itemMarginBottom }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 2 }}>
                  <View style={{ flexGrow: 1, flexShrink: 1, minWidth: 0 }}>
                    {!hideCompany ? (
                      <Text style={{ fontSize: theme.fontSize, fontWeight: 'bold', lineHeight: headingLineHeight }}>
                        {experience.company}
                      </Text>
                    ) : null}
                    <View
                      style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginTop: hideCompany ? 0 : 1,
                      }}
                    >
                      <Text style={{ flex: 1, fontSize: theme.fontSize - 1, color: '#374151', lineHeight: detailLineHeight, paddingRight: pxToPt(8) }}>
                        {experience.position}
                        {experience.location ? (
                          <Text inline style={{ color: '#6b7280', lineHeight: detailLineHeight }}>
                            {' '}
                            · {experience.location}
                          </Text>
                        ) : null}
                      </Text>
                      <Text style={{ fontSize: theme.fontSize - 1, color: '#666', flexShrink: 0, lineHeight: metadataLineHeight }}>
                        {getDateRange(
                          experience.startDate,
                          experience.endDate,
                          experience.current,
                          translations.present
                        )}
                      </Text>
                    </View>
                  </View>
                </View>
                {renderDescriptionLines(
                  experience.description,
                  `exp-${experience.id}`,
                  experience.showBulletPoints !== false
                )}
              </View>
            </SelectableBlock>
          );
        })}
      </View>
    );
  };

  const renderEducationSection = (section: SectionConfig, items: Education[]) => {
    if (items.length === 0) return null;

    return (
      <View key={section.id} style={{ marginBottom: sectionMarginBottom }}>
        {renderSectionHeading(sectionAnchor(section.id), section.title || translations.education)}
        {items.map((education, index, allItems) => {
          const hideSchool = index > 0 && education.school === allItems[index - 1].school;

          return (
            <SelectableBlock key={education.id} anchor={educationAnchor(education.id)}>
              <View style={{ marginBottom: itemMarginBottom }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 2 }}>
                  <View style={{ flexGrow: 1, flexShrink: 1, minWidth: 0 }}>
                    {!hideSchool ? (
                      <Text style={{ fontSize: theme.fontSize, fontWeight: 'bold', lineHeight: headingLineHeight }}>
                        {education.school}
                      </Text>
                    ) : null}
                    <View
                      style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginTop: hideSchool ? 0 : 1,
                      }}
                    >
                      <Text style={{ flex: 1, fontSize: theme.fontSize - 1, color: '#374151', lineHeight: detailLineHeight, paddingRight: pxToPt(8) }}>
                        {education.degree}
                        {education.major ? <Text inline style={{ lineHeight: detailLineHeight }}> - {education.major}</Text> : null}
                        {education.gpa ? (
                          <Text inline style={{ color: '#6b7280', lineHeight: detailLineHeight }}>
                            {' '}
                            · GPA: {education.gpa}
                          </Text>
                        ) : null}
                      </Text>
                      <Text style={{ fontSize: theme.fontSize - 1, color: '#666', flexShrink: 0, lineHeight: metadataLineHeight }}>
                        {getDateRange(education.startDate, education.endDate, false, translations.present)}
                      </Text>
                    </View>
                  </View>
                </View>
                {renderDescriptionLines(
                  education.description || [],
                  `edu-${education.id}`,
                  education.showBulletPoints !== false
                )}
              </View>
            </SelectableBlock>
          );
        })}
      </View>
    );
  };

  const renderSection = (section: SectionConfig): ReactNode => {
    switch (section.id) {
      case 'summary':
        return null;
      case 'experience':
        return renderExperienceSection(section, data.experience);
      case 'education':
        return renderEducationSection(section, data.education);
      case 'projects':
        return <ProjectSection section={section} items={data.projects} shared={sharedProps} />;
      case 'skills':
        return <SkillSection section={section} items={data.skills} shared={sharedProps} />;
      default: {
        if (!section.isCustom) {
          return null;
        }

        const customSection = data.customSections.find((record) => record.id === section.id);
        if (!customSection || customSection.items.length === 0) {
          return null;
        }

        const customSectionType = inferCustomSectionType(customSection);

        if (customSectionType === 'experience') {
          return renderExperienceSection(section, customSection.items as Experience[]);
        }

        if (customSectionType === 'education') {
          return renderEducationSection(section, customSection.items as Education[]);
        }

        if (customSectionType === 'skill') {
          return <SkillSection section={section} items={customSection.items as Skill[]} shared={sharedProps} />;
        }

        if (customSectionType === 'custom') {
          return <GenericCustomSection section={section} customSection={customSection} shared={sharedProps} />;
        }

        return <ProjectSection section={section} items={customSection.items as Project[]} shared={sharedProps} />;
      }
    }
  };

  return (
    <>
      <View style={{ width: '100%', height: topBarHeight, backgroundColor: theme.primaryColor }} />

      <View
        style={{
          paddingLeft: pageHorizontalPadding,
          paddingRight: pageHorizontalPadding,
          paddingTop: pageTopPadding,
          paddingBottom: pageBottomPadding,
        }}
      >
        <ResumeHeader
          data={data}
          shared={sharedProps}
        />

        {data.sections
          .filter((section) => section.visible)
          .sort((left, right) => left.order - right.order)
          .map((section) => renderSection(section))}
      </View>
    </>
  );
};
