'use client';

import { useResumeStore } from '@/store/resumeStore';
import { Mail, Phone, MapPin, Globe, Linkedin, Github, Twitter, Instagram, Facebook, Youtube, Dribbble, Link, User, Briefcase, Calendar, MessageCircle, AtSign } from 'lucide-react';
import { ContactIconType, CustomSection, Education, Experience, Project, SectionConfig, Skill, ThemeConfig } from '@/types';
import { useTranslation } from 'react-i18next';

const SKELETON_SECTION_KEYS = ['skeleton-1', 'skeleton-2', 'skeleton-3'];

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

function sanitizeUrl(url: string | undefined): string | undefined {
  if (!url) return undefined;
  const trimmed = url.trim();

  // 只允许 http, https, mailto, tel 协议
  if (/^(https?:\/\/|mailto:|tel:)/i.test(trimmed)) {
    return trimmed;
  }

  // 如果看起来像邮箱，添加 mailto:
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
    return `mailto:${trimmed}`;
  }

  // 如果看起来像电话号码，添加 tel:
  if (/^[\d\s\-+()]+$/.test(trimmed) && trimmed.replace(/\D/g, '').length >= 7) {
    return `tel:${trimmed.replace(/\s/g, '')}`;
  }

  // 如果看起来像域名，添加 https://
  if (/^[a-zA-Z0-9][-a-zA-Z0-9]*\.[a-zA-Z]{2,}/.test(trimmed)) {
    return `https://${trimmed}`;
  }

  return undefined;
}

function getSectionTitle(sectionId: string, customTitle: string | undefined, t: (key: string) => string): string {
  if (customTitle) return customTitle;

  switch (sectionId) {
    case 'experience':
      return t('preview.experience');
    case 'education':
      return t('preview.education');
    case 'projects':
      return t('preview.projects');
    case 'skills':
      return t('preview.skills');
    default:
      return '';
  }
}

// 联系信息图标组件
function ContactIcon({ type, className }: { type: string | ContactIconType; className?: string }) {
  const iconClass = className || 'w-3 h-3 text-gray-500';
  switch (type) {
    case 'email':
    case 'mail':
      return <Mail className={iconClass} />;
    case 'phone':
      return <Phone className={iconClass} />;
    case 'location':
    case 'map-pin':
      return <MapPin className={iconClass} />;
    case 'website':
    case 'globe':
      return <Globe className={iconClass} />;
    case 'linkedin':
      return <Linkedin className={iconClass} />;
    case 'github':
      return <Github className={iconClass} />;
    case 'twitter':
      return <Twitter className={iconClass} />;
    case 'instagram':
      return <Instagram className={iconClass} />;
    case 'facebook':
      return <Facebook className={iconClass} />;
    case 'youtube':
      return <Youtube className={iconClass} />;
    case 'dribbble':
      return <Dribbble className={iconClass} />;
    case 'link':
      return <Link className={iconClass} />;
    case 'user':
      return <User className={iconClass} />;
    case 'briefcase':
      return <Briefcase className={iconClass} />;
    case 'calendar':
      return <Calendar className={iconClass} />;
    case 'message-circle':
      return <MessageCircle className={iconClass} />;
    case 'at-sign':
      return <AtSign className={iconClass} />;
    default:
      return <Globe className={iconClass} />;
  }
}

// Section 标题组件
function SectionTitle({ title, themeColor, fontSize }: { title: string; themeColor: string; fontSize: number }) {
  return (
    <div className="flex items-center gap-3 mb-2">
      <div
        className="h-1 w-8 rounded-full"
        style={{ backgroundColor: themeColor }}
      />
      <h2
        className="font-bold tracking-wide uppercase"
        style={{ color: '#374151', fontSize: `${fontSize + 2}pt` }}
      >
        {title}
      </h2>
    </div>
  );
}

