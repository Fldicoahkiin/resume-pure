import React, { CSSProperties, ReactNode } from 'react';
import {
  Circle,
  Image,
  Link,
  Path,
  Svg,
  Text,
  View,
} from '@/components/core/Universal';
import { MarkdownUniversal as Markdown } from '@/components/core/MarkdownUniversal';
import { resolveSkillLogo } from '@/lib/skillLogo';
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
  getDescriptionLines,
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
  ResumeData,
  SectionConfig,
  Skill,
  SkillLevel,
} from '@/types';

const CSS_PIXEL_TO_POINT = 72 / 96;

function pxToPt(value: number): number {
  return value * CSS_PIXEL_TO_POINT;
}

const SECTION_BAR_STYLE: CSSProperties = {
  width: pxToPt(32),
  height: pxToPt(4),
  borderRadius: 999,
};

const PAGE_HORIZONTAL_PADDING = pxToPt(48);
const PAGE_TOP_PADDING = pxToPt(32);
const PAGE_BOTTOM_PADDING = pxToPt(30);
const TOP_BAR_HEIGHT = pxToPt(8);
const ITEM_MARGIN_BOTTOM = pxToPt(8);
const SECTION_HEADING_MARGIN_BOTTOM = pxToPt(8);

export interface ResumeSelectableBlockProps {
  anchor: string;
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  pageBreakable?: boolean;
}

const DefaultSelectableBlock = ({
  children,
  className,
  style,
}: ResumeSelectableBlockProps) => (
  <View className={className} style={style}>
    {children}
  </View>
);

export interface ResumeLayoutTranslations {
  experience: string;
  education: string;
  projects: string;
  skills: string;
  present: string;
  customSection?: string;
}

