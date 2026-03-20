import {
  ContactIconType,
  ContactItem,
  CustomSection,
  Education,
  Experience,
  PersonalInfo,
  Project,
  ProjectContribution,
  ResumeData,
  SectionConfig,
  Skill,
  SkillItem,
  SkillLevel,
  ThemeConfig,
  CustomSectionType,
} from '@/types';
import { normalizePaperSize } from '@/lib/paper';

const BUILTIN_SECTIONS: SectionConfig[] = [
  { id: 'summary', title: '', visible: true, order: 1 },
  { id: 'experience', title: '', visible: true, order: 2 },
  { id: 'education', title: '', visible: true, order: 3 },
  { id: 'projects', title: '', visible: true, order: 4 },
  { id: 'skills', title: '', visible: true, order: 5 },
];

const BUILTIN_SECTION_ID_SET = new Set(BUILTIN_SECTIONS.map((section) => section.id));

const CONTACT_ICON_TYPES: ContactIconType[] = [
  'mail',
  'phone',
  'map-pin',
  'globe',
  'linkedin',
  'github',
  'twitter',
  'instagram',
  'facebook',
  'youtube',
  'dribbble',
  'behance',
  'link',
  'user',
  'briefcase',
  'calendar',
  'message-circle',
  'at-sign',
];

const CONTACT_ICON_TYPE_SET = new Set<ContactIconType>(CONTACT_ICON_TYPES);
const SKILL_LEVELS: SkillLevel[] = ['core', 'proficient', 'familiar'];
const SKILL_LEVEL_SET = new Set<SkillLevel>(SKILL_LEVELS);
const CURRENT_SCHEMA_VERSION = 1;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function toStringValue(value: unknown): string | undefined {
  if (typeof value === 'string') {
    return value;
  }

  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10);
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }

  return undefined;
}

function asString(value: unknown, fallback: string = ''): string {
  const str = toStringValue(value);
  return str === undefined ? fallback : str;
}

function asOptionalString(value: unknown): string | undefined {
  const str = toStringValue(value);
  if (str === undefined) return undefined;

  const trimmed = str.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function asBoolean(value: unknown, fallback: boolean): boolean {
  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'string') {
    if (value === 'true') return true;
    if (value === 'false') return false;
  }

  return fallback;
}

function asNumber(value: unknown, fallback: number, min?: number, max?: number): number {
  const parsed = typeof value === 'number'
    ? value
    : typeof value === 'string'
      ? Number.parseFloat(value)
      : Number.NaN;

  if (!Number.isFinite(parsed)) {
    return fallback;
  }

  if (typeof min === 'number' && parsed < min) {
    return min;
  }

  if (typeof max === 'number' && parsed > max) {
    return max;
  }

  return parsed;
}

function asOptionalNumber(value: unknown, min?: number): number | undefined {
  const parsed = typeof value === 'number'
    ? value
    : typeof value === 'string'
      ? Number.parseFloat(value)
      : Number.NaN;

  if (!Number.isFinite(parsed)) {
    return undefined;
  }

  if (typeof min === 'number' && parsed < min) {
    return min;
  }

  return parsed;
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => asString(item, '').trim())
    .filter((item) => item.length > 0);
}

function normalizeContactIcon(value: unknown, fallback: ContactIconType): ContactIconType {
  if (typeof value === 'string' && CONTACT_ICON_TYPE_SET.has(value as ContactIconType)) {
    return value as ContactIconType;
  }

  return fallback;
}

function normalizeSkillLevel(value: unknown, fallback: SkillLevel = 'proficient'): SkillLevel {
  if (typeof value === 'string' && SKILL_LEVEL_SET.has(value as SkillLevel)) {
    return value as SkillLevel;
  }

  return fallback;
}

function normalizeColor(value: unknown, fallback: string): string {
  const raw = asString(value, '').trim();
  if (/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(raw)) {
    return raw;
  }

  return fallback;
}

function createId(prefix: string, index: number): string {
  return `${prefix}-${index + 1}`;
}

function normalizeProjectContributions(value: unknown): ProjectContribution[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.reduce<ProjectContribution[]>((acc, item, index) => {
    if (!isRecord(item)) return acc;

    acc.push({
      id: asString(item.id, createId('contribution', index)),
      summary: asString(item.summary, ''),
      url: asString(item.url, ''),
    });

    return acc;
  }, []);
}

