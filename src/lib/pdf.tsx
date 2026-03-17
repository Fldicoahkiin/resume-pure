import React from 'react';
import { ResumeData, SkillLevel } from '@/types';
import { getPDFFontFamily, registerCJKHyphenation } from '@/lib/pdfFonts';
import { getPaperDimensions } from '@/lib/paper';
import { resolveSkillLogo } from '@/lib/skillLogo';

registerCJKHyphenation();

interface PDFTranslations {
  summary: string;
  experience: string;
  education: string;
  projects: string;
  skills: string;
  technologies: string;
  contributions: string;
  present: string;
  skillLevel: Record<SkillLevel, string>;
}

const defaultTranslations: PDFTranslations = {
  summary: '个人简介',
  experience: '工作经历',
  education: '教育背景',
  projects: '项目经验',
  skills: '技能专长',
  technologies: '技术栈',
  contributions: '贡献记录',
  present: '至今',
  skillLevel: {
    core: '核心',
    proficient: '熟练',
    familiar: '了解',
  },
};

type PDFRenderer = typeof import('@react-pdf/renderer');

function withStableStringKey(items: string[], prefix: string) {
  const seen = new Map<string, number>();

  return items.map((item) => {
    const count = (seen.get(item) || 0) + 1;
    seen.set(item, count);

    return {
      key: `${prefix}-${item}-${count}`,
      value: item,
    };
  });
}

function getDescriptionLines(items: string[], prefix: string) {
  return withStableStringKey(
    items.filter((desc) => desc && desc.trim()),
    prefix
  );
}

function getDateRange(startDate: string, endDate: string, current: boolean | undefined, presentLabel: string): string {
  if (!startDate && !endDate && !current) {
    return '';
  }

  return `${startDate}${startDate && (endDate || current) ? ' - ' : ''}${current ? presentLabel : endDate}`;
}