// 项目符号列表组件
function BulletList({ items, fontSize }: { items: string[]; fontSize: number }) {
  const filteredItems = items.filter(item => item && item.trim());
  if (filteredItems.length === 0) return null;
  const keyedItems = withStableStringKey(filteredItems, 'bullet');

  return (
    <ul className="mt-1.5 space-y-1">
      {keyedItems.map((item) => (
        <li key={item.key} className="flex text-gray-700" style={{ fontSize: `${fontSize - 1}pt` }}>
          <span className="mr-2 text-gray-400 font-bold">•</span>
          <span className="flex-1">{item.value}</span>
        </li>
      ))}
    </ul>
  );
}

interface ResumeSectionsProps {
  visibleSections: SectionConfig[];
  experience: Experience[];
  education: Education[];
  projects: Project[];
  skills: Skill[];
  customSections: CustomSection[];
  theme: ThemeConfig;
  fs: number;
  t: (key: string) => string;
}

function ResumeSections({
  visibleSections,
  experience,
  education,
  projects,
  skills,
  customSections,
  theme,
  fs,
  t,
}: ResumeSectionsProps) {
  return (
    <>
      {visibleSections.map(section => {
        switch (section.id) {
          case 'summary':
            // 简介已经在头部显示，这里不重复
            return null;

          case 'experience':
            if (experience.length === 0) return null;
            return (
              <section key={section.id} style={{ marginBottom: `${theme.spacing * 2}pt` }}>
                <SectionTitle title={getSectionTitle(section.id, section.title, t)} themeColor={theme.primaryColor} fontSize={fs} />
                <div className="space-y-3">
                  {experience.map((exp, idx) => {
                    const hideCompany = idx > 0 && exp.company === experience[idx - 1].company;

                    return (
                      <div key={exp.id}>
                        {!hideCompany && (
                          <h3 className="font-semibold text-gray-800" style={{ fontSize: `${fs}pt` }}>
                            {exp.company}
                          </h3>
                        )}
                        <div className="flex justify-between items-baseline mt-0.5">
                          <span className="text-gray-700" style={{ fontSize: `${fs - 1}pt` }}>
                            {exp.position}
                            {exp.location && <span className="text-gray-500"> · {exp.location}</span>}
                          </span>
                          <span className="text-gray-500" style={{ fontSize: `${fs - 1}pt` }}>
                            {exp.startDate || exp.endDate || exp.current ? (
                              <>
                                {exp.startDate}
                                {(exp.startDate && (exp.endDate || exp.current)) && ' - '}
                                {exp.current ? t('preview.present') : exp.endDate}
                              </>
                            ) : null}
                          </span>
                        </div>
                        <BulletList items={exp.description} fontSize={fs} />
                      </div>
                    );
                  })}
                </div>
              </section>
            );

          case 'education':
            if (education.length === 0) return null;
            return (
              <section key={section.id} style={{ marginBottom: `${theme.spacing * 2}pt` }}>
                <SectionTitle title={getSectionTitle(section.id, section.title, t)} themeColor={theme.primaryColor} fontSize={fs} />
                <div className="space-y-3">
                  {education.map((edu, idx) => {
                    const hideSchool = idx > 0 && edu.school === education[idx - 1].school;

                    return (
                      <div key={edu.id}>
                        {!hideSchool && (
                          <h3 className="font-semibold text-gray-800" style={{ fontSize: `${fs}pt` }}>
                            {edu.school}
                          </h3>
                        )}
                        <div className="flex justify-between items-baseline mt-0.5">
                          <span className="text-gray-700" style={{ fontSize: `${fs - 1}pt` }}>
                            {edu.degree}
                            {edu.major && ` - ${edu.major}`}
                            {edu.gpa && <span className="text-gray-500"> · GPA: {edu.gpa}</span>}
                          </span>
                          <span className="text-gray-500" style={{ fontSize: `${fs - 1}pt` }}>
                            {edu.startDate || edu.endDate ? (
                              <>
                                {edu.startDate}
                                {edu.startDate && edu.endDate && ' - '}
                                {edu.endDate}
                              </>
                            ) : null}
                          </span>
                        </div>
                        {edu.description && <BulletList items={edu.description} fontSize={fs} />}
                      </div>
                    );
                  })}
                </div>
              </section>
            );

          case 'projects':
            if (projects.length === 0) return null;
            return (
              <section key={section.id} style={{ marginBottom: `${theme.spacing * 2}pt` }}>
                <SectionTitle title={getSectionTitle(section.id, section.title, t)} themeColor={theme.primaryColor} fontSize={fs} />
                <div className="space-y-3">
                  {projects.map(proj => (
                    <div key={proj.id}>
                      <div className="flex justify-between items-baseline">
                        <h3 className="font-semibold text-gray-800" style={{ fontSize: `${fs}pt` }}>
                          {proj.name}
                          {proj.role && (
                            <span className="font-normal text-gray-600"> · {proj.role}</span>
                          )}
                        </h3>
                        <span className="text-gray-500" style={{ fontSize: `${fs - 1}pt` }}>
                          {proj.startDate || proj.endDate || proj.current ? (
                            <>
                              {proj.startDate}
                              {(proj.startDate && (proj.endDate || proj.current)) && ' - '}
                              {proj.current ? t('preview.present') : proj.endDate}
                            </>
                          ) : null}
                        </span>
                      </div>
                      <BulletList items={proj.description} fontSize={fs} />
                      {proj.technologies && proj.technologies.length > 0 && (
                        <p className="text-gray-500 mt-1.5" style={{ fontSize: `${fs - 1}pt` }}>
                          <span className="font-medium">{t('preview.technologies')}</span>
                          {proj.technologies.join(' · ')}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            );

          case 'skills':
            if (skills.length === 0) return null;
            return (
              <section key={section.id} style={{ marginBottom: `${theme.spacing * 2}pt` }}>
                <SectionTitle title={getSectionTitle(section.id, section.title, t)} themeColor={theme.primaryColor} fontSize={fs} />
                <div className="space-y-2">
                  {skills.map(skill => (
                    <div key={skill.id} style={{ fontSize: `${fs - 1}pt` }}>
                      {skill.category && (
                        <span className="font-semibold text-gray-800 mr-2">
                          {skill.category}:
                        </span>
                      )}
                      <span className="text-gray-700">
                        {withStableStringKey(skill.items, 'skill-item').map((item, idx) => (
                          <span key={item.key}>
                            {idx > 0 && <span className="mx-1.5 text-gray-400">•</span>}
                            {item.value}
                          </span>
                        ))}
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            );

          default:
            // 处理自定义模块
            if (section.isCustom) {
              const customSection = customSections.find(cs => cs.id === section.id);
              if (!customSection || customSection.items.length === 0) return null;

              return (
                <section key={section.id} style={{ marginBottom: `${theme.spacing * 2}pt` }}>
                  <SectionTitle title={section.title} themeColor={theme.primaryColor} fontSize={fs} />
                  <div className="space-y-3">
                    {customSection.items.map(item => (
                      <div key={item.id}>
                        <div className="flex justify-between items-baseline">
                          {item.title && (
                            <h3 className="font-semibold text-gray-800" style={{ fontSize: `${fs}pt` }}>
                              {item.title}
                            </h3>
                          )}
                          {item.date && (
                            <span className="text-gray-500" style={{ fontSize: `${fs - 1}pt` }}>{item.date}</span>
                          )}
                        </div>
                        {item.subtitle && (
                          <p className="text-gray-600 mt-0.5" style={{ fontSize: `${fs - 1}pt` }}>{item.subtitle}</p>
                        )}
                        <BulletList items={item.description} fontSize={fs} />
                      </div>
                    ))}
                  </div>
                </section>
              );
            }
            return null;
        }
      })}
    </>
  );
}

export function ResumePreview() {
  const { t } = useTranslation();
  const { resume, hasHydrated } = useResumeStore();

  if (!hasHydrated) {
    return (
      <div
        className="bg-white shadow-lg mx-auto animate-pulse"
        style={{ width: '595px', minHeight: '842px', padding: '50px' }}
      >
        <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className="h-5 bg-gray-200 rounded w-1/4 mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-2/3 mb-8"></div>
        <div className="space-y-6">
          {SKELETON_SECTION_KEYS.map((key) => (
            <div key={key}>
              <div className="h-5 bg-gray-200 rounded w-1/4 mb-3"></div>
              <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const { personalInfo, experience, education, projects, skills, customSections, sections, theme } = resume;

  const visibleSections = sections
    .filter(s => s.visible)
    .sort((a, b) => a.order - b.order);

  const iconConfig = personalInfo.iconConfig || {};

  const baseContactItems = [
    { type: iconConfig.emailIcon || 'mail', value: personalInfo.email, href: sanitizeUrl(personalInfo.email) },
    { type: iconConfig.phoneIcon || 'phone', value: personalInfo.phone, href: sanitizeUrl(personalInfo.phone) },
    { type: iconConfig.locationIcon || 'map-pin', value: personalInfo.location, href: undefined },
    { type: iconConfig.websiteIcon || 'globe', value: personalInfo.website, href: sanitizeUrl(personalInfo.website) },
    { type: iconConfig.linkedinIcon || 'linkedin', value: personalInfo.linkedin, href: sanitizeUrl(personalInfo.linkedin) },
    { type: iconConfig.githubIcon || 'github', value: personalInfo.github, href: sanitizeUrl(personalInfo.github) },
  ].filter(item => item.value);

  const customContacts = (personalInfo.contacts || [])
    .filter(c => c.value)
    .sort((a, b) => a.order - b.order)
    .map(c => ({ type: c.type, value: c.value, href: c.href ? sanitizeUrl(c.href) : sanitizeUrl(c.value) }));

  const allContactItems = [...baseContactItems, ...customContacts];
  const keyedContactItems = withStableStringKey(
    allContactItems.map((item) => `${item.type}|${item.value}|${item.href || ''}`),
    'contact'
  ).map((item, index) => ({ key: item.key, ...allContactItems[index] }));

  const fs = theme.fontSize;

  return (
    <div
      id="resume-preview"
      className="bg-white shadow-lg mx-auto"
      style={{
        width: '595px',
        minHeight: '842px',
        fontFamily: `"${theme.fontFamily}", "Noto Sans SC", system-ui, sans-serif`,
        fontSize: `${fs}pt`,
        lineHeight: theme.lineHeight,
      }}
    >
      <div className="h-2 w-full" style={{ backgroundColor: theme.primaryColor }} />

      <div className="px-12 py-8">
        <header style={{ marginBottom: `${theme.spacing * 2}pt` }}>
          {personalInfo.name && (
            <h1
              className="font-bold tracking-wide"
              style={{ color: theme.primaryColor, fontSize: `${fs + 8}pt` }}
            >
              {personalInfo.name}
            </h1>
          )}

          {personalInfo.title && (
            <p className="text-gray-600 mt-1" style={{ fontSize: `${fs + 2}pt` }}>{personalInfo.title}</p>
          )}

          {personalInfo.summary && (
            <p className="text-gray-600 mt-2" style={{ fontSize: `${fs}pt` }}>
              {personalInfo.summary}
            </p>
          )}

          {allContactItems.length > 0 && (
            <div className="flex flex-wrap gap-x-5 gap-y-2 mt-3">
              {keyedContactItems.map(({ key, type, value, href }) => (
                <div key={key} className="flex items-center gap-1.5" style={{ fontSize: `${fs - 1}pt` }}>
                  <ContactIcon type={type} />
                  {href && theme.enableLinks !== false ? (
                    <a
                      href={href}
                      className="text-gray-600 hover:text-gray-900 hover:underline"
                      target={href.startsWith('mailto:') || href.startsWith('tel:') ? undefined : '_blank'}
                      rel={href.startsWith('http') ? 'noopener noreferrer' : undefined}
                    >
                      {value}
                    </a>
                  ) : (
                    <span className="text-gray-600">{value}</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </header>

        <ResumeSections
          visibleSections={visibleSections}
          experience={experience}
          education={education}
          projects={projects}
          skills={skills}
          customSections={customSections}
          theme={theme}
          fs={fs}
          t={t}
        />
      </div>
    </div>
  );
}