function normalizeSkillItems(value: unknown): SkillItem[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.reduce<SkillItem[]>((acc, item, index) => {
    if (typeof item === 'string') {
      const name = item.trim();
      if (!name) return acc;

      acc.push({
        id: createId('skill-item', index),
        name,
        level: 'proficient',
        showLogo: true,
        showContext: true,
      });
      return acc;
    }

    if (!isRecord(item)) return acc;

    const name = asString(item.name, '').trim();
    if (!name) return acc;

    acc.push({
      id: asString(item.id, createId('skill-item', index)),
      name,
      level: normalizeSkillLevel(item.level),
      context: asOptionalString(item.context),
      logo: asOptionalString(item.logo),
      showLogo: asBoolean(item.showLogo, true),
      showContext: asBoolean(item.showContext, true),
    });

    return acc;
  }, []);
}

function normalizePersonalInfo(input: unknown, fallback: PersonalInfo): PersonalInfo {
  const info = isRecord(input) ? input : {};
  const iconConfig = isRecord(info.iconConfig) ? info.iconConfig : {};

  const contacts = (Array.isArray(info.contacts) ? info.contacts : []).reduce<ContactItem[]>(
    (acc, item, index) => {
      if (!isRecord(item)) return acc;

      acc.push({
        id: asString(item.id, createId('contact', index)),
        type: normalizeContactIcon(item.type, 'link'),
        value: asString(item.value, ''),
        href: asOptionalString(item.href),
        order: asNumber(item.order, index, 0),
      });

      return acc;
    },
    []
  );

  contacts.sort((a, b) => a.order - b.order);
  const normalizedContacts = contacts.map((contact, index) => ({ ...contact, order: index }));

  return {
    name: asString(info.name, fallback.name),
    title: asOptionalString(info.title),
    email: asString(info.email, fallback.email),
    phone: asString(info.phone, fallback.phone),
    location: asString(info.location, fallback.location),
    website: asOptionalString(info.website),
    linkedin: asOptionalString(info.linkedin),
    github: asOptionalString(info.github),
    summary: asString(info.summary, fallback.summary),
    iconConfig: {
      emailIcon: normalizeContactIcon(iconConfig.emailIcon, 'mail'),
      phoneIcon: normalizeContactIcon(iconConfig.phoneIcon, 'phone'),
      locationIcon: normalizeContactIcon(iconConfig.locationIcon, 'map-pin'),
      websiteIcon: normalizeContactIcon(iconConfig.websiteIcon, 'globe'),
      linkedinIcon: normalizeContactIcon(iconConfig.linkedinIcon, 'linkedin'),
      githubIcon: normalizeContactIcon(iconConfig.githubIcon, 'github'),
    },
    contacts: normalizedContacts,
  };
}

function normalizeExperience(input: unknown): Experience[] {
  if (!Array.isArray(input)) {
    return [];
  }

  return input.reduce<Experience[]>((acc, item, index) => {
    if (!isRecord(item)) return acc;

    acc.push({
      id: asString(item.id, createId('exp', index)),
      company: asString(item.company, ''),
      position: asString(item.position, ''),
      location: asOptionalString(item.location),
      startDate: asString(item.startDate, ''),
      endDate: asString(item.endDate, ''),
      current: asBoolean(item.current, false),
      description: asStringArray(item.description),
      showBulletPoints: asBoolean(item.showBulletPoints, true),
    });

    return acc;
  }, []);
}

function normalizeEducation(input: unknown): Education[] {
  if (!Array.isArray(input)) {
    return [];
  }

  return input.reduce<Education[]>((acc, item, index) => {
    if (!isRecord(item)) return acc;

    const description = asStringArray(item.description);

    acc.push({
      id: asString(item.id, createId('edu', index)),
      school: asString(item.school, ''),
      degree: asString(item.degree, ''),
      major: asString(item.major, ''),
      location: asOptionalString(item.location),
      startDate: asString(item.startDate, ''),
      endDate: asString(item.endDate, ''),
      gpa: asOptionalString(item.gpa),
      description: description.length > 0 ? description : undefined,
      showBulletPoints: asBoolean(item.showBulletPoints, true),
    });

    return acc;
  }, []);
}

