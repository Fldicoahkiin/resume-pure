import React from 'react';
import { ResumeData, SkillLevel, SectionConfig, Experience, Education, Project, Skill } from '@/types';
import { getPDFFontFamily, registerCJKHyphenation } from '@/lib/pdfFonts';
import { getPaperPointSize } from '@/lib/paper';
import { resolveSkillLogo } from '@/lib/skillLogo';
import { parseInlineMarkdown } from '@/lib/markdown';
import { toDataUrl } from '@/lib/image';

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

function isSafePdfUrl(url: string): boolean {
  try {
    const parsed = new URL(url, 'https://placeholder.invalid');
    return ['http:', 'https:', 'mailto:'].includes(parsed.protocol);
  } catch {
    return false;
  }
}

function renderInlineMarkdown(
  text: string,
  Text: PDFRenderer['Text'],
  Link: PDFRenderer['Link'],
  enableLinks: boolean,
  primaryColor: string
) {
  return parseInlineMarkdown(text).map((token, i) => {
    const key = `${token.type}-${i}`;
    switch (token.type) {
      case 'text': return token.content;
      case 'bold': return <Text key={key} style={{ fontWeight: 'bold' }}>{token.content}</Text>;
      case 'italic': return <Text key={key} style={{ fontStyle: 'italic' }}>{token.content}</Text>;
      case 'strike': return <Text key={key} style={{ textDecoration: 'line-through' }}>{token.content}</Text>;
      case 'code': return <Text key={key} style={{ backgroundColor: '#f3f4f6', fontFamily: 'Courier' }}>{token.content}</Text>;
      case 'link': return (enableLinks && isSafePdfUrl(token.url)) ? (
          <Link key={key} src={token.url} style={{ color: primaryColor || '#3b82f6', textDecoration: 'none' }}>{token.content}</Link>
        ) : <Text key={key}>{token.content}</Text>;
      default: return null;
    }
  });
}