export interface ResumeLayoutProps {
  data: ResumeData;
  translations: ResumeLayoutTranslations;
  SelectableBlock?: React.ComponentType<ResumeSelectableBlockProps>;
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

export const ResumeLayout: React.FC<ResumeLayoutProps> = ({
  data,
  translations,
  SelectableBlock = DefaultSelectableBlock,
}) => {
  const { theme } = data;
  const linksEnabled = theme.enableLinks !== false;
  const sectionMarginBottom = Math.max(theme.spacing * 2, 0);
  const headerMarginBottom = Math.max(theme.spacing * 2, 0);

  const renderMarkdown = (text: string) => (
    <Markdown text={text} enableLinks={linksEnabled} primaryColor={theme.primaryColor} />
  );

  const getCapsuleStyle = (level: SkillLevel) => {
    switch (level) {
      case 'core':
        return {
          backgroundColor: '#ffffff',
          color: '#111827',
          borderColor: theme.primaryColor,
          fontWeight: 600 as const,
        };
      case 'proficient':
        return {
          backgroundColor: '#ffffff',
          color: '#4b5563',
          borderColor: '#d1d5db',
          fontWeight: 500 as const,
        };
      case 'familiar':
        return {
          backgroundColor: '#f3f4f6',
          color: '#6b7280',
          borderColor: 'transparent',
          fontWeight: 400 as const,
        };
    }
  };

  const renderSectionHeading = (anchor: string, title: string) => (
    <SelectableBlock anchor={anchor} pageBreakable>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: SECTION_HEADING_MARGIN_BOTTOM }}>
        <View style={{ ...SECTION_BAR_STYLE, backgroundColor: theme.primaryColor, marginRight: pxToPt(8) }} />
        <Text style={{ fontSize: theme.fontSize + 2, fontWeight: 'bold', color: '#374151' }}>
          {title}
        </Text>
      </View>
    </SelectableBlock>
  );

  const renderDescriptionLines = (
    items: string[],
    keyPrefix: string,
    showBulletPoints = true,
    itemGap = 2.5
  ) => {
    const descriptionLines = getDescriptionLines(items, keyPrefix);
    if (descriptionLines.length === 0) return null;

    if (!showBulletPoints) {
      return descriptionLines.map((line, index) => (
        <Text
          key={line.key}
          style={{
            fontSize: theme.fontSize - 1,
            color: '#374151',
            lineHeight: theme.lineHeight,
            marginBottom: index === descriptionLines.length - 1 ? 0 : itemGap,
          }}
        >
          {renderMarkdown(line.value)}
        </Text>
      ));
    }

    return descriptionLines.map((line, index) => (
      <View
        key={line.key}
        style={{
          flexDirection: 'row',
          alignItems: 'flex-start',
          marginBottom: index === descriptionLines.length - 1 ? 0 : itemGap,
        }}
      >
        <Text
          style={{
            color: '#9ca3af',
            fontSize: theme.fontSize - 1,
            fontWeight: 700,
            lineHeight: theme.lineHeight,
            marginRight: pxToPt(4),
            width: pxToPt(8),
            flexShrink: 0,
          }}
        >
          •
        </Text>
        <Text
          style={{
            color: '#374151',
            flex: 1,
            fontSize: theme.fontSize - 1,
            lineHeight: theme.lineHeight,
          }}
        >
          {renderMarkdown(line.value)}
        </Text>
      </View>
    ));
  };

  const getContactIconSvg = (type: string) => {
    if (type.includes('mail')) {
      return (
        <Path
          d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
          stroke="#6b7280"
          strokeWidth={1.5}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      );
    }

    if (type.includes('phone')) {
      return (
        <Path
          d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z"
          stroke="#6b7280"
          strokeWidth={1.5}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      );
    }

    if (type.includes('github')) {
      return (
        <Path
          d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
          fill="#6b7280"
        />
      );
    }

    if (type.includes('linkedin')) {
      return (
        <Path
          d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6zM2 9h4v12H2z M4 6a2 2 0 110-4 2 2 0 010 4z"
          stroke="#6b7280"
          strokeWidth={1.5}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      );
    }

    if (type.includes('map') || type.includes('location')) {
      return (
        <Path
          d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z M12 13a3 3 0 100-6 3 3 0 000 6z"
          stroke="#6b7280"
          strokeWidth={1.5}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      );
    }

    if (type.includes('website') || type.includes('globe')) {
      return (
        <>
          <Circle cx="12" cy="12" r="10" stroke="#6b7280" strokeWidth={1.5} fill="none" />
          <Path
            d="M12 2a14.5 14.5 0 000 20 14.5 14.5 0 000-20z M2 12h20"
            stroke="#6b7280"
            strokeWidth={1.5}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </>
      );
    }

    return (
      <Path
        d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"
        stroke="#6b7280"
        strokeWidth={1.5}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    );
  };

  const renderProjectLinks = (project: Project) => {
    const repoHref = sanitizeUrl(project.repoUrl);
    const projectHref = sanitizeUrl(project.url);

    return (
      <>
        {project.repoUrl ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: pxToPt(6) }}>
            <Svg viewBox="0 0 24 24" style={{ width: theme.fontSize - 2, height: theme.fontSize - 2, marginRight: pxToPt(2) }}>
              <Path
                d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                fill="#9ca3af"
              />
            </Svg>
            <Text inline style={{ fontSize: theme.fontSize - 2, color: '#9ca3af', lineHeight: theme.lineHeight }}>
              {repoHref && isSafePdfUrl(repoHref) && linksEnabled ? (
                <Link href={repoHref} style={{ color: '#9ca3af', textDecoration: 'none' }}>
                  {formatGitHubPath(project.repoUrl)}
                </Link>
              ) : (
                formatGitHubPath(project.repoUrl)
              )}
            </Text>
          </View>
        ) : null}

        {project.showStars !== false && typeof project.repoStars === 'number' && project.repoStars > 0 ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: pxToPt(6) }}>
            <Svg viewBox="0 0 24 24" style={{ width: theme.fontSize - 2, height: theme.fontSize - 2, marginRight: pxToPt(2) }}>
              <Path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill="#d97706" />
            </Svg>
            <Text inline style={{ fontSize: theme.fontSize - 2, color: '#d97706', lineHeight: theme.lineHeight }}>
              {formatCompactNumber(project.repoStars)}
            </Text>
          </View>
        ) : null}

        {project.url ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: pxToPt(6) }}>
            <Svg viewBox="0 0 24 24" style={{ width: theme.fontSize - 2, height: theme.fontSize - 2, marginRight: pxToPt(3) }}>
              <Path d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z" fill="#9ca3af" />
            </Svg>
            <Text inline style={{ fontSize: theme.fontSize - 2, color: '#9ca3af', lineHeight: theme.lineHeight }}>
              {projectHref && isSafePdfUrl(projectHref) && linksEnabled ? (
                <Link href={projectHref} style={{ color: '#9ca3af', textDecoration: 'none' }}>
                  {project.url}
                </Link>
              ) : (
                project.url
              )}
            </Text>
          </View>
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
              <View style={{ marginBottom: ITEM_MARGIN_BOTTOM }} pdfProps={{ minPresenceAhead: 8 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 2 }}>
                  <View style={{ flexGrow: 1, flexShrink: 1, minWidth: 0 }}>
                    {!hideCompany ? (
                      <Text style={{ fontSize: theme.fontSize, fontWeight: 'bold', lineHeight: 1.2 }}>
                        {experience.company}
                      </Text>
                    ) : null}
                    <View
                      style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        alignItems: 'baseline',
                        marginTop: hideCompany ? 0 : 1,
                      }}
                    >
                      <Text style={{ fontSize: theme.fontSize - 1, color: '#374151' }}>
                        {experience.position}
                        {experience.location ? (
                          <Text inline style={{ color: '#6b7280' }}>
                            {' '}
                            · {experience.location}
                          </Text>
                        ) : null}
                      </Text>
                      <Text style={{ fontSize: theme.fontSize - 1, color: '#666', flexShrink: 0, lineHeight: 1.2 }}>
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
              <View style={{ marginBottom: ITEM_MARGIN_BOTTOM }} pdfProps={{ wrap: false }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 2 }}>
                  <View style={{ flexGrow: 1, flexShrink: 1, minWidth: 0 }}>
                    {!hideSchool ? (
                      <Text style={{ fontSize: theme.fontSize, fontWeight: 'bold', lineHeight: 1.2 }}>
                        {education.school}
                      </Text>
                    ) : null}
                    <View
                      style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        alignItems: 'baseline',
                        marginTop: hideSchool ? 0 : 1,
                      }}
                    >
                      <Text style={{ fontSize: theme.fontSize - 1, color: '#374151' }}>
                        {education.degree}
                        {education.major ? <Text inline> - {education.major}</Text> : null}
                        {education.gpa ? (
                          <Text inline style={{ color: '#6b7280' }}>
                            {' '}
                            · GPA: {education.gpa}
                          </Text>
                        ) : null}
                      </Text>
                      <Text style={{ fontSize: theme.fontSize - 1, color: '#666', flexShrink: 0, lineHeight: 1.2 }}>
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
          const projectDescriptions = getDescriptionLines(project.description, `proj-${project.id}`);
          const projectProofs = project.proofs || [];
          const projectLogoSize = isCompact ? pxToPt(24) : pxToPt(36);
          const listTopMargin = isCompact ? 1.5 : 3.5;
          const descriptionGap = isCompact ? 1.5 : 2.5;
          const hasProjectLogo =
            project.showLogo !== false && Boolean(project.customLogo?.length || project.repoAvatarUrl?.length);
          const proofIndent = hasProjectLogo ? projectLogoSize + pxToPt(9) : 0;

          return (
            <SelectableBlock key={project.id} anchor={projectAnchor(project.id)} pageBreakable>
              <View style={{ marginBottom: ITEM_MARGIN_BOTTOM }}>
                <View pdfProps={{ minPresenceAhead: 8 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    {hasProjectLogo ? (
                      <Image
                        src={project.customLogo || project.repoAvatarUrl || ''}
                        alt=""
                        style={{
                          width: projectLogoSize,
                          height: projectLogoSize,
                          borderRadius: projectLogoSize / 2,
                          marginRight: pxToPt(9),
                          objectFit: 'cover',
                        }}
                      />
                    ) : null}
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', flex: 1, minWidth: 0, paddingRight: pxToPt(8) }}>
                          <Text inline style={{ fontSize: theme.fontSize, fontWeight: 'bold', lineHeight: 1.2 }}>
                            {project.name}
                          </Text>
                          {project.role ? (
                            <Text inline style={{ fontSize: theme.fontSize - 1, color: '#6b7280', marginLeft: pxToPt(6) }}>
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
                            lineHeight: 1.2,
                            marginTop: 0,
                          }}
                        >
                          {getDateRange(project.startDate, project.endDate, project.current, translations.present)}
                        </Text>
                      </View>

                      {projectDescriptions.length > 0 ? (
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
                          {project.technologies
                            .slice(0, isCompact ? 4 : project.technologies.length)
                            .map((tech, index) => {
                              const logo = resolveSkillLogo(tech);
                              return (
                                <View
                                  key={`${project.id}-${tech}-${index}`}
                                  style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    backgroundColor: '#f9fafb',
                                    borderRadius: pxToPt(8),
                                    borderWidth: 0.5,
                                    borderStyle: 'solid',
                                    borderColor: '#e5e7eb',
                                    marginRight: pxToPt(4),
                                    marginBottom: pxToPt(2),
                                    paddingLeft: pxToPt(6),
                                    paddingRight: pxToPt(6),
                                    paddingTop: 1.5,
                                    paddingBottom: 1.5,
                                  }}
                                >
                                  {logo ? (
                                    <Svg viewBox="0 0 24 24" style={{ width: theme.fontSize - 2, height: theme.fontSize - 2, marginRight: pxToPt(2) }}>
                                      <Path d={logo.svgPath} fill={logo.color} />
                                    </Svg>
                                  ) : null}
                                  <Text inline style={{ fontSize: theme.fontSize - 2, color: '#4b5563' }}>
                                    {tech}
                                  </Text>
                                </View>
                              );
                            })}

                          {project.technologies.length > (isCompact ? 4 : project.technologies.length) ? (
                            <View
                              style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                backgroundColor: '#f9fafb',
                                borderRadius: pxToPt(8),
                                borderWidth: 0.5,
                                borderStyle: 'solid',
                                borderColor: '#e5e7eb',
                                marginRight: pxToPt(4),
                                marginBottom: pxToPt(2),
                                paddingLeft: pxToPt(6),
                                paddingRight: pxToPt(6),
                                paddingTop: 1.5,
                                paddingBottom: 1.5,
                              }}
                            >
                              <Text inline style={{ fontSize: theme.fontSize - 2, color: '#9ca3af' }}>
                                +{project.technologies.length - 4}
                              </Text>
                            </View>
                          ) : null}
                        </View>
                      ) : null}
                    </View>
                  </View>
                </View>

                {project.showProofs !== false && projectProofs.length > 0 ? (
                  <View style={{ marginTop: isCompact ? 2 : 2.5, marginLeft: proofIndent }}>
                    {projectProofs.map((proof) => (
                      <SelectableBlock
                        key={proof.id}
                        anchor={projectProofAnchor(project.id, proof.id)}
                        pageBreakable={false}
                      >
                        <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 0.5 }}>
                          <Text style={{ fontSize: theme.fontSize - 1, color: '#9ca3af', width: pxToPt(8), flexShrink: 0 }}>
                            •
                          </Text>
                          <Text
                            style={{
                              fontSize: theme.fontSize - 1,
                              color: '#374151',
                              flex: 1,
                              lineHeight: 1.4,
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
                                    lineHeight: 1.4,
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
                                    lineHeight: theme.lineHeight,
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
              <View style={{ marginBottom: ITEM_MARGIN_BOTTOM }}>
                <Text style={{ fontSize: theme.fontSize, fontWeight: 'bold', color: '#333', marginBottom: 2 }}>
                  {skill.category}
                </Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', marginTop: 1 }}>
                  {orderedItems.map((item) => {
                    const logo = resolveSkillLogo(item.name);
                    const capsuleStyle = getCapsuleStyle(item.level);

                    return (
                      <SelectableBlock
                        key={item.id}
                        anchor={skillItemAnchor(skill.id, item.id)}
                        pageBreakable={false}
                      >
                        <View
                          pdfProps={{ wrap: false }}
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            flexWrap: 'nowrap',
                            borderRadius: 100,
                            paddingLeft: pxToPt(6.5),
                            paddingRight: pxToPt(6.5),
                            paddingTop: 0.5,
                            paddingBottom: 0.5,
                            marginRight: pxToPt(7),
                            marginBottom: 2.5,
                            backgroundColor: capsuleStyle.backgroundColor,
                            borderWidth: 1,
                            borderStyle: 'solid',
                            borderColor: capsuleStyle.borderColor,
                          }}
                        >
                          <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'nowrap' }}>
                            {item.showLogo === false ? null : item.logo ? (
                              <Image src={item.logo} alt="" style={{ width: theme.fontSize - 1, height: theme.fontSize - 1, marginRight: pxToPt(4) }} />
                            ) : logo ? (
                              <Svg viewBox="0 0 24 24" style={{ width: theme.fontSize - 1, height: theme.fontSize - 1, marginRight: pxToPt(4) }}>
                                <Path d={logo.svgPath} fill={logo.color} />
                              </Svg>
                            ) : null}
                            <Text
                              inline
                              style={{
                                fontSize: theme.fontSize - 0.5,
                                color: capsuleStyle.color,
                                fontWeight: capsuleStyle.fontWeight,
                                lineHeight: 1.5,
                              }}
                            >
                              {item.name}
                            </Text>
                          </View>
                          {item.showContext !== false && item.context ? (
                            <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'nowrap' }}>
                              <View
                                style={{
                                  width: 1,
                                  height: theme.fontSize,
                                  backgroundColor:
                                    item.level === 'core'
                                      ? `${theme.primaryColor}40`
                                      : item.level === 'proficient'
                                        ? '#e5e7eb'
                                        : '#d1d5db',
                                  marginLeft: pxToPt(6),
                                  marginRight: pxToPt(6),
                                }}
                              />
                              <Text
                                inline
                                style={{
                                  fontSize: theme.fontSize - 1.5,
                                  color:
                                    item.level === 'core'
                                      ? '#4b5563'
                                      : item.level === 'proficient'
                                        ? '#6b7280'
                                        : '#9ca3af',
                                  fontWeight: 400,
                                  lineHeight: 1.3,
                                }}
                              >
                                {item.context}
                              </Text>
                            </View>
                          ) : null}
                        </View>
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
          <View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: pxToPt(6) }}>
            <Svg viewBox="0 0 24 24" style={{ width: theme.fontSize - 2, height: theme.fontSize - 2, marginRight: pxToPt(2) }}>
              <Path
                d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                fill="#9ca3af"
              />
            </Svg>
            <Text inline style={{ fontSize: theme.fontSize - 2, color: '#9ca3af' }}>
              {repoHref && isSafePdfUrl(repoHref) && linksEnabled ? (
                <Link href={repoHref} style={{ color: '#9ca3af', textDecoration: 'none' }}>
                  {formatGitHubPath(item.repoUrl)}
                </Link>
              ) : (
                formatGitHubPath(item.repoUrl)
              )}
            </Text>
          </View>
        ) : null}

        {item.showStars !== false && typeof item.repoStars === 'number' && item.repoStars > 0 ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: pxToPt(6) }}>
            <Svg viewBox="0 0 24 24" style={{ width: theme.fontSize - 2, height: theme.fontSize - 2, marginRight: pxToPt(2) }}>
              <Path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill="#d97706" />
            </Svg>
            <Text inline style={{ fontSize: theme.fontSize - 2, color: '#d97706' }}>
              {formatCompactNumber(item.repoStars)}
            </Text>
          </View>
        ) : null}

        {item.url ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: pxToPt(6) }}>
            <Svg viewBox="0 0 24 24" style={{ width: theme.fontSize - 2, height: theme.fontSize - 2, marginRight: pxToPt(3) }}>
              <Path d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z" fill="#9ca3af" />
            </Svg>
            <Text inline style={{ fontSize: theme.fontSize - 2, color: '#9ca3af' }}>
              {itemHref && isSafePdfUrl(itemHref) && linksEnabled ? (
                <Link href={itemHref} style={{ color: '#9ca3af', textDecoration: 'none' }}>
                  {item.url}
                </Link>
              ) : (
                item.url
              )}
            </Text>
          </View>
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
              <View style={{ marginBottom: ITEM_MARGIN_BOTTOM }} pdfProps={{ minPresenceAhead: 8 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  {hasLogo ? (
                    <Image
                      src={item.repoAvatarUrl || ''}
                      alt=""
                      style={{
                        width: pxToPt(24),
                        height: pxToPt(24),
                        borderRadius: pxToPt(12),
                        marginRight: pxToPt(9),
                        objectFit: 'cover',
                      }}
                    />
                  ) : null}
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
                      <Text style={{ fontSize: theme.fontSize, fontWeight: 'bold', color: '#374151', lineHeight: 1.2 }}>
                        {item.title || 'Untitled'}
                      </Text>
                      {item.date ? (
                        <Text style={{ fontSize: theme.fontSize - 1, color: '#666', flexShrink: 0, lineHeight: 1.2 }}>
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
                      1.5
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
      <View style={{ width: '100%', height: TOP_BAR_HEIGHT, backgroundColor: theme.primaryColor }} />

      <View
        style={{
          paddingLeft: PAGE_HORIZONTAL_PADDING,
          paddingRight: PAGE_HORIZONTAL_PADDING,
          paddingTop: PAGE_TOP_PADDING,
          paddingBottom: PAGE_BOTTOM_PADDING,
        }}
      >
        <SelectableBlock
          anchor="personalInfo"
          pageBreakable
          style={{ marginBottom: headerMarginBottom }}
        >
          <Text style={{ fontSize: theme.fontSize + 8, fontWeight: 'bold', color: theme.primaryColor, lineHeight: 1.2 }}>
            {data.personalInfo.name}
          </Text>
          {data.personalInfo.title ? (
            <Text style={{ fontSize: theme.fontSize + 2, color: '#4b5563', marginTop: pxToPt(4) }}>
              {data.personalInfo.title}
            </Text>
          ) : null}
          {data.personalInfo.summary ? (
            <Text style={{ fontSize: theme.fontSize - 1, marginTop: pxToPt(6), lineHeight: 1.5, color: '#374151' }}>
              {renderMarkdown(data.personalInfo.summary)}
            </Text>
          ) : null}
          <View
            style={{
              marginTop: data.personalInfo.summary ? pxToPt(4) : 1,
              flexDirection: 'row',
              flexWrap: 'wrap',
              fontSize: theme.fontSize - 1,
              color: '#4b5563',
            }}
          >
            {[
              {
                anchor: personalInfoFieldAnchor('email'),
                type: data.personalInfo.iconConfig?.emailIcon || 'mail',
                value: data.personalInfo.email,
                href: sanitizeUrl(data.personalInfo.email),
              },
              {
                anchor: personalInfoFieldAnchor('phone'),
                type: data.personalInfo.iconConfig?.phoneIcon || 'phone',
                value: data.personalInfo.phone,
                href: sanitizeUrl(data.personalInfo.phone),
              },
              {
                anchor: personalInfoFieldAnchor('location'),
                type: data.personalInfo.iconConfig?.locationIcon || 'map-pin',
                value: data.personalInfo.location,
                href: undefined,
              },
              {
                anchor: personalInfoFieldAnchor('website'),
                type: data.personalInfo.iconConfig?.websiteIcon || 'globe',
                value: data.personalInfo.website,
                href: sanitizeUrl(data.personalInfo.website),
              },
              {
                anchor: personalInfoFieldAnchor('linkedin'),
                type: data.personalInfo.iconConfig?.linkedinIcon || 'linkedin',
                value: data.personalInfo.linkedin,
                href: sanitizeUrl(data.personalInfo.linkedin),
              },
              {
                anchor: personalInfoFieldAnchor('github'),
                type: data.personalInfo.iconConfig?.githubIcon || 'github',
                value: data.personalInfo.github,
                href: sanitizeUrl(data.personalInfo.github),
              },
              ...(data.personalInfo.contacts || [])
                .filter((contact) => contact.value)
                .sort((left, right) => left.order - right.order)
                .map((contact) => ({
                  anchor: customContactAnchor(contact.id),
                  type: contact.type,
                  value: contact.value,
                  href: contact.href ? sanitizeUrl(contact.href) : sanitizeUrl(contact.value),
                })),
            ]
              .filter((contact) => contact.value)
              .map((contact, index) => (
                <SelectableBlock key={`${contact.value}-${index}`} anchor={contact.anchor}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: pxToPt(12), marginBottom: pxToPt(2) }}>
                    <Svg viewBox="0 0 24 24" style={{ width: pxToPt(9), height: pxToPt(9), marginRight: pxToPt(4) }}>
                      {getContactIconSvg(contact.type || 'link')}
                    </Svg>
                    <Text inline style={{ color: '#4b5563' }}>
                      {contact.href && isSafePdfUrl(contact.href) && linksEnabled ? (
                        <Link href={contact.href} style={{ color: '#4b5563', textDecoration: 'none' }}>
                          {contact.value}
                        </Link>
                      ) : (
                        contact.value
                      )}
                    </Text>
                  </View>
                </SelectableBlock>
              ))}
          </View>
        </SelectableBlock>

        {data.sections
          .filter((section) => section.visible)
          .sort((left, right) => left.order - right.order)
          .map((section) => renderSection(section))}
      </View>
    </>
  );
};