function normalizeProjects(input: unknown): Project[] {
  if (!Array.isArray(input)) {
    return [];
  }

  return input.reduce<Project[]>((acc, item, index) => {
    if (!isRecord(item)) return acc;

    const technologies = asStringArray(item.technologies);
    const contributions = normalizeProjectContributions(item.contributions);

    acc.push({
      id: asString(item.id, createId('proj', index)),
      name: asString(item.name, ''),
      role: asOptionalString(item.role),
      startDate: asString(item.startDate, ''),
      endDate: asString(item.endDate, ''),
      current: asBoolean(item.current, false),
      url: asOptionalString(item.url),
      repoUrl: asOptionalString(item.repoUrl),
      repoStars: asOptionalNumber(item.repoStars, 0),
      repoAvatarUrl: asOptionalString(item.repoAvatarUrl),
      customLogo: asOptionalString(item.customLogo),
      description: asStringArray(item.description),
      technologies: technologies.length > 0 ? technologies : undefined,
      contributions: contributions.length > 0 ? contributions : undefined,
      showLogo: asBoolean(item.showLogo, true),
      showStars: asBoolean(item.showStars, true),
      showTechnologies: asBoolean(item.showTechnologies, true),
      showContributions: asBoolean(item.showContributions, true),
      showBulletPoints: asBoolean(item.showBulletPoints, true),
    });

    return acc;
  }, []);
}

function normalizeSkills(input: unknown): Skill[] {
  if (!Array.isArray(input)) {
    return [];
  }

  return input.reduce<Skill[]>((acc, item, index) => {
    if (!isRecord(item)) return acc;

    const skill: Skill = {
      id: asString(item.id, createId('skill', index)),
      category: asString(item.category, ''),
      items: normalizeSkillItems(item.items),
    };

    const categoryIcon = asOptionalString(item.categoryIcon);
    if (categoryIcon) skill.categoryIcon = categoryIcon;

    const tags = asStringArray(item.tags);
    if (tags.length > 0) skill.tags = tags;

    acc.push(skill);

    return acc;
  }, []);
}

function normalizeCustomSections(input: unknown): CustomSection[] {
  if (!Array.isArray(input)) {
    return [];
  }

  return input.reduce<CustomSection[]>((sectionAcc, section, sectionIndex) => {
    if (!isRecord(section)) return sectionAcc;

    const type = typeof section.type === 'string' && section.type !== 'custom' ? section.type : 'project';
    
    let items: CustomSection['items'] = [];
    const sectionItems = Array.isArray(section.items) ? section.items : [];
    
    if (type === 'project') {
      items = normalizeProjects(sectionItems);
    } else if (type === 'experience') {
      items = normalizeExperience(sectionItems);
    } else if (type === 'education') {
      items = normalizeEducation(sectionItems);
    } else if (type === 'skill') {
      items = normalizeSkills(sectionItems);
    }

    sectionAcc.push({
      id: asString(section.id, createId('custom', sectionIndex)),
      type: type as CustomSectionType,
      items,
    });

    return sectionAcc;
  }, []);
}

function normalizeTheme(input: unknown, fallback: ThemeConfig): ThemeConfig {
  const theme = isRecord(input) ? input : {};

  return {
    primaryColor: normalizeColor(theme.primaryColor, fallback.primaryColor),
    fontFamily: asString(theme.fontFamily, fallback.fontFamily),
    fontSize: asNumber(theme.fontSize, fallback.fontSize, 6, 30),
    spacing: asNumber(theme.spacing, fallback.spacing, 0, 40),
    lineHeight: asNumber(theme.lineHeight, fallback.lineHeight, 0.8, 3),
    enableLinks: asBoolean(theme.enableLinks, fallback.enableLinks !== false),
    paperSize: normalizePaperSize(theme.paperSize, fallback.paperSize),
  };
}

function normalizeSections(input: unknown): SectionConfig[] {
  if (!Array.isArray(input)) {
    return [];
  }

  return input.reduce<SectionConfig[]>((acc, section, index) => {
    if (!isRecord(section)) return acc;

    const id = asString(section.id, '').trim();
    if (!id) return acc;

    const isBuiltIn = BUILTIN_SECTION_ID_SET.has(id);

    acc.push({
      id,
      title: asString(section.title, ''),
      visible: asBoolean(section.visible, true),
      order: asNumber(section.order, index + 1, 1),
      isCustom: isBuiltIn ? false : asBoolean(section.isCustom, true),
    });

    return acc;
  }, []);
}

function migrateV0ToV1(source: Record<string, unknown>): Record<string, unknown> {
  const migrated = { ...source };
  const legacyVersion = asNumber(source.version, 0, 0);

  if (legacyVersion > 0 && typeof source.schemaVersion !== 'number') {
    migrated.schemaVersion = legacyVersion;
  }

  return migrated;
}

