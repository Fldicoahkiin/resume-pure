'use client';

import { CSSProperties, KeyboardEvent, ReactNode } from 'react';
import NextImage from 'next/image';
import { useResumeStore } from '@/store/resumeStore';
import { Mail, Phone, MapPin, Globe, Linkedin, Github, Twitter, Instagram, Facebook, Youtube, Dribbble, Link, User, Briefcase, Calendar, MessageCircle, AtSign, Star } from 'lucide-react';
import { ContactIconType, CustomSection, Education, Experience, Project, SectionConfig, Skill, SkillItem, ThemeConfig } from '@/types';
import { useTranslation } from 'react-i18next';
import { LogoBadge } from '@/components/LogoBadge';
import { getPaperDimensions } from '@/lib/paper';
import {
  customContactAnchor,
  customItemAnchor,
  educationAnchor,
  experienceAnchor,
  personalInfoFieldAnchor,
  projectAnchor,
  projectContributionAnchor,
  sectionAnchor,
  skillAnchor,
  skillItemAnchor,
} from '@/lib/previewAnchor';
import { resolveSkillLogo } from '@/lib/skillLogo';
import { MarkdownWeb } from '@/components/preview/MarkdownWeb';

const SKELETON_SECTION_KEYS = ['skeleton-1', 'skeleton-2', 'skeleton-3'];
const DEFAULT_PAPER_DIMENSIONS = getPaperDimensions('A4');

interface ResumePreviewProps {
  onSelectAnchor?: (anchor: string) => void;
  activeAnchor?: string | null;
}

interface SelectableBlockProps {
  anchor: string;
  activeAnchor?: string | null;
  onSelectAnchor?: (anchor: string) => void;
  className?: string;
  children: ReactNode;
}

function SelectableBlock({
  anchor,
  activeAnchor,
  onSelectAnchor,
  className,
  children,
}: SelectableBlockProps) {
  const isSelectable = typeof onSelectAnchor === 'function';
  const isActive = activeAnchor === anchor;

  const handleActivate = () => {
    onSelectAnchor?.(anchor);
  };

  const interactiveClass = isSelectable
    ? 'cursor-pointer rounded-sm transition hover:bg-blue-50/70 dark:hover:bg-blue-900/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400'
    : '';
  const activeClass = isActive
    ? 'ring-2 ring-blue-400 bg-blue-50/70 dark:bg-blue-900/25'
    : '';

  const interactiveProps = isSelectable ? {
    role: 'button',
    tabIndex: 0,
    onClick: handleActivate,
    onKeyDown: (event: KeyboardEvent<HTMLDivElement>) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        handleActivate();
      }
    },
  } : {};

  return (
    <div
      {...interactiveProps}
      className={`${className || ''} ${interactiveClass} ${activeClass}`.trim()}
    >
      {children}
    </div>
  );
}

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

