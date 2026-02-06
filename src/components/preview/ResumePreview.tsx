'use client';

import { useResumeStore } from '@/store/resumeStore';
import { Mail, Phone, MapPin, Globe, Linkedin, Github, Twitter, Instagram, Facebook, Youtube, Dribbble, Link, User, Briefcase, Calendar, MessageCircle, AtSign } from 'lucide-react';
import { ContactIconType } from '@/types';
import { useTranslation } from 'react-i18next';

// 联系信息图标组件
function ContactIcon({ type, className }: { type: string | ContactIconType; className?: string }) {
  const iconClass = className || "w-3 h-3 text-gray-500";
  switch (type) {
    case 'email':
    case 'mail': return <Mail className={iconClass} />;
    case 'phone': return <Phone className={iconClass} />;
    case 'location':
    case 'map-pin': return <MapPin className={iconClass} />;
    case 'website':
    case 'globe': return <Globe className={iconClass} />;
    case 'linkedin': return <Linkedin className={iconClass} />;
    case 'github': return <Github className={iconClass} />;
    case 'twitter': return <Twitter className={iconClass} />;
    case 'instagram': return <Instagram className={iconClass} />;
    case 'facebook': return <Facebook className={iconClass} />;
    case 'youtube': return <Youtube className={iconClass} />;
    case 'dribbble': return <Dribbble className={iconClass} />;
    case 'link': return <Link className={iconClass} />;
    case 'user': return <User className={iconClass} />;
    case 'briefcase': return <Briefcase className={iconClass} />;
    case 'calendar': return <Calendar className={iconClass} />;
    case 'message-circle': return <MessageCircle className={iconClass} />;
    case 'at-sign': return <AtSign className={iconClass} />;
    default: return <Globe className={iconClass} />;
  }
}

// Section 标题组件
function SectionTitle({ title, themeColor }: { title: string; themeColor: string }) {
  return (
    <div className="flex items-center gap-3 mb-2">
      <div
        className="h-1 w-8 rounded-full"
        style={{ backgroundColor: themeColor }}
      />
      <h2
        className="text-sm font-bold tracking-wide uppercase"
        style={{ color: '#374151' }}
      >
        {title}
      </h2>
    </div>
  );
}

