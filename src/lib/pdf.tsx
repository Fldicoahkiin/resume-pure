import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { ResumeData } from '@/types';
import { getPDFFontFamily, registerCJKHyphenation } from '@/lib/fonts';

// 注册中文断词回调
registerCJKHyphenation();

export interface PDFTranslations {
  summary: string;
  experience: string;
  education: string;
  projects: string;
  skills: string;
  technologies: string;
  present: string;
}

const defaultTranslations: PDFTranslations = {
  summary: '个人简介',
  experience: '工作经历',
  education: '教育背景',
  projects: '项目经验',
  skills: '技能专长',
  technologies: '技术栈',
  present: '至今',
};

// 定义样式
const createStyles = (theme: ResumeData['theme']) => {
  // 通过字体配置系统获取 PDF 字体（自动注册 + 回退）
  const fontFamily = getPDFFontFamily(theme.fontFamily);

  return StyleSheet.create({
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
    itemTitle: {
      fontSize: theme.fontSize,
      fontWeight: 'bold',
    },
    itemSubtitle: {
      fontSize: theme.fontSize - 1,
      color: '#666',
      marginBottom: 2,
    },
    itemDate: {
      fontSize: theme.fontSize - 1,
      color: '#666',
    },
    bulletPoint: {
      fontSize: theme.fontSize - 1,
      marginLeft: 12,
      marginBottom: 2,
    },
    skillCategory: {
      fontSize: theme.fontSize,
      fontWeight: 'bold',
      marginBottom: 4,
    },
    skillItems: {
      fontSize: theme.fontSize - 1,
      color: '#666',
      marginBottom: theme.spacing,
    },
  });
};

interface ResumePDFProps {
  data: ResumeData;
  translations?: PDFTranslations;
}