function getSectionTitle(sectionId: string, customTitle: string | undefined, t: (key: string, options?: Record<string, unknown>) => string): string {
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
function SectionTitle({
  title,
  themeColor,
  fontSize,
  anchor,
  activeAnchor,
  onSelectAnchor,
}: {
  title: string;
  themeColor: string;
  fontSize: number;
  anchor: string;
  activeAnchor?: string | null;
  onSelectAnchor?: (anchor: string) => void;
}) {
  return (
    <SelectableBlock
      anchor={anchor}
      activeAnchor={activeAnchor}
      onSelectAnchor={onSelectAnchor}
      className="mb-2 -mx-1 px-1"
    >
      <div className="flex items-center gap-3">
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
    </SelectableBlock>
  );
}

// 描述列表组件
function DescriptionList({
  items,
  fontSize,
  showBulletPoints = true,
}: {
  items: string[];
  fontSize: number;
  showBulletPoints?: boolean;
}) {
  const filteredItems = items
    .map((item) => item.trim())
    .filter((item) => item.length > 0);

  if (filteredItems.length === 0) return null;
  const keyedItems = withStableStringKey(filteredItems, 'bullet');

  if (!showBulletPoints) {
    return (
      <div className="mt-1.5 space-y-1">
        {keyedItems.map((item) => (
          <p key={item.key} className="text-gray-700 whitespace-pre-wrap" style={{ fontSize: `${fontSize - 1}pt` }}>
            <MarkdownWeb text={item.value} />
          </p>
        ))}
      </div>
    );
  }

  return (
    <ul className="mt-1.5 space-y-1">
      {keyedItems.map((item) => (
        <li key={item.key} className="flex text-gray-700" style={{ fontSize: `${fontSize - 1}pt` }}>
          <span className="mr-2 text-gray-400 font-bold">•</span>
          <span className="flex-1"><MarkdownWeb text={item.value} /></span>
        </li>
      ))}
    </ul>
  );
}


const PRINT_SAFE_BLOCK_STYLE: CSSProperties = {
  breakInside: 'avoid-page',
  pageBreakInside: 'avoid',
};

function formatCompactNumber(value: number): string {
  return new Intl.NumberFormat('en', {
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

function formatContributionRef(url: string): string | null {
  if (!url) return null;
  const prMatch = url.match(/\/pull\/(\d+)/);
  if (prMatch) return `PR #${prMatch[1]}`;
  const commitMatch = url.match(/\/commit\/([a-f0-9]{7,})/i);
  if (commitMatch) return commitMatch[1].substring(0, 7);
  const issueMatch = url.match(/\/issues\/(\d+)/);
  if (issueMatch) return `#${issueMatch[1]}`;
  return null;
}

function ProjectTechTags({ technologies, fontSize }: { technologies: string[]; fontSize: number }) {
  if (technologies.length === 0) return null;
  return (
    <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-gray-600" style={{ fontSize: `${fontSize - 2}pt` }}>
      {withStableStringKey(technologies, 'tech').map((tech) => {
        const logo = resolveSkillLogo(tech.value);
        return (
          <span 
            key={tech.key} 
            className="inline-flex items-center gap-1 rounded bg-gray-50 px-1.5 py-0.5 border border-gray-200"
          >
            {logo && (
              <svg
                viewBox="0 0 24 24"
                fill={logo.color}
                xmlns="http://www.w3.org/2000/svg"
                style={{ width: '1em', height: '1em', verticalAlign: 'middle', flexShrink: 0 }}
              >
                <path d={logo.svgPath} />
              </svg>
            )}
            <span>{tech.value}</span>
          </span>
        );
      })}
    </div>
  );
}

function ProjectContributionList({
  project,
  theme,
  fontSize,
  onSelectAnchor,
  activeAnchor,
}: {
  project: Project;
  theme: ThemeConfig;
  fontSize: number;
  t: (key: string, options?: Record<string, unknown>) => string;
  onSelectAnchor?: (anchor: string) => void;
  activeAnchor?: string | null;
}) {
  const contributions = project.contributions || [];
  if (project.showContributions === false || contributions.length === 0) return null;

  return (
    <div className="mt-1.5">
      <ul className="space-y-0.5">
        {contributions.map((contribution) => {
          const anchor = projectContributionAnchor(project.id, contribution.id);
          const href = sanitizeUrl(contribution.url);
          const ref = formatContributionRef(contribution.url);

          return (
            <SelectableBlock
              key={contribution.id}
              anchor={anchor}
              activeAnchor={activeAnchor}
              onSelectAnchor={onSelectAnchor}
              className="-mx-1 rounded-sm px-1"
            >
              <li className="flex text-gray-700" style={{ fontSize: `${fontSize - 1}pt` }}>
                <span className="mr-2 text-gray-400">•</span>
                <span className="flex-1">
                  <MarkdownWeb text={contribution.summary} />
                  {ref && (
                    <>
                      {' '}
                      {!onSelectAnchor && href && theme.enableLinks !== false ? (
                        <a
                          href={href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-gray-400 hover:text-blue-600 hover:underline"
                          onClick={(event) => event.stopPropagation()}
                        >
                          {ref}
                        </a>
                      ) : (
                        <span className="text-gray-400">{ref}</span>
                      )}
                    </>
                  )}
                </span>
              </li>
            </SelectableBlock>
          );
        })}
      </ul>
    </div>
  );
}

function ProjectPreviewCard({
  project,
  theme,
  fontSize,
  t,
  onSelectAnchor,
  activeAnchor,
}: {
  project: Project;
  theme: ThemeConfig;
  fontSize: number;
  t: (key: string, options?: Record<string, unknown>) => string;
  onSelectAnchor?: (anchor: string) => void;
  activeAnchor?: string | null;
}) {
  const itemAnchor = projectAnchor(project.id);
  const repoPath = project.repoUrl ? formatGitHubPath(project.repoUrl) : null;
  const repoHref = sanitizeUrl(project.repoUrl);

  return (
    <div style={PRINT_SAFE_BLOCK_STYLE}>
      <SelectableBlock
        anchor={itemAnchor}
        activeAnchor={activeAnchor}
        onSelectAnchor={onSelectAnchor}
        className="-mx-1 rounded-sm px-1 py-0.5"
      >
        <div className="flex gap-3">
          {project.showLogo !== false && (project.customLogo || project.repoAvatarUrl) && (
            <LogoBadge
              src={project.customLogo || project.repoAvatarUrl}
              alt={project.name}
              label={project.name}
              size={36}
              variant="round"
            />
          )}
          <div className="min-w-0 flex-1">
            <div className="flex justify-between gap-3">
              <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <h3 className="font-semibold text-gray-800" style={{ fontSize: `${fontSize}pt` }}>
                {project.name}
              </h3>
              {project.role && (
                <span className="text-gray-500" style={{ fontSize: `${fontSize - 1}pt` }}>
                  · {project.role}
                </span>
              )}
              {project.showStars !== false && typeof project.repoStars === 'number' && project.repoStars > 0 && (
                <span
                  className="inline-flex items-center gap-0.5 text-amber-600"
                  style={{ fontSize: `${fontSize - 2}pt` }}
                >
                  <Star size={12} />
                  {formatCompactNumber(project.repoStars)}
                </span>
              )}
            </div>
            {(repoPath || project.url) && (
              <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-gray-400" style={{ fontSize: `${fontSize - 2}pt` }}>
                {repoPath && (
                  <span className="inline-flex items-center gap-1">
                    <Github size={12} />
                    {!onSelectAnchor && repoHref && theme.enableLinks !== false ? (
                      <a
                        href={repoHref}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-blue-600 hover:underline"
                        onClick={(event) => event.stopPropagation()}
                      >
                        {repoPath}
                      </a>
                    ) : (
                      <span>{repoPath}</span>
                    )}
                  </span>
                )}
                {project.url && (
                  <span className="inline-flex items-center gap-1">
                    <Link size={12} />
                    {!onSelectAnchor && theme.enableLinks !== false ? (
                      <a
                        href={sanitizeUrl(project.url) || '#'}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-blue-600 hover:underline"
                        onClick={(event) => event.stopPropagation()}
                      >
                        {project.url}
                      </a>
                    ) : (
                      <span>{project.url}</span>
                    )}
                  </span>
                )}
              </div>
            )}
              </div>
              <span className="shrink-0 text-gray-500" style={{ fontSize: `${fontSize - 1}pt` }}>
                {project.startDate || project.endDate || project.current ? (
                  <>
                    {project.startDate}
                    {(project.startDate && (project.endDate || project.current)) && ' - '}
                    {project.current ? t('preview.present') : project.endDate}
                  </>
                ) : null}
              </span>
            </div>

        <DescriptionList
          items={project.description}
          fontSize={fontSize}
          showBulletPoints={project.showBulletPoints !== false}
        />

        {project.showTechnologies !== false && project.technologies && project.technologies.length > 0 && (
          <ProjectTechTags technologies={project.technologies} fontSize={fontSize} />
        )}
          </div>
        </div>
      </SelectableBlock>

      <ProjectContributionList
        project={project}
        theme={theme}
        fontSize={fontSize}
        t={t}
        onSelectAnchor={onSelectAnchor}
        activeAnchor={activeAnchor}
      />
    </div>
  );
}

function SkillNameDisplay({ item }: { item: SkillItem }) {
  if (item.showLogo === false) return <span>{item.name}</span>;

  if (item.logo) {
    return (
      <span className="inline-flex items-center gap-0.5">
        <NextImage
          src={item.logo}
          alt=""
          width={16}
          height={16}
          unoptimized
          style={{ width: '1em', height: '1em', verticalAlign: 'middle', flexShrink: 0, objectFit: 'contain' }}
        />
        {item.name}
      </span>
    );
  }

  const logo = resolveSkillLogo(item.name);
  return (
    <span className="inline-flex items-center gap-0.5">
      {logo && (
        <svg
          viewBox="0 0 24 24"
          fill={logo.color}
          xmlns="http://www.w3.org/2000/svg"
          style={{ width: '1em', height: '1em', verticalAlign: 'middle', flexShrink: 0 }}
        >
          <path d={logo.svgPath} />
        </svg>
      )}
      {item.name}
    </span>
  );
}

function SkillBadge({
  item,
  level,
  themeColor,
  fontSize,
  skillGroupId,
  onSelectAnchor,
  activeAnchor,
}: {
  item: SkillItem;
  level: 'core' | 'proficient' | 'familiar';
  themeColor: string;
  fontSize: number;
  skillGroupId: string;
  onSelectAnchor?: (anchor: string) => void;
  activeAnchor?: string | null;
}) {
  const anchor = skillItemAnchor(skillGroupId, item.id);

  const isCore = level === 'core';
  const isProf = level === 'proficient';

  // 现代 Capsule (Pill) 设计理念，避免大面积色块导致的图标反差问题
  // Core: 突出显示 -> 强色描边、高对比度文字
  // Proficient: 辅助显示 -> 描边、中等对比度
  // Familiar: 降级显示 -> 无描边浅色底、低对比度
  const levelStyles: CSSProperties = isCore
    ? { backgroundColor: '#ffffff', color: '#111827', border: `1px solid ${themeColor}`, fontWeight: 600, boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }
    : isProf
    ? { backgroundColor: '#ffffff', color: '#4b5563', border: '1px solid #d1d5db', fontWeight: 500 }
    : { backgroundColor: '#f3f4f6', color: '#6b7280', border: '1px solid transparent', fontWeight: 400 };

  const dividerStyle: CSSProperties = {
    width: '1px',
    height: '1.1em',
    backgroundColor: isCore ? `${themeColor}40` : isProf ? '#e5e7eb' : '#d1d5db',
  };

  const contextStyle: CSSProperties = {
    fontSize: `${fontSize - 1.5}pt`,
    fontWeight: 400,
    color: isCore ? '#4b5563' : isProf ? '#6b7280' : '#9ca3af',
  };

  return (
    <SelectableBlock
      key={item.id}
      anchor={anchor}
      activeAnchor={activeAnchor}
      onSelectAnchor={onSelectAnchor}
      className="inline-block"
    >
      <div 
        className="inline-flex items-center gap-2 rounded-full px-2.5 py-0.5 transition-all hover:shadow-sm"
        style={{ ...levelStyles, fontSize: `${fontSize - 0.5}pt`, lineHeight: '1.6' }}
      >
        <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
          <SkillNameDisplay item={item} />
        </span>
        {item.showContext !== false && item.context && (
          <>
            <div style={dividerStyle} />
            <span style={contextStyle} className="whitespace-nowrap">
              {item.context}
            </span>
          </>
        )}
      </div>
    </SelectableBlock>
  );
}

function SkillCategoryPreview({
  skill,
  fontSize,
  primaryColor,
  onSelectAnchor,
  activeAnchor,
}: {
  skill: Skill;
  fontSize: number;
  primaryColor: string;
  onSelectAnchor?: (anchor: string) => void;
  activeAnchor?: string | null;
}) {
  const categoryAnchor = skillAnchor(skill.id);

  const coreItems = skill.items.filter(i => i.level === 'core');
  const proficientItems = skill.items.filter(i => i.level === 'proficient');
  const familiarItems = skill.items.filter(i => i.level === 'familiar');

  return (
    <div style={PRINT_SAFE_BLOCK_STYLE} className="mb-3">
      <SelectableBlock
        anchor={categoryAnchor}
        activeAnchor={activeAnchor}
        onSelectAnchor={onSelectAnchor}
        className="-mx-1 mb-1 rounded-sm px-1 py-0.5"
      >
        <h3 className="font-semibold text-gray-800" style={{ fontSize: `${fontSize}pt` }}>
          {skill.category}
        </h3>
      </SelectableBlock>

      {skill.items.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 mt-1">
          {coreItems.map(item => (
            <SkillBadge key={item.id} item={item} level="core" themeColor={primaryColor} fontSize={fontSize} skillGroupId={skill.id} onSelectAnchor={onSelectAnchor} activeAnchor={activeAnchor} />
          ))}
          {/* 不需要分隔符，Capsule 本身就是出色的边界 */}
          {proficientItems.map(item => (
            <SkillBadge key={item.id} item={item} level="proficient" themeColor={primaryColor} fontSize={fontSize} skillGroupId={skill.id} onSelectAnchor={onSelectAnchor} activeAnchor={activeAnchor} />
          ))}
          {familiarItems.map(item => (
            <SkillBadge key={item.id} item={item} level="familiar" themeColor={primaryColor} fontSize={fontSize} skillGroupId={skill.id} onSelectAnchor={onSelectAnchor} activeAnchor={activeAnchor} />
          ))}
        </div>
      )}

      {skill.tags && skill.tags.length > 0 && (
        <div
          className="flex flex-wrap items-center gap-x-1 gap-y-0.5 mt-1"
          style={{ fontSize: `${fontSize - 2}pt` }}
        >
          {skill.tags.map((tag, i) => {
            const logo = resolveSkillLogo(tag);
            return (
              <span key={tag} className="inline-flex items-center gap-0.5 text-gray-400">
                {i > 0 && <span className="mx-0.5 text-gray-300">·</span>}
                {logo && (
                  <svg
                    viewBox="0 0 24 24"
                    fill={logo.color}
                    xmlns="http://www.w3.org/2000/svg"
                    style={{ width: '0.9em', height: '0.9em', verticalAlign: 'middle', flexShrink: 0, opacity: 0.7 }}
                  >
                    <path d={logo.svgPath} />
                  </svg>
                )}
                <span>{tag}</span>
              </span>
            );
          })}
        </div>
      )}
    </div>
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
  t: (key: string, options?: Record<string, unknown>) => string;
  onSelectAnchor?: (anchor: string) => void;
  activeAnchor?: string | null;
}

function renderResumeSectionsContent({
  visibleSections,
  experience,
  education,
  projects,
  skills,
  customSections,
  theme,
  fs,
  t,
  onSelectAnchor,
  activeAnchor,
}: ResumeSectionsProps) {
  return (
    <>
      {visibleSections.map(section => {
        const sectionTitleAnchor = sectionAnchor(section.id);

        switch (section.id) {
          case 'summary':
            // 简介已经在头部显示，这里不重复
            return null;

          case 'experience':
            if (experience.length === 0) return null;
            return (
              <section key={section.id} style={{ marginBottom: `${theme.spacing * 2}pt` }}>
                <SectionTitle
                  title={getSectionTitle(section.id, section.title, t)}
                  themeColor={theme.primaryColor}
                  fontSize={fs}
                  anchor={sectionTitleAnchor}
                  activeAnchor={activeAnchor}
                  onSelectAnchor={onSelectAnchor}
                />
                <div className="space-y-3">
                  {experience.map((exp, idx) => {
                    const hideCompany = idx > 0 && exp.company === experience[idx - 1].company;
                    const itemAnchor = experienceAnchor(exp.id);

                    return (
                      <SelectableBlock
                        key={exp.id}
                        anchor={itemAnchor}
                        activeAnchor={activeAnchor}
                        onSelectAnchor={onSelectAnchor}
                        className="-mx-1 px-1 py-0.5"
                      >
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
                        <DescriptionList
                          items={exp.description}
                          fontSize={fs}
                          showBulletPoints={exp.showBulletPoints !== false}
                        />
                      </SelectableBlock>
                    );
                  })}
                </div>
              </section>
            );

          case 'education':
            if (education.length === 0) return null;
            return (
              <section key={section.id} style={{ marginBottom: `${theme.spacing * 2}pt` }}>
                <SectionTitle
                  title={getSectionTitle(section.id, section.title, t)}
                  themeColor={theme.primaryColor}
                  fontSize={fs}
                  anchor={sectionTitleAnchor}
                  activeAnchor={activeAnchor}
                  onSelectAnchor={onSelectAnchor}
                />
                <div className="space-y-3">
                  {education.map((edu, idx) => {
                    const hideSchool = idx > 0 && edu.school === education[idx - 1].school;
                    const itemAnchor = educationAnchor(edu.id);

                    return (
                      <SelectableBlock
                        key={edu.id}
                        anchor={itemAnchor}
                        activeAnchor={activeAnchor}
                        onSelectAnchor={onSelectAnchor}
                        className="-mx-1 px-1 py-0.5"
                      >
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
                        {edu.description && (
                          <DescriptionList
                            items={edu.description}
                            fontSize={fs}
                            showBulletPoints={edu.showBulletPoints !== false}
                          />
                        )}
                      </SelectableBlock>
                    );
                  })}
                </div>
              </section>
            );

          case 'projects': {
            const activeProjects = projects.filter(p => p.visible !== false);
            if (activeProjects.length === 0) return null;
            return (
              <section key={section.id} style={{ marginBottom: `${theme.spacing * 2}pt` }}>
                <SectionTitle
                  title={getSectionTitle(section.id, section.title, t)}
                  themeColor={theme.primaryColor}
                  fontSize={fs}
                  anchor={sectionTitleAnchor}
                  activeAnchor={activeAnchor}
                  onSelectAnchor={onSelectAnchor}
                />
                <div className="space-y-3">
                  {activeProjects.map((project) => (
                    <ProjectPreviewCard
                      key={project.id}
                      project={project}
                      theme={theme}
                      fontSize={fs}
                      t={t}
                      onSelectAnchor={onSelectAnchor}
                      activeAnchor={activeAnchor}
                    />
                  ))}
                </div>
              </section>
            );
          }

          case 'skills': {
            const activeSkills = skills.filter(s => s.visible !== false);
            if (activeSkills.length === 0) return null;
            return (
              <section key={section.id} style={{ marginBottom: `${theme.spacing * 2}pt` }}>
                <SectionTitle
                  title={getSectionTitle(section.id, section.title, t)}
                  themeColor={theme.primaryColor}
                  fontSize={fs}
                  anchor={sectionTitleAnchor}
                  activeAnchor={activeAnchor}
                  onSelectAnchor={onSelectAnchor}
                />
                <div className="space-y-3">
                  {activeSkills.map((skill) => (
                    <SkillCategoryPreview
                      key={skill.id}
                      skill={skill}
                      fontSize={theme.fontSize}
                      primaryColor={theme.primaryColor}
                      onSelectAnchor={onSelectAnchor}
                      activeAnchor={activeAnchor}
                    />
                  ))}
                </div>
              </section>
            );
          }

          default:
            // 处理自定义模块
            if (section.isCustom) {
              const customSection = customSections.find(cs => cs.id === section.id);
              if (!customSection || customSection.items.length === 0) return null;

              return (
                <section key={section.id} style={{ marginBottom: `${theme.spacing * 2}pt` }}>
                  <SectionTitle
                    title={section.title}
                    themeColor={theme.primaryColor}
                    fontSize={fs}
                    anchor={sectionTitleAnchor}
                    activeAnchor={activeAnchor}
                    onSelectAnchor={onSelectAnchor}
                  />
                  <div className="space-y-3">
                    {customSection.items.map(item => {
                      const itemAnchor = customItemAnchor(section.id, item.id);
                      const repoPath = item.repoUrl ? formatGitHubPath(item.repoUrl) : null;
                      const repoHref = item.repoUrl ? sanitizeUrl(item.repoUrl) : undefined;

                      return (
                        <SelectableBlock
                          key={item.id}
                          anchor={itemAnchor}
                          activeAnchor={activeAnchor}
                          onSelectAnchor={onSelectAnchor}
                          className="-mx-1 px-1 py-0.5"
                        >
                          <div className="flex gap-3">
                            {item.showLogo !== false && item.repoAvatarUrl && (
                              <LogoBadge
                                src={item.repoAvatarUrl}
                                alt={item.title || ''}
                                label={item.title || ''}
                                size={36}
                                variant="round"
                              />
                            )}
                            <div className="min-w-0 flex-1">
                              <div className="flex justify-between gap-3">
                                <div className="min-w-0 flex-1">
                                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                                    {item.title && (
                                      <h3 className="font-semibold text-gray-800" style={{ fontSize: `${fs}pt` }}>
                                        {item.title}
                                      </h3>
                                    )}
                                    {item.showStars !== false && typeof item.repoStars === 'number' && item.repoStars > 0 && (
                                      <span
                                        className="inline-flex items-center gap-0.5 text-amber-600"
                                        style={{ fontSize: `${fs - 2}pt` }}
                                      >
                                        <Star size={12} />
                                        {formatCompactNumber(item.repoStars)}
                                      </span>
                                    )}
                                  </div>
                                  {item.subtitle && (
                                    <p className="text-gray-600 mt-0.5" style={{ fontSize: `${fs - 1}pt` }}>{item.subtitle}</p>
                                  )}
                                  {(repoPath || item.url) && (
                                    <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-gray-400" style={{ fontSize: `${fs - 2}pt` }}>
                                      {repoPath && (
                                        <span className="inline-flex items-center gap-1">
                                          <Github size={12} />
                                          {!onSelectAnchor && repoHref && theme.enableLinks !== false ? (
                                            <a
                                              href={repoHref}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              className="hover:text-blue-600 hover:underline"
                                              onClick={(event) => event.stopPropagation()}
                                            >
                                              {repoPath}
                                            </a>
                                          ) : (
                                            <span>{repoPath}</span>
                                          )}
                                        </span>
                                      )}
                                      {item.url && (
                                        <span className="inline-flex items-center gap-1">
                                          <Link size={12} />
                                          {!onSelectAnchor && theme.enableLinks !== false ? (
                                            <a
                                              href={sanitizeUrl(item.url) || '#'}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              className="hover:text-blue-600 hover:underline"
                                              onClick={(event) => event.stopPropagation()}
                                            >
                                              {item.url}
                                            </a>
                                          ) : (
                                            <span>{item.url}</span>
                                          )}
                                        </span>
                                      )}
                                    </div>
                                  )}
                                </div>
                                {item.date && (
                                  <span className="shrink-0 text-gray-500" style={{ fontSize: `${fs - 1}pt` }}>{item.date}</span>
                                )}
                              </div>
                              <DescriptionList
                                items={item.description}
                                fontSize={fs}
                                showBulletPoints={item.showBulletPoints !== false}
                              />
                            </div>
                          </div>
                        </SelectableBlock>
                      );
                    })}
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

function ResumeSections(props: ResumeSectionsProps) {
  return renderResumeSectionsContent(props);
}

export function ResumePreview({ onSelectAnchor, activeAnchor }: ResumePreviewProps) {
  const { t } = useTranslation();
  const { resume, hasHydrated } = useResumeStore();

  if (!hasHydrated) {
    return (
      <div
        className="bg-white shadow-lg mx-auto animate-pulse"
        style={{
          width: `${DEFAULT_PAPER_DIMENSIONS.width}px`,
          minHeight: `${DEFAULT_PAPER_DIMENSIONS.height}px`,
          padding: '50px',
        }}
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
    { anchor: personalInfoFieldAnchor('email'), type: iconConfig.emailIcon || 'mail', value: personalInfo.email, href: sanitizeUrl(personalInfo.email) },
    { anchor: personalInfoFieldAnchor('phone'), type: iconConfig.phoneIcon || 'phone', value: personalInfo.phone, href: sanitizeUrl(personalInfo.phone) },
    { anchor: personalInfoFieldAnchor('location'), type: iconConfig.locationIcon || 'map-pin', value: personalInfo.location, href: undefined },
    { anchor: personalInfoFieldAnchor('website'), type: iconConfig.websiteIcon || 'globe', value: personalInfo.website, href: sanitizeUrl(personalInfo.website) },
    { anchor: personalInfoFieldAnchor('linkedin'), type: iconConfig.linkedinIcon || 'linkedin', value: personalInfo.linkedin, href: sanitizeUrl(personalInfo.linkedin) },
    { anchor: personalInfoFieldAnchor('github'), type: iconConfig.githubIcon || 'github', value: personalInfo.github, href: sanitizeUrl(personalInfo.github) },
  ].filter(item => item.value);

  const customContacts = (personalInfo.contacts || [])
    .filter(c => c.value)
    .sort((a, b) => a.order - b.order)
    .map(c => ({ anchor: customContactAnchor(c.id), type: c.type, value: c.value, href: c.href ? sanitizeUrl(c.href) : sanitizeUrl(c.value) }));

  const allContactItems = [...baseContactItems, ...customContacts];
  const keyedContactItems = withStableStringKey(
    allContactItems.map((item) => `${item.type}|${item.value}|${item.href || ''}`),
    'contact'
  ).map((item, index) => ({ key: item.key, ...allContactItems[index] }));

  const fs = theme.fontSize;
  const paper = getPaperDimensions(theme.paperSize);
  const hasHeaderInfo = Boolean(personalInfo.name || personalInfo.title || personalInfo.summary);

  return (
    <div
      id="resume-preview"
      className="bg-white shadow-lg mx-auto"
      style={{
        width: `${paper.width}px`,
        minHeight: `${paper.height}px`,
        fontFamily: `"${theme.fontFamily}", "Noto Sans SC", system-ui, sans-serif`,
        fontSize: `${fs}pt`,
        lineHeight: theme.lineHeight,
      }}
    >
      <div className="h-2 w-full" style={{ backgroundColor: theme.primaryColor }} />

      <div className="px-12 py-8">
        <header style={{ marginBottom: `${theme.spacing * 2}pt` }}>
          {hasHeaderInfo && (
            <>
              {personalInfo.name && (
                <SelectableBlock
                  anchor={personalInfoFieldAnchor('name')}
                  activeAnchor={activeAnchor}
                  onSelectAnchor={onSelectAnchor}
                  className="-mx-1 px-1 py-0.5"
                >
                  <h1
                    className="font-bold tracking-wide"
                    style={{ color: theme.primaryColor, fontSize: `${fs + 8}pt` }}
                  >
                    {personalInfo.name}
                  </h1>
                </SelectableBlock>
              )}

              {personalInfo.title && (
                <SelectableBlock
                  anchor={personalInfoFieldAnchor('title')}
                  activeAnchor={activeAnchor}
                  onSelectAnchor={onSelectAnchor}
                  className="-mx-1 px-1 py-0.5 mt-1"
                >
                  <p className="text-gray-600" style={{ fontSize: `${fs + 2}pt` }}>{personalInfo.title}</p>
                </SelectableBlock>
              )}

              {personalInfo.summary && (
                <SelectableBlock
                  anchor={personalInfoFieldAnchor('summary')}
                  activeAnchor={activeAnchor}
                  onSelectAnchor={onSelectAnchor}
                  className="-mx-1 px-1 py-0.5 mt-2"
                >
                  <p className="mt-2 text-gray-700 whitespace-pre-wrap" style={{ fontSize: `${theme.fontSize - 1}pt` }}>
                    <MarkdownWeb text={personalInfo.summary} />
                  </p>
                </SelectableBlock>
              )}
            </>
          )}

          {allContactItems.length > 0 && (
            <div className="flex flex-wrap gap-x-5 gap-y-2 mt-3">
              {keyedContactItems.map(({ key, anchor, type, value, href }) => (
                <SelectableBlock
                  key={key}
                  anchor={anchor}
                  activeAnchor={activeAnchor}
                  onSelectAnchor={onSelectAnchor}
                  className="-mx-1 px-1 py-0.5"
                >
                  <div className="flex items-center gap-1.5" style={{ fontSize: `${fs - 1}pt` }}>
                    <ContactIcon type={type} />
                    {!onSelectAnchor && href && theme.enableLinks !== false ? (
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
                </SelectableBlock>
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
          onSelectAnchor={onSelectAnchor}
          activeAnchor={activeAnchor}
        />
      </div>
    </div>
  );
}