// 项目符号列表组件
function BulletList({ items }: { items: string[] }) {
  const filteredItems = items.filter(item => item && item.trim());
  if (filteredItems.length === 0) return null;

  return (
    <ul className="mt-1.5 space-y-1">
      {filteredItems.map((item, idx) => (
        <li key={idx} className="flex text-xs text-gray-700 leading-relaxed">
          <span className="mr-2 text-gray-400 font-bold">•</span>
          <span className="flex-1">{item}</span>
        </li>
      ))}
    </ul>
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
          {[...Array(3)].map((_, i) => (
            <div key={i}>
              <div className="h-5 bg-gray-200 rounded w-1/4 mb-3"></div>
              <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const { personalInfo, experience, education, projects, skills, sections, theme } = resume;

  const visibleSections = sections
    .filter(s => s.visible)
    .sort((a, b) => a.order - b.order);

  // URL 安全检查
  const sanitizeUrl = (url: string | undefined): string | undefined => {
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
  };

  // 获取 section 标题，优先使用自定义标题，否则使用 i18n
  const getSectionTitle = (sectionId: string, customTitle?: string): string => {
    if (customTitle) return customTitle;
    switch (sectionId) {
      case 'experience': return t('preview.experience');
      case 'education': return t('preview.education');
      case 'projects': return t('preview.projects');
      case 'skills': return t('preview.skills');
      default: return '';
    }
  };

  // 基础联系信息项（使用自定义图标配置）
  const iconConfig = personalInfo.iconConfig || {};
  const baseContactItems = [
    { type: iconConfig.emailIcon || 'mail', value: personalInfo.email, href: sanitizeUrl(personalInfo.email) },
    { type: iconConfig.phoneIcon || 'phone', value: personalInfo.phone, href: sanitizeUrl(personalInfo.phone) },
    { type: iconConfig.locationIcon || 'map-pin', value: personalInfo.location, href: undefined },
    { type: iconConfig.websiteIcon || 'globe', value: personalInfo.website, href: sanitizeUrl(personalInfo.website) },
  ].filter(item => item.value);

  // 自定义联系方式
  const customContacts = (personalInfo.contacts || [])
    .filter(c => c.value)
    .sort((a, b) => a.order - b.order)
    .map(c => ({ type: c.type, value: c.value, href: c.href ? sanitizeUrl(c.href) : sanitizeUrl(c.value) }));

  const allContactItems = [...baseContactItems, ...customContacts];

  return (
    <div
      id="resume-preview"
      className="bg-white shadow-lg mx-auto"
      style={{
        width: '595px',
        minHeight: '842px',
        fontFamily: theme.fontFamily,
        fontSize: `${theme.fontSize}pt`,
        lineHeight: theme.lineHeight,
      }}
    >
      {/* 顶部主题色条 */}
      <div
        className="h-2 w-full"
        style={{ backgroundColor: theme.primaryColor }}
      />

      {/* 内容区域 */}
      <div className="px-12 py-8">
        {/* 个人信息头部 */}
        <header className="mb-6">
          {/* 姓名 - 只有用户输入了才显示 */}
          {personalInfo.name && (
            <h1
              className="text-2xl font-bold tracking-wide"
              style={{ color: theme.primaryColor }}
            >
              {personalInfo.name}
            </h1>
          )}

          {/* 职位 */}
          {personalInfo.title && (
            <p className="text-sm text-gray-600 mt-1">{personalInfo.title}</p>
          )}

          {/* 个人简介 */}
          {personalInfo.summary && (
            <p className="text-xs text-gray-600 mt-2 leading-relaxed">
              {personalInfo.summary}
            </p>
          )}

          {/* 联系方式 - 每行两个 */}
          {allContactItems.length > 0 && (
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-3">
              {allContactItems.map(({ type, value, href }, idx) => (
                <div key={`${type}-${idx}`} className="flex items-center gap-1.5 min-w-0">
                  <ContactIcon type={type} />
                  {href && theme.enableLinks !== false ? (
                    <a
                      href={href}
                      className="text-xs text-gray-600 hover:text-gray-900 hover:underline truncate"
                      target={href.startsWith('mailto:') || href.startsWith('tel:') ? undefined : '_blank'}
                      rel={href.startsWith('http') ? 'noopener noreferrer' : undefined}
                    >
                      {value}
                    </a>
                  ) : (
                    <span className="text-xs text-gray-600 truncate">{value}</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </header>

        {/* 各个 Section */}
        {visibleSections.map(section => {
          switch (section.id) {
            case 'summary':
              // 简介已经在头部显示，这里不重复
              return null;

            case 'experience':
              if (experience.length === 0) return null;
              return (
                <section key={section.id} className="mb-5">
                  <SectionTitle title={getSectionTitle(section.id, section.title)} themeColor={theme.primaryColor} />
                  <div className="space-y-3">
                    {experience.map((exp, idx) => {
                      // 如果与上一条是同一家公司，隐藏公司名
                      const hideCompany = idx > 0 && exp.company === experience[idx - 1].company;

                      return (
                        <div key={exp.id}>
                          {!hideCompany && (
                            <h3 className="text-sm font-semibold text-gray-800">
                              {exp.company}
                            </h3>
                          )}
                          <div className="flex justify-between items-baseline mt-0.5">
                            <span className="text-xs text-gray-700">
                              {exp.position}
                              {exp.location && <span className="text-gray-500"> · {exp.location}</span>}
                            </span>
                            <span className="text-xs text-gray-500">
                              {exp.startDate}{exp.current ? t('preview.present') : exp.endDate}
                            </span>
                          </div>
                          <BulletList items={exp.description} />
                        </div>
                      );
                    })}
                  </div>
                </section>
              );

            case 'education':
              if (education.length === 0) return null;
              return (
                <section key={section.id} className="mb-5">
                  <SectionTitle title={getSectionTitle(section.id, section.title)} themeColor={theme.primaryColor} />
                  <div className="space-y-3">
                    {education.map((edu, idx) => {
                      const hideSchool = idx > 0 && edu.school === education[idx - 1].school;

                      return (
                        <div key={edu.id}>
                          {!hideSchool && (
                            <h3 className="text-sm font-semibold text-gray-800">
                              {edu.school}
                            </h3>
                          )}
                          <div className="flex justify-between items-baseline mt-0.5">
                            <span className="text-xs text-gray-700">
                              {edu.degree}
                              {edu.major && ` - ${edu.major}`}
                              {edu.gpa && <span className="text-gray-500"> · GPA: {edu.gpa}</span>}
                            </span>
                            <span className="text-xs text-gray-500">
                              {edu.startDate}{edu.endDate}
                            </span>
                          </div>
                          {edu.description && <BulletList items={edu.description} />}
                        </div>
                      );
                    })}
                  </div>
                </section>
              );

            case 'projects':
              if (projects.length === 0) return null;
              return (
                <section key={section.id} className="mb-5">
                  <SectionTitle title={getSectionTitle(section.id, section.title)} themeColor={theme.primaryColor} />
                  <div className="space-y-3">
                    {projects.map(proj => (
                      <div key={proj.id}>
                        <div className="flex justify-between items-baseline">
                          <h3 className="text-sm font-semibold text-gray-800">
                            {proj.name}
                            {proj.role && (
                              <span className="font-normal text-gray-600"> · {proj.role}</span>
                            )}
                          </h3>
                          <span className="text-xs text-gray-500">
                            {proj.startDate}{proj.current ? t('preview.present') : proj.endDate}
                          </span>
                        </div>
                        <BulletList items={proj.description} />
                        {proj.technologies && proj.technologies.length > 0 && (
                          <p className="text-xs text-gray-500 mt-1.5">
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
                <section key={section.id} className="mb-5">
                  <SectionTitle title={getSectionTitle(section.id, section.title)} themeColor={theme.primaryColor} />
                  <div className="space-y-2">
                    {skills.map(skill => (
                      <div key={skill.id} className="text-xs">
                        {skill.category && (
                          <span className="font-semibold text-gray-800 mr-2">
                            {skill.category}:
                          </span>
                        )}
                        <span className="text-gray-700">
                          {skill.items.map((item, idx) => (
                            <span key={idx}>
                              {idx > 0 && <span className="mx-1.5 text-gray-400">•</span>}
                              {item}
                            </span>
                          ))}
                        </span>
                      </div>
                    ))}
                  </div>
                </section>
              );

            default:
              return null;
          }
        })}
      </div>
    </div>
  );
}