function migrateResumeData(input: unknown): Record<string, unknown> {
  if (!isRecord(input)) {
    return {};
  }

  let migrated: Record<string, unknown> = { ...input };
  let version = asNumber(migrated.schemaVersion, 0, 0);

  while (version < CURRENT_SCHEMA_VERSION) {
    switch (version) {
      case 0:
        migrated = migrateV0ToV1(migrated);
        version = 1;
        break;
      default:
        version = CURRENT_SCHEMA_VERSION;
        break;
    }
  }

  return migrated;
}

function sortAndReorderSections(sections: SectionConfig[]): SectionConfig[] {
  const summarySection = sections.find((section) => section.id === 'summary');
  const otherSections = sections
    .filter((section) => section.id !== 'summary')
    .sort((a, b) => a.order - b.order);

  const orderedSections = summarySection ? [summarySection, ...otherSections] : otherSections;

  return orderedSections.map((section, index) => ({
    ...section,
    order: index + 1,
  }));
}

export function createInitialResume(): ResumeData {
  return {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    personalInfo: {
      name: '',
      email: '',
      phone: '',
      location: '',
      summary: '',
      iconConfig: {
        emailIcon: 'mail',
        phoneIcon: 'phone',
        locationIcon: 'map-pin',
        websiteIcon: 'globe',
        linkedinIcon: 'linkedin',
        githubIcon: 'github',
      },
      contacts: [],
    },
    experience: [],
    education: [],
    projects: [],
    skills: [],
    customSections: [],
    sections: BUILTIN_SECTIONS.map((section) => ({ ...section })),
    theme: {
      primaryColor: '#3b82f6',
      fontFamily: 'Noto Sans SC',
      fontSize: 11,
      spacing: 8,
      lineHeight: 1.5,
      enableLinks: true,
      paperSize: 'A4',
    },
  };
}

export function normalizeResumeData(input: unknown): ResumeData {
  const fallback = createInitialResume();
  const migrated = migrateResumeData(input);

  const personalInfo = normalizePersonalInfo(migrated.personalInfo, fallback.personalInfo);
  const experience = normalizeExperience(migrated.experience);
  const education = normalizeEducation(migrated.education);
  const projects = normalizeProjects(migrated.projects);
  const skills = normalizeSkills(migrated.skills);
  const theme = normalizeTheme(migrated.theme, fallback.theme);

  const customSectionMap = new Map<string, CustomSection>();
  for (const section of normalizeCustomSections(migrated.customSections)) {
    if (!section.id || customSectionMap.has(section.id)) continue;
    customSectionMap.set(section.id, section);
  }

  const parsedSections = normalizeSections(migrated.sections);
  const sectionMap = new Map<string, SectionConfig>();

  for (const section of parsedSections) {
    if (sectionMap.has(section.id)) continue;

    const isBuiltIn = BUILTIN_SECTION_ID_SET.has(section.id);
    sectionMap.set(section.id, {
      ...section,
      isCustom: isBuiltIn ? false : true,
    });

    if (!isBuiltIn && !customSectionMap.has(section.id)) {
      customSectionMap.set(section.id, { id: section.id, items: [] });
    }
  }

  for (const builtInSection of BUILTIN_SECTIONS) {
    if (!sectionMap.has(builtInSection.id)) {
      sectionMap.set(builtInSection.id, { ...builtInSection });
    }
  }

  for (const customSectionId of Array.from(customSectionMap.keys())) {
    if (!sectionMap.has(customSectionId)) {
      sectionMap.set(customSectionId, {
        id: customSectionId,
        title: '',
        visible: true,
        order: sectionMap.size + 1,
        isCustom: true,
      });
    }
  }

  const sections = sortAndReorderSections(Array.from(sectionMap.values()));

  const customSections = Array.from(customSectionMap.values())
    .filter((section) => sections.some((record) => record.id === section.id && record.isCustom))
    .sort((a, b) => {
      const orderA = sections.find((section) => section.id === a.id)?.order ?? Number.MAX_SAFE_INTEGER;
      const orderB = sections.find((section) => section.id === b.id)?.order ?? Number.MAX_SAFE_INTEGER;
      return orderA - orderB;
    });

  return {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    personalInfo,
    experience,
    education,
    projects,
    skills,
    customSections,
    sections,
    theme,
  };
}