function createResumePDF(renderer: PDFRenderer, data: ResumeData, translations: PDFTranslations) {
  const { Document, Page, Text, View, StyleSheet, Svg, Path, Image } = renderer;

  const theme = data.theme;
  const fontFamily = getPDFFontFamily(theme.fontFamily);
  const paper = getPaperDimensions(theme.paperSize);

  const styles = StyleSheet.create({
    page: {
      padding: 40,
      fontSize: theme.fontSize,
      fontFamily,
      lineHeight: theme.lineHeight,
      backgroundColor: '#ffffff',
    },
    header: {
      marginBottom: theme.spacing * 2,
    },
    name: {
      fontSize: theme.fontSize + 8,
      fontWeight: 'bold',
      color: theme.primaryColor,
      marginBottom: 4,
    },
    title: {
      fontSize: theme.fontSize + 2,
      color: '#666',
      marginBottom: 8,
    },
    contactInfo: {
      fontSize: theme.fontSize - 1,
      color: '#666',
      marginBottom: 2,
      flexDirection: 'row',
      flexWrap: 'wrap',
    },
    contactItem: {
      marginRight: 10,
    },
    summary: {
      fontSize: theme.fontSize,
      marginTop: theme.spacing,
      lineHeight: theme.lineHeight,
    },
    section: {
      marginTop: theme.spacing * 2,
    },
    sectionTitle: {
      fontSize: theme.fontSize + 2,
      fontWeight: 'bold',
      color: theme.primaryColor,
      marginBottom: theme.spacing,
      borderBottom: `2 solid ${theme.primaryColor}`,
      paddingBottom: 4,
    },
    itemContainer: {
      marginBottom: theme.spacing * 1.5,
    },
    itemHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 4,
    },
    itemHeaderMain: {
      flexGrow: 1,
      flexShrink: 1,
    },
    itemTitle: {
      fontSize: theme.fontSize,
      fontWeight: 'bold',
    },
    itemSubtitle: {
      fontSize: theme.fontSize - 1,
      color: '#666',
      marginTop: 1,
    },
    itemDate: {
      fontSize: theme.fontSize - 1,
      color: '#666',
      flexShrink: 0,
    },
    descriptionLine: {
      fontSize: theme.fontSize - 1,
      color: '#333',
      marginBottom: 2,
    },
    bulletPoint: {
      fontSize: theme.fontSize - 1,
      color: '#333',
      marginBottom: 2,
      marginLeft: 8,
    },
    itemMeta: {
      fontSize: theme.fontSize - 2,
      color: '#666',
      marginTop: 4,
    },
    contributionTitle: {
      fontSize: theme.fontSize - 2,
      color: '#666',
      marginTop: 5,
      marginBottom: 2,
    },
    contributionItem: {
      fontSize: theme.fontSize - 2,
      color: '#333',
      marginBottom: 2,
      marginLeft: 8,
    },
    skillCategory: {
      fontSize: theme.fontSize,
      fontWeight: 'bold',
      color: '#333',
      marginBottom: 4,
    },
    skillEntry: {
      marginBottom: 5,
      paddingLeft: 8,
    },
    skillEntryTitle: {
      fontSize: theme.fontSize - 1,
      color: '#333',
    },
    skillEntryContext: {
      fontSize: theme.fontSize - 2,
      color: '#666',
      marginTop: 1,
      lineHeight: theme.lineHeight,
    },
    customSectionItem: {
      marginBottom: theme.spacing,
    },
  });

  return (
    <Document>
      <Page
        size={[paper.width, paper.height]}
        style={styles.page}
      >
        <View style={styles.header}>
          <Text style={styles.name}>{data.personalInfo.name}</Text>
          {data.personalInfo.title ? (
            <Text style={styles.title}>{data.personalInfo.title}</Text>
          ) : null}
          <View style={styles.contactInfo}>
            {data.personalInfo.email ? <Text style={styles.contactItem}>{data.personalInfo.email}</Text> : null}
            {data.personalInfo.phone ? <Text style={styles.contactItem}>{data.personalInfo.phone}</Text> : null}
            {data.personalInfo.location ? <Text style={styles.contactItem}>{data.personalInfo.location}</Text> : null}
            {data.personalInfo.website ? <Text style={styles.contactItem}>{data.personalInfo.website}</Text> : null}
            {data.personalInfo.linkedin ? <Text style={styles.contactItem}>{data.personalInfo.linkedin}</Text> : null}
            {data.personalInfo.github ? <Text style={styles.contactItem}>{data.personalInfo.github}</Text> : null}
            {(data.personalInfo.contacts || []).map((contact) => (
              <Text key={contact.id} style={styles.contactItem}>{contact.value}</Text>
            ))}
          </View>
          {data.personalInfo.summary ? (
            <Text style={styles.summary}>{data.personalInfo.summary}</Text>
          ) : null}
        </View>

        {data.sections
          .filter((section) => section.visible)
          .sort((a, b) => a.order - b.order)
          .map((section) => {
            switch (section.id) {
              case 'summary':
                return null;

              case 'experience':
                if (data.experience.length === 0) return null;
                return (
                  <View key={section.id} style={styles.section}>
                    <Text style={styles.sectionTitle}>{translations.experience}</Text>
                    {data.experience.map((exp) => (
                      <View key={exp.id} style={styles.itemContainer} wrap={false}>
                        <View style={styles.itemHeader}>
                          <View style={styles.itemHeaderMain}>
                            <Text style={styles.itemTitle}>{exp.position}</Text>
                            <Text style={styles.itemSubtitle}>
                              {exp.company}{exp.location ? ` - ${exp.location}` : ''}
                            </Text>
                          </View>
                          <Text style={styles.itemDate}>
                            {getDateRange(exp.startDate, exp.endDate, exp.current, translations.present)}
                          </Text>
                        </View>
                        {exp.showBulletPoints === false
                          ? getDescriptionLines(exp.description, `pdf-exp-${exp.id}`).map((desc) => (
                              <Text key={desc.key} style={styles.descriptionLine}>{desc.value}</Text>
                            ))
                          : getDescriptionLines(exp.description, `pdf-exp-${exp.id}`).map((desc) => (
                              <Text key={desc.key} style={styles.bulletPoint}>• {desc.value}</Text>
                            ))}
                      </View>
                    ))}
                  </View>
                );

              case 'education':
                if (data.education.length === 0) return null;
                return (
                  <View key={section.id} style={styles.section}>
                    <Text style={styles.sectionTitle}>{translations.education}</Text>
                    {data.education.map((edu) => (
                      <View key={edu.id} style={styles.itemContainer} wrap={false}>
                        <View style={styles.itemHeader}>
                          <View style={styles.itemHeaderMain}>
                            <Text style={styles.itemTitle}>{edu.school}</Text>
                            <Text style={styles.itemSubtitle}>
                              {edu.degree} - {edu.major}
                              {edu.gpa ? ` | GPA: ${edu.gpa}` : ''}
                            </Text>
                          </View>
                          <Text style={styles.itemDate}>
                            {getDateRange(edu.startDate, edu.endDate, false, translations.present)}
                          </Text>
                        </View>
                        {edu.showBulletPoints === false
                          ? getDescriptionLines(edu.description || [], `pdf-edu-${edu.id}`).map((desc) => (
                              <Text key={desc.key} style={styles.descriptionLine}>{desc.value}</Text>
                            ))
                          : getDescriptionLines(edu.description || [], `pdf-edu-${edu.id}`).map((desc) => (
                              <Text key={desc.key} style={styles.bulletPoint}>• {desc.value}</Text>
                            ))}
                      </View>
                    ))}
                  </View>
                );

              case 'projects':
                if (data.projects.length === 0) return null;
                return (
                  <View key={section.id} style={styles.section}>
                    <Text style={styles.sectionTitle}>{translations.projects}</Text>
                    {data.projects.map((project) => (
                      <View key={project.id} style={styles.itemContainer} wrap={false}>
                        <View style={styles.itemHeader}>
                          <View style={styles.itemHeaderMain}>
                            <Text style={styles.itemTitle}>
                              {project.name}{project.role ? ` · ${project.role}` : ''}
                            </Text>
                            <Text style={styles.itemSubtitle}>
                              {project.repoUrl ? `GitHub` : ''}
                              {project.showStars !== false && typeof project.repoStars === 'number' ? `${project.repoUrl ? ' · ' : ''}★ ${project.repoStars}` : ''}
                              {project.url ? `${project.repoUrl || typeof project.repoStars === 'number' ? ' · ' : ''}${project.url}` : ''}
                            </Text>
                          </View>
                          <Text style={styles.itemDate}>
                            {getDateRange(project.startDate, project.endDate, project.current, translations.present)}
                          </Text>
                        </View>
                        {project.showBulletPoints === false
                          ? getDescriptionLines(project.description, `pdf-proj-${project.id}`).map((desc) => (
                              <Text key={desc.key} style={styles.descriptionLine}>{desc.value}</Text>
                            ))
                          : getDescriptionLines(project.description, `pdf-proj-${project.id}`).map((desc) => (
                              <Text key={desc.key} style={styles.bulletPoint}>• {desc.value}</Text>
                            ))}
                        {project.showTechnologies !== false && project.technologies && project.technologies.length > 0 ? (
                          <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', marginTop: 4, gap: 2 }}>
                            {project.technologies.map((tech, techIndex) => {
                              const logo = resolveSkillLogo(tech);
                              return (
                                <View key={`${tech}-${techIndex}`} style={{ flexDirection: 'row', alignItems: 'center', marginRight: 4 }}>
                                  {techIndex > 0 ? <Text style={{ fontSize: theme.fontSize - 2, color: '#ccc', marginRight: 3 }}>·</Text> : null}
                                  {logo ? (
                                    <Svg viewBox="0 0 24 24" style={{ width: theme.fontSize - 2, height: theme.fontSize - 2, marginRight: 1 }}>
                                      <Path d={logo.svgPath} fill={logo.color} />
                                    </Svg>
                                  ) : null}
                                  <Text style={{ fontSize: theme.fontSize - 2, color: '#666' }}>{tech}</Text>
                                </View>
                              );
                            })}
                          </View>
                        ) : null}
                        {project.showContributions !== false && project.contributions && project.contributions.length > 0 ? (
                          <View>
                            <Text style={styles.contributionTitle}>{translations.contributions}</Text>
                            {project.contributions.map((contribution) => (
                              <Text key={contribution.id} style={styles.contributionItem}>
                                - {contribution.summary}{contribution.url ? ` (${contribution.url})` : ''}
                              </Text>
                            ))}
                          </View>
                        ) : null}
                      </View>
                    ))}
                  </View>
                );

              case 'skills':
                if (data.skills.length === 0) return null;
                return (
                  <View key={section.id} style={styles.section}>
                    <Text style={styles.sectionTitle}>{translations.skills}</Text>
                    {data.skills.map((skill) => {
                      if (skill.items.length === 0) return null;

                      const iconSize = theme.fontSize - 1;

                      return (
                        <View key={skill.id} style={styles.itemContainer} wrap={false}>
                          <Text style={styles.skillCategory}>{skill.category}</Text>
                          <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', marginTop: 2 }}>
                            {skill.items.map((item, index) => {
                              const logo = resolveSkillLogo(item.name);
                              return (
                                <View key={item.id} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 2 }}>
                                  {item.showLogo === false ? null : item.logo ? (
                                    <Image src={item.logo} style={{ width: iconSize, height: iconSize, marginRight: 2 }} />
                                  ) : logo ? (
                                    <Svg viewBox="0 0 24 24" style={{ width: iconSize, height: iconSize, marginRight: 2 }}>
                                      <Path d={logo.svgPath} fill={logo.color} />
                                    </Svg>
                                  ) : null}
                                  <Text style={{ fontSize: theme.fontSize - 1, color: '#333' }}>
                                    {item.name}
                                    {item.showContext !== false && item.context ? ` (${item.context})` : ''}
                                    {index < skill.items.length - 1 ? '  ·  ' : ''}
                                  </Text>
                                </View>
                              );
                            })}
                          </View>
                        </View>
                      );
                    })}
                  </View>
                );

              default:
                if (!section.isCustom) return null;
                const customSection = data.customSections.find((record) => record.id === section.id);
                if (!customSection || customSection.items.length === 0) return null;

                return (
                  <View key={section.id} style={styles.section}>
                    <Text style={styles.sectionTitle}>{section.title}</Text>
                    {customSection.items.map((item) => (
                      <View key={item.id} style={styles.customSectionItem} wrap={false}>
                        <View style={styles.itemHeader}>
                          <View style={styles.itemHeaderMain}>
                            {item.title ? <Text style={styles.itemTitle}>{item.title}</Text> : null}
                            {item.subtitle ? <Text style={styles.itemSubtitle}>{item.subtitle}</Text> : null}
                          </View>
                          {item.date ? <Text style={styles.itemDate}>{item.date}</Text> : null}
                        </View>
                        {item.showBulletPoints === false
                          ? getDescriptionLines(item.description, `pdf-custom-${section.id}-${item.id}`).map((desc) => (
                              <Text key={desc.key} style={styles.descriptionLine}>{desc.value}</Text>
                            ))
                          : getDescriptionLines(item.description, `pdf-custom-${section.id}-${item.id}`).map((desc) => (
                              <Text key={desc.key} style={styles.bulletPoint}>• {desc.value}</Text>
                            ))}
                      </View>
                    ))}
                  </View>
                );
            }
          })}
      </Page>
    </Document>
  );
}

export async function exportToPDF(
  data: ResumeData,
  filename: string = 'resume.pdf',
  translations: PDFTranslations = defaultTranslations
): Promise<void> {
  try {
    const renderer = await import('@react-pdf/renderer');
    const { pdf } = renderer;

    const blob = await pdf(createResumePDF(renderer, data, translations)).toBlob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('PDF 导出失败:', error);
    throw new Error('PDF export failed');
  }
}