export const ResumePDF: React.FC<ResumePDFProps> = ({ data, translations = defaultTranslations }) => {
  const t = translations;
  const styles = createStyles(data.theme);
  const visibleSections = data.sections
    .filter(s => s.visible)
    .sort((a, b) => a.order - b.order);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* 个人信息 */}
        <View style={styles.header}>
          <Text style={styles.name}>{data.personalInfo.name}</Text>
          {data.personalInfo.title && (
            <Text style={styles.title}>{data.personalInfo.title}</Text>
          )}

          <View style={styles.contactInfo}>
            {[
              data.personalInfo.email,
              data.personalInfo.phone,
              data.personalInfo.location,
              data.personalInfo.website,
            ].filter(Boolean).map((info, idx) => (
              <Text key={idx} style={styles.contactItem}>{info}</Text>
            ))}
          </View>

          {(data.personalInfo.linkedin || data.personalInfo.github || (data.personalInfo.contacts && data.personalInfo.contacts.length > 0)) && (
            <View style={styles.contactInfo}>
              {[
                data.personalInfo.linkedin,
                data.personalInfo.github,
                ...(data.personalInfo.contacts || []).map(c => c.value)
              ].filter(Boolean).map((info, idx) => (
                <Text key={idx} style={styles.contactItem}>{info}</Text>
              ))}
            </View>
          )}
        </View>

        {visibleSections.map(section => {
          switch (section.id) {
            case 'summary':
              if (!data.personalInfo.summary) return null;
              return (
                <View key={section.id} style={styles.section}>
                  <Text style={styles.sectionTitle}>{t.summary}</Text>
                  <Text style={styles.summary}>{data.personalInfo.summary}</Text>
                </View>
              );

            case 'experience':
              if (data.experience.length === 0) return null;
              return (
                <View key={section.id} style={styles.section}>
                  <Text style={styles.sectionTitle}>{t.experience}</Text>
                  {data.experience.map(exp => (
                    <View key={exp.id} style={styles.itemContainer}>
                      <View style={styles.itemHeader}>
                        <View>
                          <Text style={styles.itemTitle}>{exp.position}</Text>
                          <Text style={styles.itemSubtitle}>
                            {exp.company}{exp.location ? ` - ${exp.location}` : ''}
                          </Text>
                        </View>
                        <Text style={styles.itemDate}>
                          {exp.startDate} - {exp.current ? t.present : exp.endDate}
                        </Text>
                      </View>
                      {exp.description.map((desc, idx) => (
                        <Text key={idx} style={styles.bulletPoint}>• {desc}</Text>
                      ))}
                    </View>
                  ))}
                </View>
              );

            case 'education':
              if (data.education.length === 0) return null;
              return (
                <View key={section.id} style={styles.section}>
                  <Text style={styles.sectionTitle}>{t.education}</Text>
                  {data.education.map(edu => (
                    <View key={edu.id} style={styles.itemContainer}>
                      <View style={styles.itemHeader}>
                        <View>
                          <Text style={styles.itemTitle}>{edu.school}</Text>
                          <Text style={styles.itemSubtitle}>
                            {edu.degree} - {edu.major}
                            {edu.gpa ? ` | GPA: ${edu.gpa}` : ''}
                          </Text>
                        </View>
                        <Text style={styles.itemDate}>
                          {edu.startDate} - {edu.endDate}
                        </Text>
                      </View>
                      {edu.description?.map((desc, idx) => (
                        <Text key={idx} style={styles.bulletPoint}>• {desc}</Text>
                      ))}
                    </View>
                  ))}
                </View>
              );

            case 'projects':
              if (data.projects.length === 0) return null;
              return (
                <View key={section.id} style={styles.section}>
                  <Text style={styles.sectionTitle}>{t.projects}</Text>
                  {data.projects.map(proj => (
                    <View key={proj.id} style={styles.itemContainer}>
                      <View style={styles.itemHeader}>
                        <View>
                          <Text style={styles.itemTitle}>{proj.name}</Text>
                          {proj.role && (
                            <Text style={styles.itemSubtitle}>{proj.role}</Text>
                          )}
                        </View>
                        <Text style={styles.itemDate}>
                          {proj.startDate} - {proj.current ? t.present : proj.endDate}
                        </Text>
                      </View>
                      {proj.description.map((desc, idx) => (
                        <Text key={idx} style={styles.bulletPoint}>• {desc}</Text>
                      ))}
                      {proj.technologies && proj.technologies.length > 0 && (
                        <Text style={styles.itemSubtitle}>
                          {t.technologies}: {proj.technologies.join(', ')}
                        </Text>
                      )}
                    </View>
                  ))}
                </View>
              );

            case 'skills':
              if (data.skills.length === 0) return null;
              return (
                <View key={section.id} style={styles.section}>
                  <Text style={styles.sectionTitle}>{t.skills}</Text>
                  {data.skills.map(skill => (
                    <View key={skill.id} style={styles.itemContainer}>
                      <Text style={styles.skillCategory}>{skill.category}</Text>
                      <Text style={styles.skillItems}>{skill.items.join(' • ')}</Text>
                    </View>
                  ))}
                </View>
              );

            default:
              // 处理自定义模块
              if (section.isCustom) {
                const customSection = data.customSections?.find(cs => cs.id === section.id);
                if (!customSection || customSection.items.length === 0) return null;

                return (
                  <View key={section.id} style={styles.section}>
                    <Text style={styles.sectionTitle}>{section.title}</Text>
                    {customSection.items.map(item => (
                      <View key={item.id} style={styles.itemContainer}>
                        <View style={styles.itemHeader}>
                          <View>
                            {item.title && <Text style={styles.itemTitle}>{item.title}</Text>}
                            {item.subtitle && <Text style={styles.itemSubtitle}>{item.subtitle}</Text>}
                          </View>
                          {item.date && <Text style={styles.itemDate}>{item.date}</Text>}
                        </View>
                        {item.description.map((desc, idx) => (
                          <Text key={idx} style={styles.bulletPoint}>• {desc}</Text>
                        ))}
                      </View>
                    ))}
                  </View>
                );
              }
              return null;
          }
        })}
      </Page>
    </Document>
  );
};

/**
 * Export to PDF
 */
export async function exportToPDF(
  data: ResumeData,
  filename: string = 'resume.pdf',
  translations?: PDFTranslations
): Promise<void> {
  const { pdf } = await import('@react-pdf/renderer');

  try {
    const blob = await pdf(<ResumePDF data={data} translations={translations} />).toBlob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('PDF export failed:', error);
    throw new Error('PDF export failed');
  }
}
