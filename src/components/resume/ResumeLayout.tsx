import React, { ReactNode } from 'react';
import {
  Image,
  Link,
  Path,
  Svg,
  Text,
  View,
} from '@/components/core/Universal';
import { MarkdownUniversal as Markdown } from '@/components/core/MarkdownUniversal';
import { DescriptionLines } from '@/components/resume/DescriptionLines';
import { InlineMetadataItem } from '@/components/resume/InlineMetadataItem';
import { getResumeLayoutMetrics, pxToPt } from '@/components/resume/layoutMetrics';
import { ProjectTechnologyPill } from '@/components/resume/ProjectTechnologyPill';
import { ResumeHeader } from '@/components/resume/ResumeHeader';
import { SectionHeading } from '@/components/resume/SectionHeading';
import { SkillCapsule } from '@/components/resume/SkillCapsule';
import type {
  ResumeLayoutProps,
  ResumeSelectableBlockProps,
} from '@/components/resume/layoutTypes';
import { resolveSkillLogo } from '@/lib/skillLogo';
import {
  customItemAnchor,
  educationAnchor,
  experienceAnchor,
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
import type {
  CustomSection,
  CustomSectionItem,
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
const INLINE_ICON_GAP = pxToPt(2);
const INLINE_ICON_LINK_GAP = pxToPt(3);
const INLINE_METADATA_GAP = pxToPt(6);

const DefaultSelectableBlock = ({
  children,
  className,
  style,
}: ResumeSelectableBlockProps) => (
  <View className={className} style={style}>
    {children}
  </View>
);

function isCustomSectionItem(value: CustomSection['items'][number]): value is CustomSectionItem {
  return (
    'title' in value ||
    'subtitle' in value ||
    'date' in value ||
    'url' in value ||
    'repoUrl' in value
  );
}

function buildDuplicateSafeKeys(values: string[], prefix: string) {
  const counts = new Map<string, number>();

  return values.map((value) => {
    const occurrence = counts.get(value) ?? 0;
    counts.set(value, occurrence + 1);
    return `${prefix}-${value}-${occurrence}`;
  });
}

function renderTechnologyPills(
  projectId: string,
  technologies: string[],
  visibleCount: number,
  theme: ResumeLayoutProps['data']['theme'],
  metrics: ReturnType<typeof getResumeLayoutMetrics>
) {
  const visibleTechnologies = technologies.slice(0, visibleCount);
  const technologyKeys = buildDuplicateSafeKeys(visibleTechnologies, projectId);

  return visibleTechnologies.map((tech, technologyIndex) => (
    <ProjectTechnologyPill
      key={technologyKeys[technologyIndex]}
      label={tech}
      icon={resolveSkillLogo(tech)}
      theme={theme}
      metrics={metrics}
    />
  ));
}

export const ResumeLayout: React.FC<ResumeLayoutProps> = ({
  data,
  translations,
  SelectableBlock = DefaultSelectableBlock,
}) => {
  const { theme } = data;
  const linksEnabled = theme.enableLinks !== false;
  const metrics = getResumeLayoutMetrics(theme);
  const {
    isDenseLayout,
    sectionMarginBottom,
    pageHorizontalPadding,
    pageTopPadding,
    pageBottomPadding,
    topBarHeight,
    itemMarginBottom,
    headingLineHeight,
    metadataLineHeight,
    detailLineHeight,
    inlineIconSize,
    inlineIconBoxSize,
  } = metrics;

  const renderMarkdown = (text: string) => (
    <Markdown text={text} enableLinks={linksEnabled} primaryColor={theme.primaryColor} />
  );

  const renderSectionHeading = (anchor: string, title: string) => (
    <SectionHeading
      anchor={anchor}
      title={title}
      shared={{ theme, linksEnabled, translations, metrics, SelectableBlock, renderMarkdown }}
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

  const renderProjectLinks = (project: Project) => {
    const repoHref = sanitizeUrl(project.repoUrl);
    const projectHref = sanitizeUrl(project.url);

    return (
      <>
        {project.repoUrl ? (
          <InlineMetadataItem
            value={formatGitHubPath(project.repoUrl)}
            href={repoHref}
            enableLinks={linksEnabled}
            color="#9ca3af"
            fontSize={theme.fontSize - 2}
            lineHeight={metadataLineHeight}
            iconBoxSize={inlineIconBoxSize}
            iconGap={INLINE_ICON_GAP}
            style={{ marginLeft: INLINE_METADATA_GAP }}
            icon={
              <Svg viewBox="0 0 24 24" style={{ width: inlineIconSize, height: inlineIconSize }}>
                <Path
                  d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                  fill="#9ca3af"
                />
              </Svg>
            }
          />
        ) : null}

        {project.showStars !== false && typeof project.repoStars === 'number' && project.repoStars > 0 ? (
          <InlineMetadataItem
            value={formatCompactNumber(project.repoStars)}
            enableLinks={false}
            color="#d97706"
            fontSize={theme.fontSize - 2}
            lineHeight={metadataLineHeight}
            iconBoxSize={inlineIconBoxSize}
            iconGap={INLINE_ICON_GAP}
            style={{ marginLeft: INLINE_METADATA_GAP }}
            icon={
              <Svg viewBox="0 0 24 24" style={{ width: inlineIconSize, height: inlineIconSize }}>
                <Path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill="#d97706" />
              </Svg>
            }
          />
        ) : null}

        {project.url ? (
          <InlineMetadataItem
            value={project.url}
            href={projectHref}
            enableLinks={linksEnabled}
            color="#9ca3af"
            fontSize={theme.fontSize - 2}
            lineHeight={metadataLineHeight}
            iconBoxSize={inlineIconBoxSize}
            iconGap={INLINE_ICON_LINK_GAP}
            style={{ marginLeft: INLINE_METADATA_GAP }}
            icon={
              <Svg viewBox="0 0 24 24" style={{ width: inlineIconSize, height: inlineIconSize }}>
                <Path d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z" fill="#9ca3af" />
              </Svg>
            }
          />
        ) : null}
      </>
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
            <SelectableBlock key={experience.id} anchor={experienceAnchor(experience.id)} pageBreakable>
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
            <SelectableBlock key={education.id} anchor={educationAnchor(education.id)} pageBreakable>
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

  const renderProjectSection = (section: SectionConfig, items: Project[]) => {
    const visibleProjects = items.filter((item) => item.visible !== false);
    if (visibleProjects.length === 0) return null;

    return (
      <View key={section.id} style={{ marginBottom: sectionMarginBottom }}>
        {renderSectionHeading(sectionAnchor(section.id), section.title || translations.projects)}
        {visibleProjects.map((project) => {
          const isCompact = project.layout === 'compact';
          const hasProjectDescription = project.description.some((line) => line.trim().length > 0);
          const projectProofs = project.proofs || [];
          const projectLogoSize = isCompact
            ? pxToPt(isDenseLayout ? 20 : 24)
            : pxToPt(isDenseLayout ? 28 : 36);
          const listTopMargin = isDenseLayout ? (isCompact ? 1 : 2) : (isCompact ? 1.5 : 3.5);
          const descriptionGap = isDenseLayout ? (isCompact ? 1 : 1.5) : (isCompact ? 1.5 : 2.5);
          const hasProjectLogo =
            project.showLogo !== false && Boolean(project.customLogo?.length || project.repoAvatarUrl?.length);
          const proofIndent = hasProjectLogo ? projectLogoSize + pxToPt(isDenseLayout ? 6 : 9) : 0;

          return (
            <SelectableBlock key={project.id} anchor={projectAnchor(project.id)} pageBreakable>
              <View style={{ marginBottom: itemMarginBottom }}>
                <View>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    {hasProjectLogo ? (
                      <Image
                        src={project.customLogo || project.repoAvatarUrl || ''}
                        alt=""
                        style={{
                          width: projectLogoSize,
                          height: projectLogoSize,
                          borderRadius: projectLogoSize / 2,
                          marginRight: pxToPt(isDenseLayout ? 6 : 9),
                          objectFit: 'cover',
                        }}
                      />
                    ) : null}
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', flex: 1, minWidth: 0, paddingRight: pxToPt(isDenseLayout ? 6 : 8) }}>
                          <Text inline style={{ fontSize: theme.fontSize, fontWeight: 'bold', lineHeight: headingLineHeight }}>
                            {project.name}
                          </Text>
                          {project.role ? (
                            <Text inline style={{ fontSize: theme.fontSize - 1, color: '#6b7280', marginLeft: pxToPt(isDenseLayout ? 4 : 6) }}>
                              {project.role}
                            </Text>
                          ) : null}
                          {renderProjectLinks(project)}
                        </View>
                        <Text
                          style={{
                            fontSize: theme.fontSize - 1,
                            color: '#666',
                            flexShrink: 0,
                            lineHeight: metadataLineHeight,
                            marginTop: 0,
                          }}
                        >
                          {getDateRange(project.startDate, project.endDate, project.current, translations.present)}
                        </Text>
                      </View>

                      {hasProjectDescription ? (
                        <View style={{ marginTop: listTopMargin, minWidth: 0 }}>
                          {renderDescriptionLines(
                            project.description,
                            `proj-${project.id}`,
                            project.showBulletPoints !== false,
                            descriptionGap
                          )}
                        </View>
                      ) : null}

                      {project.showTechnologies !== false &&
                      project.technologies &&
                      project.technologies.length > 0 ? (
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', marginTop: listTopMargin }}>
                          {renderTechnologyPills(
                            project.id,
                            project.technologies,
                            isCompact ? 4 : project.technologies.length,
                            theme,
                            metrics
                          )}

                          {project.technologies.length > (isCompact ? 4 : project.technologies.length) ? (
                            <ProjectTechnologyPill
                              label={`+${project.technologies.length - 4}`}
                              theme={theme}
                              metrics={metrics}
                              muted
                            />
                          ) : null}
                        </View>
                      ) : null}
                    </View>
                  </View>
                </View>

                {project.showProofs !== false && projectProofs.length > 0 ? (
                  <View style={{ marginTop: isDenseLayout ? 1.5 : (isCompact ? 2 : 2.5), marginLeft: proofIndent }}>
                    {projectProofs.map((proof) => (
                      <SelectableBlock
                        key={proof.id}
                        anchor={projectProofAnchor(project.id, proof.id)}
                        pageBreakable={false}
                      >
                        <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: isDenseLayout ? 0 : 0.5 }}>
                          <Text style={{ fontSize: theme.fontSize - 1, color: '#9ca3af', width: pxToPt(isDenseLayout ? 6 : 8), flexShrink: 0 }}>
                            •
                          </Text>
                          <Text
                            style={{
                              fontSize: theme.fontSize - 1,
                              color: '#374151',
                              flex: 1,
                                  lineHeight: detailLineHeight,
                                }}
                              >
                                {renderMarkdown(proof.summary)}
                                {proof.refs.map((ref) => {
                              const href = sanitizeUrl(ref.url);
                              const label = ` ${formatProofRefLabel(ref)}`;

                                  return linksEnabled && href && isSafePdfUrl(href) ? (
                                    <Link
                                      key={ref.id}
                                      href={href}
                                      style={{
                                        color: '#9ca3af',
                                        textDecoration: 'none',
                                        fontSize: theme.fontSize - 2.5,
                                        lineHeight: detailLineHeight,
                                      }}
                                    >
                                      {label}
                                    </Link>
                                  ) : (
                                    <Text
                                      key={ref.id}
                                      inline
                                      style={{
                                        color: '#9ca3af',
                                        fontSize: theme.fontSize - 2.5,
                                        lineHeight: detailLineHeight,
                                      }}
                                    >
                                      {label}
                                </Text>
                              );
                            })}
                          </Text>
                        </View>
                      </SelectableBlock>
                    ))}
                  </View>
                ) : null}
              </View>
            </SelectableBlock>
          );
        })}
      </View>
    );
  };

  const renderSkillSection = (section: SectionConfig, items: Skill[]) => {
    const visibleSkills = items.filter((item) => item.visible !== false);
    if (visibleSkills.length === 0) return null;

    return (
      <View key={section.id} style={{ marginBottom: sectionMarginBottom }}>
        {renderSectionHeading(sectionAnchor(section.id), section.title || translations.skills)}
        {visibleSkills.map((skill) => {
          if (skill.items.length === 0) return null;

          const orderedItems = [
            ...skill.items.filter((item) => item.level === 'core'),
            ...skill.items.filter((item) => item.level === 'proficient'),
            ...skill.items.filter((item) => item.level === 'familiar'),
          ];

          return (
            <SelectableBlock key={skill.id} anchor={skillAnchor(skill.id)} pageBreakable>
              <View style={{ marginBottom: isDenseLayout ? pxToPt(4) : itemMarginBottom }}>
                <Text style={{ fontSize: theme.fontSize, fontWeight: 'bold', color: '#333', marginBottom: isDenseLayout ? 0 : 2 }}>
                  {skill.category}
                </Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', marginTop: isDenseLayout ? 0 : 1 }}>
                  {orderedItems.map((item) => {
                    return (
                      <SelectableBlock
                        key={item.id}
                        anchor={skillItemAnchor(skill.id, item.id)}
                        pageBreakable={false}
                      >
                        <SkillCapsule item={item} theme={theme} metrics={metrics} />
                      </SelectableBlock>
                    );
                  })}
                </View>
              </View>
            </SelectableBlock>
          );
        })}
      </View>
    );
  };

  const renderCustomLinks = (item: CustomSectionItem) => {
    const repoHref = sanitizeUrl(item.repoUrl);
    const itemHref = sanitizeUrl(item.url);

    return (
      <>
        {item.repoUrl ? (
          <InlineMetadataItem
            value={formatGitHubPath(item.repoUrl)}
            href={repoHref}
            enableLinks={linksEnabled}
            color="#9ca3af"
            fontSize={theme.fontSize - 2}
            lineHeight={metadataLineHeight}
            iconBoxSize={inlineIconBoxSize}
            iconGap={INLINE_ICON_GAP}
            style={{ marginLeft: INLINE_METADATA_GAP }}
            icon={
              <Svg viewBox="0 0 24 24" style={{ width: inlineIconSize, height: inlineIconSize }}>
                <Path
                  d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                  fill="#9ca3af"
                />
              </Svg>
            }
          />
        ) : null}

        {item.showStars !== false && typeof item.repoStars === 'number' && item.repoStars > 0 ? (
          <InlineMetadataItem
            value={formatCompactNumber(item.repoStars)}
            enableLinks={false}
            color="#d97706"
            fontSize={theme.fontSize - 2}
            lineHeight={metadataLineHeight}
            iconBoxSize={inlineIconBoxSize}
            iconGap={INLINE_ICON_GAP}
            style={{ marginLeft: INLINE_METADATA_GAP }}
            icon={
              <Svg viewBox="0 0 24 24" style={{ width: inlineIconSize, height: inlineIconSize }}>
                <Path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill="#d97706" />
              </Svg>
            }
          />
        ) : null}

        {item.url ? (
          <InlineMetadataItem
            value={item.url}
            href={itemHref}
            enableLinks={linksEnabled}
            color="#9ca3af"
            fontSize={theme.fontSize - 2}
            lineHeight={metadataLineHeight}
            iconBoxSize={inlineIconBoxSize}
            iconGap={INLINE_ICON_LINK_GAP}
            style={{ marginLeft: INLINE_METADATA_GAP }}
            icon={
              <Svg viewBox="0 0 24 24" style={{ width: inlineIconSize, height: inlineIconSize }}>
                <Path d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z" fill="#9ca3af" />
              </Svg>
            }
          />
        ) : null}
      </>
    );
  };

  const renderGenericCustomSection = (section: SectionConfig, customSection: CustomSection) => {
    const customItems = customSection.items.filter(isCustomSectionItem);
    if (customItems.length === 0) return null;

    return (
      <View key={section.id} style={{ marginBottom: sectionMarginBottom }}>
        {renderSectionHeading(
          sectionAnchor(section.id),
          section.title || translations.customSection || '自定义模块'
        )}
        {customItems.map((item) => {
          const keyPrefix = `custom-${section.id}-${item.id}`;
          const hasMeta = Boolean(item.subtitle || item.date);
          const hasLogo = item.showLogo !== false && Boolean(item.repoAvatarUrl);

          return (
            <SelectableBlock key={item.id} anchor={customItemAnchor(section.id, item.id)} pageBreakable>
              <View style={{ marginBottom: itemMarginBottom }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  {hasLogo ? (
                    <Image
                      src={item.repoAvatarUrl || ''}
                      alt=""
                      style={{
                        width: pxToPt(isDenseLayout ? 20 : 24),
                        height: pxToPt(isDenseLayout ? 20 : 24),
                        borderRadius: pxToPt(isDenseLayout ? 10 : 12),
                        marginRight: pxToPt(isDenseLayout ? 6 : 9),
                        objectFit: 'cover',
                      }}
                    />
                  ) : null}
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Text style={{ fontSize: theme.fontSize, fontWeight: 'bold', color: '#374151', lineHeight: headingLineHeight }}>
                        {item.title || 'Untitled'}
                      </Text>
                      {item.date ? (
                        <Text style={{ fontSize: theme.fontSize - 1, color: '#666', flexShrink: 0, lineHeight: metadataLineHeight }}>
                          {item.date}
                        </Text>
                      ) : null}
                    </View>

                    {hasMeta ? (
                      <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', marginTop: 1 }}>
                        {item.subtitle ? (
                          <Text inline style={{ fontSize: theme.fontSize - 1, color: '#6b7280' }}>
                            {item.subtitle}
                          </Text>
                        ) : null}
                        {renderCustomLinks(item)}
                      </View>
                    ) : (
                      <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', marginTop: 1 }}>
                        {renderCustomLinks(item)}
                      </View>
                    )}

                    {renderDescriptionLines(
                      item.description,
                      keyPrefix,
                      item.showBulletPoints !== false,
                      isDenseLayout ? 1 : 1.5
                    )}
                  </View>
                </View>
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
        return renderProjectSection(section, data.projects);
      case 'skills':
        return renderSkillSection(section, data.skills);
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
          return renderSkillSection(section, customSection.items as Skill[]);
        }

        if (customSectionType === 'custom') {
          return renderGenericCustomSection(section, customSection);
        }

        return renderProjectSection(section, customSection.items as Project[]);
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
          shared={{ theme, linksEnabled, translations, metrics, SelectableBlock, renderMarkdown }}
        />

        {data.sections
          .filter((section) => section.visible)
          .sort((left, right) => left.order - right.order)
          .map((section) => renderSection(section))}
      </View>
    </>
  );
};
