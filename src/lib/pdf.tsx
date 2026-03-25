import React from 'react';
import { ResumeData, SkillLevel, SectionConfig, Experience, Education, Project, Skill } from '@/types';
import { getPDFFontFamily, registerCJKHyphenation } from '@/lib/pdfFonts';
import { getPaperPointSize } from '@/lib/paper';
import { resolveSkillLogo } from '@/lib/skillLogo';
import { parseInlineMarkdown } from '@/lib/markdown';
import { toDataUrl, TRANSPARENT_PX } from '@/lib/image';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const md = parseInlineMarkdown;

function formatCompactNumber(value: number): string {
  return Intl.NumberFormat('en-US', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value);
}

function formatGitHubPath(url: string): string {
  try {
    const parsed = new URL(url);
    if (parsed.hostname === 'github.com' || parsed.hostname === 'www.github.com') {
      return parsed.pathname.replace(/^\//, '').replace(/\.git$/i, '').replace(/\/$/, '');
    }
  } catch { /* ignore */ }
  return url;
}

function formatProofRefLabel(ref: import('@/types').ProjectProofRef): string {
  if (ref.type === 'pr' && ref.number) return `PR #${ref.number}`;
  if (ref.type === 'issue' && ref.number) return `#${ref.number}`;
  if (ref.type === 'commit') {
    const commitMatch = ref.url.match(/\/commit\/([a-f0-9]{7,})/i);
    if (commitMatch) return commitMatch[1].substring(0, 7);
  }
  const prMatch = ref.url.match(/\/pull\/(\d+)/);
  if (prMatch) return `PR #${prMatch[1]}`;
  const issueMatch = ref.url.match(/\/issues\/(\d+)/);
  if (issueMatch) return `#${issueMatch[1]}`;
  return ref.title || ref.url.replace(/^https?:\/\/(www\.)?github\.com\//, '');
}

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

export function sanitizeUrl(url: string | undefined): string | undefined {
  if (!url) return undefined;
  const trimmed = url.trim();

  if (/^(https?:\/\/|mailto:|tel:)/i.test(trimmed)) {
    return trimmed;
  }

  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
    return `mailto:${trimmed}`;
  }

  if (/^[\d\s\-+()]+$/.test(trimmed) && trimmed.replace(/\D/g, '').length >= 7) {
    return `tel:${trimmed.replace(/\s/g, '')}`;
  }

  if (/^[a-zA-Z0-9][-a-zA-Z0-9]*\.[a-zA-Z]{2,}/.test(trimmed)) {
    return `https://${trimmed}`;
  }

  return undefined;
}

const isSafePdfUrl = (url: string | undefined): boolean => {
  if (!url) return false;
  return /^(https?:\/\/|mailto:|tel:)/i.test(url);
};

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
  const { Document, Page, Text, View, StyleSheet, Svg, Path, Image, Link, Circle } = renderer;

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
      paddingHorizontal: 32,
      paddingTop: 18,
      paddingBottom: 17,
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
      lineHeight: 1,
    },
    title: {
      fontSize: theme.fontSize + 2,
      color: '#4b5563',
      marginTop: 1,
    },
    contactInfo: {
      fontSize: theme.fontSize - 1,
      color: '#4b5563',
      marginTop: 2,
      flexDirection: 'row',
      flexWrap: 'wrap',
    },
    contactItem: {
      color: '#4b5563',
    },
    summary: {
      fontSize: theme.fontSize - 1,
      marginTop: 1,
      lineHeight: theme.lineHeight,
      color: '#374151',
    },
    section: {
      marginBottom: theme.spacing * 2 - 0.5,
    },
    sectionTitle: {
      fontSize: theme.fontSize + 2,
      fontWeight: 'bold',
      color: '#374151',
    },
    sectionTitleBar: {
      width: 24,
      height: 3,
      borderRadius: 2,
      backgroundColor: theme.primaryColor,
      marginRight: 8,
    },
    sectionTitleRow: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      marginBottom: 3,
    },
    itemContainer: {
      marginBottom: 5,
    },
    itemHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 2,
    },
    itemHeaderMain: {
      flexGrow: 1,
      flexShrink: 1,
    },
    itemTitle: {
      fontSize: theme.fontSize,
      fontWeight: 'bold',
      lineHeight: 1,
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
      lineHeight: 1,
    },
    descriptionLine: {
      fontSize: theme.fontSize - 1,
      color: '#374151',
      marginBottom: 0.5,
      lineHeight: 1.1,
    },
    bulletPoint: {
      fontSize: theme.fontSize - 1,
      color: '#374151',
      marginBottom: 0.5,
      marginLeft: 8,
      lineHeight: 1.1,
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
      marginBottom: 2,
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
        <View style={{ width: '100%', height: 5, backgroundColor: theme.primaryColor }} />
        <View style={styles.header}>
          <Text style={styles.name}>{data.personalInfo.name}</Text>
          {data.personalInfo.title ? (
            <Text style={styles.title}>{data.personalInfo.title}</Text>
          ) : null}
          {data.personalInfo.summary ? (
            <Text style={styles.summary}>{md(data.personalInfo.summary)}</Text>
          ) : null}
          <View style={[styles.contactInfo, { marginTop: data.personalInfo.summary ? 4 : 1 }]}>
            {[
              { type: data.personalInfo.iconConfig?.emailIcon || 'mail', value: data.personalInfo.email, href: sanitizeUrl(data.personalInfo.email) },
              { type: data.personalInfo.iconConfig?.phoneIcon || 'phone', value: data.personalInfo.phone, href: sanitizeUrl(data.personalInfo.phone) },
              { type: data.personalInfo.iconConfig?.locationIcon || 'map-pin', value: data.personalInfo.location, href: undefined },
              { type: data.personalInfo.iconConfig?.websiteIcon || 'globe', value: data.personalInfo.website, href: sanitizeUrl(data.personalInfo.website) },
              { type: data.personalInfo.iconConfig?.linkedinIcon || 'linkedin', value: data.personalInfo.linkedin, href: sanitizeUrl(data.personalInfo.linkedin) },
              { type: data.personalInfo.iconConfig?.githubIcon || 'github', value: data.personalInfo.github, href: sanitizeUrl(data.personalInfo.github) },
              ...(data.personalInfo.contacts || []).filter(c => c.value).sort((a, b) => a.order - b.order).map(c => ({
                type: c.type, value: c.value, href: c.href ? sanitizeUrl(c.href) : sanitizeUrl(c.value)
              }))
            ].filter(c => c.value).map((contact, idx) => {
              let iconSvg = null;
              const type = contact.type || 'link';
              if (type.includes('mail')) {
                iconSvg = <Path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" stroke="#6b7280" strokeWidth={1.5} fill="none" strokeLinecap="round" strokeLinejoin="round" />;
              } else if (type.includes('phone')) {
                iconSvg = <Path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z" stroke="#6b7280" strokeWidth={1.5} fill="none" strokeLinecap="round" strokeLinejoin="round" />;
              } else if (type.includes('github')) {
                iconSvg = <Path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" fill="#6b7280" />;
              } else if (type.includes('linkedin')) {
                iconSvg = <Path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6zM2 9h4v12H2z M4 6a2 2 0 110-4 2 2 0 010 4z" stroke="#6b7280" strokeWidth={1.5} fill="none" strokeLinecap="round" strokeLinejoin="round" />;
              } else if (type.includes('map') || type.includes('location')) {
                iconSvg = <Path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z M12 13a3 3 0 100-6 3 3 0 000 6z" stroke="#6b7280" strokeWidth={1.5} fill="none" strokeLinecap="round" strokeLinejoin="round" />;
              } else if (type.includes('website') || type.includes('globe')) {
                iconSvg = <><Circle cx="12" cy="12" r="10" stroke="#6b7280" strokeWidth={1.5} fill="none" /><Path d="M12 2a14.5 14.5 0 000 20 14.5 14.5 0 000-20z M2 12h20" stroke="#6b7280" strokeWidth={1.5} fill="none" strokeLinecap="round" strokeLinejoin="round" /></>;
              } else {
                iconSvg = <Path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="#6b7280" strokeWidth={1.5} fill="none" strokeLinecap="round" strokeLinejoin="round" />;
              }

              return (
                <View key={`${contact.value}-${idx}`} style={{ flexDirection: 'row', alignItems: 'center', marginRight: 12, marginBottom: 2 }}>
                  <Svg viewBox="0 0 24 24" style={{ width: 9, height: 9, marginRight: 4 }}>
                    {iconSvg}
                  </Svg>
                  <Text style={styles.contactItem}>
                    {contact.href && isSafePdfUrl(contact.href) && theme.enableLinks !== false ? (
                      <Link src={contact.href} style={{ textDecoration: 'none', color: '#4b5563' }}>
                        {contact.value}
                      </Link>
                    ) : (
                      contact.value
                    )}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        {data.sections
          .filter((section) => section.visible)
          .sort((a, b) => a.order - b.order)
          .map((section) => {
            const renderSection = (section: SectionConfig, ctxData: ResumeData): React.ReactNode => {
              switch (section.id) {
                case 'summary':
                  return null;

              case 'experience':
                if (ctxData.experience.length === 0) return null;
                return (
                  <View key={section.id} style={styles.section}>
                    <View style={styles.sectionTitleRow}>
                      <View style={styles.sectionTitleBar} />
                      <Text style={styles.sectionTitle}>{section.title || translations.experience}</Text>
                    </View>
                    {ctxData.experience.map((exp, idx, arr) => {
                      const hideCompany = idx > 0 && exp.company === arr[idx - 1].company;
                      return (
                      <View key={exp.id} style={styles.itemContainer} minPresenceAhead={8}>
                        <View style={styles.itemHeader}>
                          <View style={styles.itemHeaderMain}>
                            {!hideCompany && <Text style={styles.itemTitle}>{exp.company}</Text>}
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginTop: hideCompany ? 0 : 1 }}>
                              <Text style={{ fontSize: theme.fontSize - 1, color: '#374151' }}>
                                {exp.position}
                                {exp.location ? <Text style={{ color: '#6b7280' }}> · {exp.location}</Text> : null}
                              </Text>
                              <Text style={styles.itemDate}>
                                {getDateRange(exp.startDate, exp.endDate, exp.current, translations.present)}
                              </Text>
                            </View>
                          </View>
                        </View>
                        {exp.showBulletPoints === false
                          ? getDescriptionLines(exp.description, `pdf-exp-${exp.id}`).map((desc, idx, arr) => (
                              <Text key={desc.key} style={[styles.descriptionLine, { marginBottom: idx === arr.length - 1 ? 0 : 0.5 }]}>{md(desc.value)}</Text>
                            ))
                          : getDescriptionLines(exp.description, `pdf-exp-${exp.id}`).map((desc, idx, arr) => (
                              <View key={desc.key} style={{ flexDirection: 'row', marginBottom: idx === arr.length - 1 ? 0 : 0.5 }}>
                                <Text style={{ fontSize: theme.fontSize - 1, color: '#9ca3af', fontWeight: 700, width: 8, flexShrink: 0, lineHeight: 1.1 }}>•</Text>
                                <Text style={{ fontSize: theme.fontSize - 1, color: '#374151', flex: 1, lineHeight: 1.1 }}>{md(desc.value)}</Text>
                              </View>
                            ))}
                      </View>
                    );})}
                  </View>
                );

              case 'education':
                if (ctxData.education.length === 0) return null;
                return (
                  <View key={section.id} style={styles.section}>
                    <View style={styles.sectionTitleRow}>
                      <View style={styles.sectionTitleBar} />
                      <Text style={styles.sectionTitle}>{section.title || translations.education}</Text>
                    </View>
                    {ctxData.education.map((edu, idx, arr) => {
                      const hideSchool = idx > 0 && edu.school === arr[idx - 1].school;
                      return (
                      <View key={edu.id} style={styles.itemContainer} wrap={false}>
                        <View style={styles.itemHeader}>
                          <View style={styles.itemHeaderMain}>
                            {!hideSchool && <Text style={styles.itemTitle}>{edu.school}</Text>}
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginTop: hideSchool ? 0 : 1 }}>
                              <Text style={{ fontSize: theme.fontSize - 1, color: '#374151' }}>
                                {edu.degree}
                                {edu.major ? <Text> - {edu.major}</Text> : null}
                                {edu.gpa ? <Text style={{ color: '#6b7280' }}> · GPA: {edu.gpa}</Text> : null}
                              </Text>
                              <Text style={styles.itemDate}>
                                {getDateRange(edu.startDate, edu.endDate, false, translations.present)}
                              </Text>
                            </View>
                          </View>
                        </View>
                        {edu.showBulletPoints === false
                          ? getDescriptionLines(edu.description || [], `pdf-edu-${edu.id}`).map((desc, idx, arr) => (
                              <Text key={desc.key} style={[styles.descriptionLine, { marginBottom: idx === arr.length - 1 ? 0 : 0.5 }]}>{md(desc.value)}</Text>
                            ))
                          : getDescriptionLines(edu.description || [], `pdf-edu-${edu.id}`).map((desc, idx, arr) => (
                              <View key={desc.key} style={{ flexDirection: 'row', marginBottom: idx === arr.length - 1 ? 0 : 0.5 }}>
                                <Text style={{ fontSize: theme.fontSize - 1, color: '#9ca3af', fontWeight: 700, width: 8, flexShrink: 0, lineHeight: 1.1 }}>•</Text>
                                <Text style={{ fontSize: theme.fontSize - 1, color: '#374151', flex: 1, lineHeight: 1.1 }}>{md(desc.value)}</Text>
                              </View>
                            ))}
                      </View>
                    );})}
                  </View>
                );

              case 'projects': {
                const visibleProjects = ctxData.projects.filter(p => p.visible !== false);
                if (visibleProjects.length === 0) return null;
                return (
                  <View key={section.id} style={styles.section}>
                    <View style={styles.sectionTitleRow}>
                      <View style={styles.sectionTitleBar} />
                      <Text style={styles.sectionTitle}>{section.title || translations.projects}</Text>
                    </View>
                    {visibleProjects.map((project) => {
                      const isCompact = project.layout === 'compact';
                      const projectLogoSize = isCompact ? 18 : 27;
                      const listTopMargin = isCompact ? 1.5 : 3.5;
                      const proofTopMargin = isCompact ? 1.5 : 1.5;
                      const descriptionGap = isCompact ? 1.5 : 2.5;
                      const proofGap = 0;
                      const projectDescriptions = getDescriptionLines(project.description, `pdf-proj-${project.id}`);
                      const projectProofs = project.proofs || [];
                      const repoHref = sanitizeUrl(project.repoUrl);
                      const projectHref = sanitizeUrl(project.url);

                      return (
                        <View key={project.id} style={styles.itemContainer}>
                          <View minPresenceAhead={8}>
                            <View style={[styles.itemHeader, { alignItems: 'flex-start', marginBottom: 0 }]}>
                              {project.showLogo !== false && (project.customLogo?.length || project.repoAvatarUrl?.length) ? (
                                // eslint-disable-next-line jsx-a11y/alt-text
                                <Image
                                  src={(project.customLogo || project.repoAvatarUrl)!}
                                  style={{ width: projectLogoSize, height: projectLogoSize, borderRadius: projectLogoSize / 2, marginRight: 9, objectFit: 'cover' }}
                                />
                              ) : null}
                              <View style={{ flex: 1 }}>
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', flex: 1, paddingRight: 8 }}>
                                    <Text style={styles.itemTitle}>{project.name}</Text>
                                    {project.role ? (
                                      <Text style={{ fontSize: theme.fontSize - 1, color: '#6b7280', marginLeft: 6 }}>
                                        {project.role}
                                      </Text>
                                    ) : null}
                                    {project.repoUrl ? (
                                      <View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 6 }}>
                                        <Svg viewBox="0 0 24 24" style={{ width: theme.fontSize - 2, height: theme.fontSize - 2, marginRight: 2 }}>
                                          <Path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" fill="#9ca3af" />
                                        </Svg>
                                        <Text style={{ fontSize: theme.fontSize - 2, color: '#9ca3af', lineHeight: theme.lineHeight }}>
                                          {repoHref ? (
                                            <PdfLink src={repoHref} style={{ color: '#9ca3af' }}>
                                              {formatGitHubPath(project.repoUrl)}
                                            </PdfLink>
                                          ) : (
                                            formatGitHubPath(project.repoUrl)
                                          )}
                                        </Text>
                                      </View>
                                    ) : null}
                                    {project.showStars !== false && typeof project.repoStars === 'number' && project.repoStars > 0 ? (
                                      <View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 6 }}>
                                        <Svg viewBox="0 0 24 24" style={{ width: theme.fontSize - 2, height: theme.fontSize - 2, marginRight: 2 }}>
                                          <Path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill="#d97706" />
                                        </Svg>
                                        <Text style={{ fontSize: theme.fontSize - 2, color: '#d97706', lineHeight: theme.lineHeight }}>
                                          {formatCompactNumber(project.repoStars)}
                                        </Text>
                                      </View>
                                    ) : null}
                                    {project.url ? (
                                      <View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 6 }}>
                                        <Svg viewBox="0 0 24 24" style={{ width: theme.fontSize - 2, height: theme.fontSize - 2, marginRight: 3 }}>
                                          <Path d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z" fill="#9ca3af" />
                                        </Svg>
                                        <Text style={{ fontSize: theme.fontSize - 2, color: '#9ca3af', lineHeight: theme.lineHeight }}>
                                          {projectHref ? (
                                            <PdfLink src={projectHref} style={{ color: '#9ca3af' }}>
                                              {project.url}
                                            </PdfLink>
                                          ) : (
                                            project.url
                                          )}
                                        </Text>
                                      </View>
                                    ) : null}
                                  </View>
                                  <Text style={[styles.itemDate, { flexShrink: 0, marginTop: 0 }]}>
                                    {getDateRange(project.startDate, project.endDate, project.current, translations.present)}
                                  </Text>
                                </View>
                                {projectDescriptions.length > 0 ? (
                                  <View style={{ marginTop: listTopMargin }}>
                                    {project.showBulletPoints === false
                                      ? projectDescriptions.map((desc, descIndex) => (
                                          <Text
                                            key={desc.key}
                                            style={[styles.descriptionLine, { marginBottom: descIndex === projectDescriptions.length - 1 ? 0 : descriptionGap }]}
                                          >
                                            {md(desc.value)}
                                          </Text>
                                        ))
                                      : projectDescriptions.map((desc, descIndex) => (
                                          <View key={desc.key} style={{ flexDirection: 'row', marginBottom: descIndex === projectDescriptions.length - 1 ? 0 : descriptionGap }}>
                                            <Text style={{ fontSize: theme.fontSize - 1, color: '#9ca3af', fontWeight: 700, width: 8, flexShrink: 0, lineHeight: theme.lineHeight }}>•</Text>
                                            <Text style={{ fontSize: theme.fontSize - 1, color: '#374151', flex: 1, lineHeight: theme.lineHeight }}>{md(desc.value)}</Text>
                                          </View>
                                        ))}
                                  </View>
                                ) : null}
                                {project.showTechnologies !== false && project.technologies && project.technologies.length > 0 ? (() => {
                                  const maxRender = project.layout === 'compact' ? 4 : project.technologies.length;
                                  const toRender = project.technologies.slice(0, maxRender);
                                  const hiddenCount = project.technologies.length - maxRender;
                                  return (
                                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', marginTop: listTopMargin }}>
                                      {toRender.map((tech, techIndex) => {
                                        const logo = resolveSkillLogo(tech);
                                        return (
                                          <View key={`${tech}-${techIndex}`} style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#f9fafb', borderRadius: 8, paddingHorizontal: 6, paddingVertical: 1.5, border: '0.5px solid #e5e7eb', marginRight: 4, marginBottom: 2 }}>
                                            {logo ? (
                                              <Svg viewBox="0 0 24 24" style={{ width: theme.fontSize - 2, height: theme.fontSize - 2, marginRight: 2 }}>
                                                <Path d={logo.svgPath} fill={logo.color} />
                                              </Svg>
                                            ) : null}
                                            <Text style={{ fontSize: theme.fontSize - 2, color: '#4b5563' }}>{tech}</Text>
                                          </View>
                                        );
                                      })}
                                      {hiddenCount > 0 ? (
                                        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#f9fafb', borderRadius: 8, paddingHorizontal: 6, paddingVertical: 1.5, border: '0.5px solid #e5e7eb', marginRight: 4, marginBottom: 2 }}>
                                          <Text style={{ fontSize: theme.fontSize - 2, color: '#9ca3af' }}>+{hiddenCount}</Text>
                                        </View>
                                      ) : null}
                                    </View>
                                  );
                                })() : null}
                              </View>
                            </View>
                          </View>

                          {project.showProofs !== false && projectProofs.length > 0 ? (
                            <View style={{ marginTop: proofTopMargin }}>
                              <Text style={{ fontSize: theme.fontSize - 1, lineHeight: 0.95 }}>
                                {projectProofs.map((proof, proofIndex) => (
                                  <Text key={proof.id}>
                                    <Text style={{ color: '#9ca3af' }}>• </Text>
                                    <Text
                                      style={{
                                        color: '#374151',
                                        ...(isCompact ? { maxLines: 1, textOverflow: 'ellipsis' } : {}),
                                      }}
                                    >
                                      {md(proof.summary)}
                                    </Text>
                                    {proof.refs.map((ref) => {
                                      const refHref = sanitizeUrl(ref.url);
                                      const label = ` ${formatProofRefLabel(ref)}`;
                                      return theme.enableLinks !== false && refHref ? (
                                        <Link key={ref.id} src={refHref} style={{ color: '#9ca3af', textDecoration: 'none', fontSize: theme.fontSize - 2.5, lineHeight: 0.95 }}>
                                          {label}
                                        </Link>
                                      ) : (
                                        <Text key={ref.id} style={{ color: '#9ca3af', fontSize: theme.fontSize - 2.5, lineHeight: theme.lineHeight }}>
                                          {label}
                                        </Text>
                                      );
                                    })}
                                    {proofIndex === projectProofs.length - 1 ? '' : '\n'}
                                    {proofIndex < projectProofs.length - 1 && proofGap > 0 ? '\n' : ''}
                                  </Text>
                                ))}
                              </Text>
                            </View>
                          ) : null}
                        </View>
                      );
                    })}
                  </View>
                );
              }

              case 'skills': {
                const visibleSkills = ctxData.skills.filter(s => s.visible !== false);
                if (visibleSkills.length === 0) return null;
                return (
                  <View key={section.id} style={styles.section}>
                    <View style={styles.sectionTitleRow}>
                      <View style={styles.sectionTitleBar} />
                      <Text style={styles.sectionTitle}>{section.title || translations.skills}</Text>
                    </View>
                    {visibleSkills.map((skill) => {
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
                        <View key={skill.id} style={styles.itemContainer}>
                          <View minPresenceAhead={8}>
                            <Text style={styles.skillCategory}>{skill.category}</Text>
                            <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', marginTop: 1 }}>
                              {orderedItems.map((item) => {
                                const logo = resolveSkillLogo(item.name);
                                const cs = capsuleStyle(item.level);
                                return (
                                  <View key={item.id} wrap={false} style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'nowrap', borderRadius: 100, paddingHorizontal: 6.5, paddingVertical: 0.5, marginRight: 7, marginBottom: 2.5, ...cs }}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'nowrap' }}>
                                      {item.showLogo === false ? null : item.logo ? (
                                        // eslint-disable-next-line jsx-a11y/alt-text
                                        <Image src={item.logo} style={{ width: iconSize, height: iconSize, marginRight: 4 }} />
                                      ) : logo ? (
                                        <Svg viewBox="0 0 24 24" style={{ width: iconSize, height: iconSize, marginRight: 4 }}>
                                          <Path d={logo.svgPath} fill={logo.color} />
                                        </Svg>
                                      ) : null}
                                      <Text style={{ fontSize: theme.fontSize - 0.5, color: cs.color, fontWeight: cs.fontWeight, lineHeight: 1.5 }}>
                                        {item.name}
                                      </Text>
                                    </View>
                                    {item.showContext !== false && item.context ? (
                                      <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'nowrap' }}>
                                        <View style={{ width: 1, backgroundColor: item.level === 'core' ? theme.primaryColor + '40' : item.level === 'proficient' ? '#e5e7eb' : '#d1d5db', marginHorizontal: 6, height: theme.fontSize }} />
                                        <Text style={{ fontSize: theme.fontSize - 1.5, color: item.level === 'core' ? '#4b5563' : item.level === 'proficient' ? '#6b7280' : '#9ca3af', fontWeight: 400, lineHeight: 1.3 }}>
                                          {item.context}
                                        </Text>
                                      </View>
                                    ) : null}
                                  </View>
                                );
                              })}
                            </View>
                          </View>
                        </View>
                      );
                    })}
                  </View>
                );
              }

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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let fileHandle: any = null;
    if ('showSaveFilePicker' in window) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        fileHandle = await (window as any).showSaveFilePicker({
          suggestedName: filename,
          types: [{
            description: 'PDF Document',
            accept: { 'application/pdf': ['.pdf'] },
          }],
        });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (err: any) {
        if (err.name === 'AbortError') return;
        console.warn('showSaveFilePicker failed, falling back to blob download', err);
      }
    }

    // 预转换头像 URL 为 data URL，避免 react-pdf 的 CORS 问题
    const processedData = JSON.parse(JSON.stringify(data)) as ResumeData;
    const imageUrls: Array<{ obj: Record<string, string>; key: string }> = [];
    for (const project of processedData.projects) {
      if (project.repoAvatarUrl) imageUrls.push({ obj: project as unknown as Record<string, string>, key: 'repoAvatarUrl' });
      if (project.customLogo) imageUrls.push({ obj: project as unknown as Record<string, string>, key: 'customLogo' });
    }
    for (const section of processedData.customSections) {
      for (const item of section.items) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const anyItem = item as any;
        if (anyItem.repoAvatarUrl) imageUrls.push({ obj: anyItem, key: 'repoAvatarUrl' });
        if (anyItem.customLogo) imageUrls.push({ obj: anyItem, key: 'customLogo' });
        if (anyItem.logo) imageUrls.push({ obj: anyItem, key: 'logo' });
        if (Array.isArray(anyItem.items)) {
          for (const subItem of anyItem.items) {
            if (subItem.logo) imageUrls.push({ obj: subItem, key: 'logo' });
          }
        }
      }
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
            const dataUrl = await toDataUrl(url);
            if (dataUrl === TRANSPARENT_PX) {
              obj[key] = '';
            } else {
              obj[key] = dataUrl;
            }
          } catch {
            obj[key] = '';
          }
        }
      })
    );

    const renderer = await import('@react-pdf/renderer');
    const { pdf } = renderer;

    const blob = await pdf(createResumePDF(renderer, processedData, translations)).toBlob();

    if (fileHandle) {
      const writable = await fileHandle.createWritable();
      await writable.write(blob);
      await writable.close();
    } else {
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    }
  } catch (error) {
    console.error('PDF 导出失败:', error);
    throw new Error('PDF export failed');
  }
}