function createResumePDF(renderer: PDFRenderer, data: ResumeData, translations: PDFTranslations) {
  const { Document, Page, Text, View, StyleSheet, Svg, Path, Image, Link } = renderer;

  const theme = data.theme;
  const fontFamily = getPDFFontFamily(theme.fontFamily);
  const paperPointSize = getPaperPointSize(theme.paperSize);
  const linksEnabled = theme.enableLinks !== false;

  const md = (text: string) =>
    renderInlineMarkdown(text, Text, Link, linksEnabled, theme.primaryColor);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const PdfLink = ({ src, style, children }: { src: string; style?: any; children: React.ReactNode }) => {
    if (linksEnabled && isSafePdfUrl(src)) {
      return <Link src={src} style={{ color: '#666', textDecoration: 'none', ...style }}>{children}</Link>;
    }
    return <Text style={style}>{children}</Text>;
  };

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
      color: '#666',
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
        size={paperPointSize}
        style={styles.page}
      >
        <View style={styles.header}>
          <Text style={styles.name}>{data.personalInfo.name}</Text>
          {data.personalInfo.title ? (
            <Text style={styles.title}>{data.personalInfo.title}</Text>
          ) : null}
          <View style={styles.contactInfo}>
            {data.personalInfo.email ? <PdfLink src={`mailto:${data.personalInfo.email}`} style={styles.contactItem}>{data.personalInfo.email}</PdfLink> : null}
            {data.personalInfo.phone ? <Text style={styles.contactItem}>{data.personalInfo.phone}</Text> : null}
            {data.personalInfo.location ? <Text style={styles.contactItem}>{data.personalInfo.location}</Text> : null}
            {data.personalInfo.website ? <PdfLink src={data.personalInfo.website.startsWith('http') ? data.personalInfo.website : `https://${data.personalInfo.website}`} style={styles.contactItem}>{data.personalInfo.website}</PdfLink> : null}
            {data.personalInfo.linkedin ? <PdfLink src={data.personalInfo.linkedin.startsWith('http') ? data.personalInfo.linkedin : `https://${data.personalInfo.linkedin}`} style={styles.contactItem}>{data.personalInfo.linkedin}</PdfLink> : null}
            {data.personalInfo.github ? <PdfLink src={data.personalInfo.github.startsWith('http') ? data.personalInfo.github : `https://${data.personalInfo.github}`} style={styles.contactItem}>{data.personalInfo.github}</PdfLink> : null}
            {(data.personalInfo.contacts || []).map((contact) => {
              const contactHref = contact.href || contact.value;
              const contactSrc = contactHref.startsWith('http') || contactHref.startsWith('mailto:') ? contactHref : `https://${contactHref}`;
              return <PdfLink key={contact.id} src={contactSrc} style={styles.contactItem}>{contact.value}</PdfLink>;
            })}
          </View>
          {data.personalInfo.summary ? (
            <Text style={styles.summary}>{md(data.personalInfo.summary)}</Text>
          ) : null}
        </View>

        {data.sections
          .filter((section) => section.visible)
          .sort((a, b) => a.order - b.order)
          .map((section) => {
            const renderSection = (section: SectionConfig, ctxData: ResumeData): React.ReactNode => {
              switch (section.id) {
                case 'summary':
                  return null;
                return null;

              case 'experience':
                if (ctxData.experience.length === 0) return null;
                return (
                  <View key={section.id} style={styles.section}>
                    <Text style={styles.sectionTitle}>{section.title || translations.experience}</Text>
                    {ctxData.experience.map((exp) => (
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
                              <Text key={desc.key} style={styles.descriptionLine}>{md(desc.value)}</Text>
                            ))
                          : getDescriptionLines(exp.description, `pdf-exp-${exp.id}`).map((desc) => (
                              <Text key={desc.key} style={styles.bulletPoint}>• {md(desc.value)}</Text>
                            ))}
                      </View>
                    ))}
                  </View>
                );

              case 'education':
                if (ctxData.education.length === 0) return null;
                return (
                  <View key={section.id} style={styles.section}>
                    <Text style={styles.sectionTitle}>{section.title || translations.education}</Text>
                    {ctxData.education.map((edu) => (
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
                              <Text key={desc.key} style={styles.descriptionLine}>{md(desc.value)}</Text>
                            ))
                          : getDescriptionLines(edu.description || [], `pdf-edu-${edu.id}`).map((desc) => (
                              <Text key={desc.key} style={styles.bulletPoint}>• {md(desc.value)}</Text>
                            ))}
                      </View>
                    ))}
                  </View>
                );

              case 'projects':
                if (ctxData.projects.length === 0) return null;
                return (
                  <View key={section.id} style={styles.section}>
                    <Text style={styles.sectionTitle}>{section.title || translations.projects}</Text>
                    {ctxData.projects.map((project) => (
                      <View key={project.id} style={styles.itemContainer} wrap={false}>
                        <View style={[styles.itemHeader, { alignItems: 'flex-start' }]}>
                          {project.showLogo !== false && (project.customLogo || project.repoAvatarUrl) ? (
                            // eslint-disable-next-line jsx-a11y/alt-text
                            <Image
                              src={project.customLogo || project.repoAvatarUrl}
                              style={{ width: 24, height: 24, borderRadius: 12, marginRight: 6, objectFit: 'cover' }}
                            />
                          ) : null}
                          <View style={{ flex: 1 }}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
                              <View style={styles.itemHeaderMain}>
                                <Text style={styles.itemTitle}>
                                  {project.name}{project.role ? ` · ${project.role}` : ''}
                                </Text>
                                <Text style={styles.itemSubtitle}>
                                  {project.repoUrl ? (
                                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                      <Svg viewBox="0 0 24 24" style={{ width: theme.fontSize - 3, height: theme.fontSize - 3, marginRight: 2, marginBottom: -1 }}>
                                        <Path d="M15 22v-4a4.8 4.8 0 0 0-1-3.03c3.18-.35 6.5-1.5 6.5-7a4.6 4.6 0 0 0-1.3-3.2 4.2 4.2 0 0 0-.1-3.2s-1.1-.3-3.5 1.3V3a11 11 0 0 0-11 0c-2.4-1.6-3.5-1.3-3.5-1.3a4.2 4.2 0 0 0-.1 3.2 4.6 4.6 0 0 0-1.3 3.2c0 5.4 3.3 6.6 6.5 7a4.8 4.8 0 0 0-1 3.03V22M9 18c-auto 0-3-1-4-3-1-2-3-2-3-2" fill="none" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                      </Svg>
                                      <PdfLink src={project.repoUrl} style={{ color: '#666' }}>
                                        {project.repoUrl.replace(/^https?:\/\/(www\.)?github\.com\//, '')}
                                      </PdfLink>
                                    </View>
                                  ) : null}
                                  {project.showStars !== false && typeof project.repoStars === 'number' && project.repoStars > 0 ? (
                                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                      <Text style={{ color: '#ccc', marginRight: 4, marginLeft: 4 }}>·</Text>
                                      <Text style={{ color: '#d97706' }}>
                                        ★ {project.repoStars}
                                      </Text>
                                    </View>
                                  ) : null}
                                  {project.url ? (
                                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                      <Text style={{ color: '#ccc', marginRight: 4, marginLeft: 4 }}>·</Text>
                                      <PdfLink src={project.url.startsWith('http') ? project.url : `https://${project.url}`} style={{ color: '#666' }}>
                                        {project.url}
                                      </PdfLink>
                                    </View>
                                  ) : null}
                                </Text>
                              </View>
                              <Text style={styles.itemDate}>
                                {getDateRange(project.startDate, project.endDate, project.current, translations.present)}
                              </Text>
                            </View>
                          </View>
                        </View>
                        {project.showBulletPoints === false
                          ? getDescriptionLines(project.description, `pdf-proj-${project.id}`).map((desc) => (
                              <Text key={desc.key} style={styles.descriptionLine}>{md(desc.value)}</Text>
                            ))
                          : getDescriptionLines(project.description, `pdf-proj-${project.id}`).map((desc) => (
                              <Text key={desc.key} style={styles.bulletPoint}>• {md(desc.value)}</Text>
                            ))}
                        {project.showTechnologies !== false && project.technologies && project.technologies.length > 0 ? (
                          <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', marginTop: 4 }}>
                            {project.technologies.map((tech, techIndex) => {
                              const logo = resolveSkillLogo(tech);
                              return (
                                <View key={`${tech}-${techIndex}`} style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#f9fafb', borderRadius: 8, paddingHorizontal: 6, paddingVertical: 1.5, border: '0.5px solid #e5e7eb', marginRight: 4, marginBottom: 2 }}>
                                  {logo ? (
                                    <Svg viewBox="0 0 24 24" style={{ width: theme.fontSize - 2, height: theme.fontSize - 2, marginRight: 3 }}>
                                      <Path d={logo.svgPath} fill={logo.color} />
                                    </Svg>
                                  ) : null}
                                  <Text style={{ fontSize: theme.fontSize - 2, color: '#4b5563' }}>{tech}</Text>
                                </View>
                              );
                            })}
                          </View>
                        ) : null}
                        {project.showProofs !== false && project.proofs && project.proofs.length > 0 ? (
                          <View>
                            <Text style={styles.contributionTitle}>{translations.contributions}</Text>
                            {project.proofs.map((proof) => (
                              <View key={proof.id} style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 1, alignItems: 'flex-start' }}>
                                <Text style={styles.contributionItem}>
                                  - {md(proof.summary)}
                                </Text>
                                {proof.refs.map((ref) => (
                                  <PdfLink key={ref.id} src={ref.url} style={{ fontSize: theme.fontSize - 2, color: '#4a7cc9', marginLeft: 2, paddingTop: 1.5 }}>
                                    {ref.type === 'pr' && ref.number ? `PR #${ref.number}` : ref.url.replace(/^https?:\/\/(www\.)?github\.com\//, '').replace(/\/commit\/([a-f0-9]{7})[a-f0-9]+$/, '/commit/$1')}
                                  </PdfLink>
                                ))}
                              </View>
                            ))}
                          </View>
                        ) : null}
                      </View>
                    ))}
                  </View>
                );

              case 'skills':
                if (ctxData.skills.length === 0) return null;
                return (
                  <View key={section.id} style={styles.section}>
                    <Text style={styles.sectionTitle}>{section.title || translations.skills}</Text>
                    {ctxData.skills.map((skill) => {
                      if (skill.items.length === 0) return null;

                      const iconSize = theme.fontSize - 1;
                      const coreItems = skill.items.filter(i => i.level === 'core');
                      const proficientItems = skill.items.filter(i => i.level === 'proficient');
                      const familiarItems = skill.items.filter(i => i.level === 'familiar');
                      const orderedItems = [...coreItems, ...proficientItems, ...familiarItems];

                      const capsuleStyle = (level: SkillLevel) => {
                        switch (level) {
                          case 'core': return { backgroundColor: '#ffffff', color: '#111827', border: `1px solid ${theme.primaryColor}`, fontWeight: 600 as const };
                          case 'proficient': return { backgroundColor: '#ffffff', color: '#4b5563', border: '1px solid #d1d5db', fontWeight: 500 as const };
                          case 'familiar': return { backgroundColor: '#f3f4f6', color: '#6b7280', border: '1px solid transparent', fontWeight: 400 as const };
                        }
                      };

                      return (
                        <View key={skill.id} style={styles.itemContainer} wrap={false}>
                          <Text style={styles.skillCategory}>{skill.category}</Text>
                          <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', marginTop: 2 }}>
                            {orderedItems.map((item) => {
                              const logo = resolveSkillLogo(item.name);
                              const cs = capsuleStyle(item.level);
                              return (
                                <View key={item.id} style={{ flexDirection: 'row', alignItems: 'center', borderRadius: 100, paddingHorizontal: 7, paddingVertical: 2, marginRight: 4, marginBottom: 3, ...cs }}>
                                  {item.showLogo === false ? null : item.logo ? (
                                    // eslint-disable-next-line jsx-a11y/alt-text
                                    <Image src={item.logo} style={{ width: iconSize, height: iconSize, marginRight: 3 }} />
                                  ) : logo ? (
                                    <Svg viewBox="0 0 24 24" style={{ width: iconSize, height: iconSize, marginRight: 3 }}>
                                      <Path d={logo.svgPath} fill={logo.color} />
                                    </Svg>
                                  ) : null}
                                  <Text style={{ fontSize: theme.fontSize - 0.5, color: cs.color, fontWeight: cs.fontWeight }}>
                                    {item.name}
                                  </Text>
                                  {item.showContext !== false && item.context ? (
                                    <Text style={{ fontSize: theme.fontSize - 1.5, color: '#9ca3af', marginLeft: 4 }}>
                                      {item.context}
                                    </Text>
                                  ) : null}
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

                const type = customSection.type && customSection.type !== 'custom' ? customSection.type : 'project';
                
                const fakeSection = { ...section, id: type + 's' };
                if (type === 'experience') fakeSection.id = 'experience';
                if (type === 'education') fakeSection.id = 'education';
                if (type === 'project') fakeSection.id = 'projects';
                if (type === 'skill') fakeSection.id = 'skills';
                
                return renderSection(fakeSection, {
                  ...ctxData,
                  experience: type === 'experience' ? customSection.items as Experience[] : [],
                  education: type === 'education' ? customSection.items as Education[] : [],
                  projects: type === 'project' ? customSection.items as Project[] : [],
                  skills: type === 'skill' ? customSection.items as Skill[] : [],
                });
              }
            };
            return renderSection(section, data);
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
    // 预转换头像 URL 为 data URL，避免 react-pdf 的 CORS 问题
    const processedData = JSON.parse(JSON.stringify(data)) as ResumeData;
    const imageUrls: Array<{ obj: Record<string, string>; key: string }> = [];
    for (const project of processedData.projects) {
      if (project.repoAvatarUrl) imageUrls.push({ obj: project as unknown as Record<string, string>, key: 'repoAvatarUrl' });
      if (project.customLogo) imageUrls.push({ obj: project as unknown as Record<string, string>, key: 'customLogo' });
    }
    for (const skill of processedData.skills) {
      for (const item of skill.items) {
        if (item.logo) imageUrls.push({ obj: item as unknown as Record<string, string>, key: 'logo' });
      }
    }
    await Promise.all(
      imageUrls.map(async ({ obj, key }) => {
        const url = obj[key];
        if (url && !url.startsWith('data:')) {
          try {
            obj[key] = await toDataUrl(url);
          } catch {
            // 转换失败时保留原始 URL
          }
        }
      })
    );

    const renderer = await import('@react-pdf/renderer');
    const { pdf } = renderer;

    const blob = await pdf(createResumePDF(renderer, processedData, translations)).toBlob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  } catch (error) {
    console.error('PDF 导出失败:', error);
    throw new Error('PDF export failed');
  }
}
