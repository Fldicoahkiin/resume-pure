import { ContactItem, CustomSectionItem, Education, Experience, Project, ResumeData, SectionConfig, Skill, SkillItem, SkillLevel, CustomSection } from '@/types';

export const RAW_SCHEMA_ERROR_MESSAGE = 'Unsupported raw format. Expected latest raw structure.';

interface RawContactItem {
  type: ContactItem['type'];
  value: string;
  href?: string;
}

interface RawExperienceItem {
  company: string;
  position: string;
  location?: string;
  startDate: string;
  endDate: string;
  current?: boolean;
  description: string[];
  showBulletPoints?: boolean;
}

interface RawEducationItem {
  school: string;
  degree: string;
  major: string;
  location?: string;
  startDate: string;
  endDate: string;
  gpa?: string;
  description?: string[];
  showBulletPoints?: boolean;
}

interface RawProjectContribution {
  summary: string;
  url: string;
}

interface RawProjectItem {
  name: string;
  role?: string;
  startDate: string;
  endDate: string;
  current?: boolean;
  url?: string;
  repoUrl?: string;
  repoStars?: number;
  repoAvatarUrl?: string;
  customLogo?: string;
  description: string[];
  technologies?: string[];
  contributions?: RawProjectContribution[];
  showLogo?: boolean;
  showStars?: boolean;
  showTechnologies?: boolean;
  showContributions?: boolean;
  showBulletPoints?: boolean;
}

interface RawSkillEntry {
  name: string;
  level?: SkillLevel;
  context?: string;
  logo?: string;
  showLogo?: boolean;
  showContext?: boolean;
}

interface RawSkillItem {
  category: string;
  items: RawSkillEntry[];
}

interface RawCustomSection {
  key: string;
  type?: string;
  items: any[];
}

interface RawSectionConfig {
  key: string;
  title?: string;
  visible: boolean;
}

interface RawResumeData {
  personalInfo: {
    name: string;
    title?: string;
    email: string;
    phone: string;
    location: string;
    website?: string;
    linkedin?: string;
    github?: string;
    summary: string;
    iconConfig?: ResumeData['personalInfo']['iconConfig'];
    contacts?: RawContactItem[];
  };
  experience: RawExperienceItem[];
  education: RawEducationItem[];
  projects: RawProjectItem[];
  skills: RawSkillItem[];
  customSections: RawCustomSection[];
  sections: RawSectionConfig[];
  theme: ResumeData['theme'];
}

const REQUIRED_RAW_ROOT_KEYS = [
  'personalInfo',
  'experience',
  'education',
  'projects',
  'skills',
  'customSections',
  'sections',
  'theme',
] as const;

const BUILTIN_SECTION_IDS = new Set(['summary', 'experience', 'education', 'projects', 'skills']);

function createSlug(source: string): string {
  return source
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function getOrderedSections(sections: SectionConfig[]): SectionConfig[] {
  return [...sections].sort((a, b) => a.order - b.order);
}

function buildCustomSectionKeyMap(data: ResumeData): Map<string, string> {
  const orderedSections = getOrderedSections(data.sections).filter((section) => section.isCustom);
  const usedKeys = new Set<string>();
  const keyMap = new Map<string, string>();

  orderedSections.forEach((section, index) => {
    const titleSlug = createSlug(section.title || '');
    let baseKey = titleSlug || `section-${index + 1}`;
    if (!baseKey) {
      baseKey = `section-${index + 1}`;
    }

    let nextKey = baseKey;
    let suffix = 2;
    while (usedKeys.has(nextKey)) {
      nextKey = `${baseKey}-${suffix}`;
      suffix += 1;
    }

    usedKeys.add(nextKey);
    keyMap.set(section.id, nextKey);
  });

  return keyMap;
}

function toRawContactItems(contacts: ContactItem[] | undefined): RawContactItem[] | undefined {
  if (!contacts || contacts.length === 0) return undefined;

  return [...contacts]
    .sort((a, b) => a.order - b.order)
    .map((contact) => ({
      type: contact.type,
      value: contact.value,
      href: contact.href,
    }));
}

function toRawExperience(items: Experience[]): RawExperienceItem[] {
  return items.map((item) => ({
    company: item.company,
    position: item.position,
    location: item.location,
    startDate: item.startDate,
    endDate: item.endDate,
    current: item.current,
    description: item.description,
    showBulletPoints: item.showBulletPoints,
  }));
}

function toRawEducation(items: Education[]): RawEducationItem[] {
  return items.map((item) => ({
    school: item.school,
    degree: item.degree,
    major: item.major,
    location: item.location,
    startDate: item.startDate,
    endDate: item.endDate,
    gpa: item.gpa,
    description: item.description,
    showBulletPoints: item.showBulletPoints,
  }));
}

function toRawProjects(items: Project[]): RawProjectItem[] {
  return items.map((item) => ({
    name: item.name,
    role: item.role,
    startDate: item.startDate,
    endDate: item.endDate,
    current: item.current,
    url: item.url,
    repoUrl: item.repoUrl,
    repoStars: item.repoStars,
    repoAvatarUrl: item.repoAvatarUrl,
    customLogo: item.customLogo,
    description: item.description,
    technologies: item.technologies,
    contributions: item.contributions?.map((contribution) => ({
      summary: contribution.summary,
      url: contribution.url,
    })),
    showLogo: item.showLogo,
    showStars: item.showStars,
    showTechnologies: item.showTechnologies,
    showContributions: item.showContributions,
    showBulletPoints: item.showBulletPoints,
  }));
}

function toRawSkillItems(items: SkillItem[]): RawSkillEntry[] {
  return items.map((item) => ({
    name: item.name,
    level: item.level,
    context: item.context,
    logo: item.logo,
    showLogo: item.showLogo,
    showContext: item.showContext,
  }));
}

function toRawSkills(items: Skill[]): RawSkillItem[] {
  return items.map((item) => ({
    category: item.category,
    items: toRawSkillItems(item.items),
  }));
}

function toRawSections(data: ResumeData, keyMap: Map<string, string>): RawSectionConfig[] {
  return getOrderedSections(data.sections).map((section) => {
    if (section.isCustom) {
      const customKey = keyMap.get(section.id) || section.id;
      return {
        key: `custom:${customKey}`,
        title: section.title || undefined,
        visible: section.visible,
      };
    }

    return {
      key: section.id,
      title: section.title || undefined,
      visible: section.visible,
    };
  });
}

function toRawCustomSections(data: ResumeData, keyMap: Map<string, string>): RawCustomSection[] {
  const customSections = data.sections.filter((s) => s.isCustom);
  const sectionOrder = new Map(data.sections.map((s, i) => [s.id, i]));

  return customSections
    .map((section) => data.customSections.find((cs) => cs.id === section.id))
    .filter((section): section is CustomSection => section !== undefined)
    .sort((a, b) => (sectionOrder.get(a.id) ?? Number.MAX_SAFE_INTEGER) - (sectionOrder.get(b.id) ?? Number.MAX_SAFE_INTEGER))
    .map((section) => {
      const type = section.type && section.type !== 'custom' ? section.type : 'project';
      return {
        key: keyMap.get(section.id) || section.id,
        type: type,
        items: type === 'project' ? toRawProjects(section.items) :
          type === 'experience' ? toRawExperience(section.items) :
            type === 'education' ? toRawEducation(section.items) :
              toRawSkills(section.items),
      };
    });
}

export function getRawSectionKeyMap(data: ResumeData): Map<string, string> {
  const customKeyMap = buildCustomSectionKeyMap(data);
  const result = new Map<string, string>();

  data.sections.forEach((section) => {
    if (section.isCustom) {
      const customKey = customKeyMap.get(section.id) || section.id;
      result.set(section.id, `custom:${customKey}`);
      return;
    }

    result.set(section.id, section.id);
  });

  return result;
}

export function exportRawResumeData(data: ResumeData): RawResumeData {
  const keyMap = buildCustomSectionKeyMap(data);

  return {
    personalInfo: {
      name: data.personalInfo.name,
      title: data.personalInfo.title,
      email: data.personalInfo.email,
      phone: data.personalInfo.phone,
      location: data.personalInfo.location,
      website: data.personalInfo.website,
      linkedin: data.personalInfo.linkedin,
      github: data.personalInfo.github,
      summary: data.personalInfo.summary,
      iconConfig: data.personalInfo.iconConfig,
      contacts: toRawContactItems(data.personalInfo.contacts),
    },
    experience: toRawExperience(data.experience),
    education: toRawEducation(data.education),
    projects: toRawProjects(data.projects),
    skills: toRawSkills(data.skills),
    customSections: toRawCustomSections(data, keyMap),
    sections: toRawSections(data, keyMap),
    theme: data.theme,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isLatestRawData(value: unknown): value is Record<string, unknown> {
  if (!isRecord(value)) {
    return false;
  }

  return REQUIRED_RAW_ROOT_KEYS.every((key) => key in value);
}

function normalizeCustomKey(key: string, index: number): string {
  const cleaned = createSlug(key);
  if (cleaned.length > 0) {
    return cleaned;
  }

  return `section-${index + 1}`;
}

function toInternalSectionId(customKey: string): string {
  return `custom-${customKey}`;
}

function ensureUniqueId(base: string, used: Set<string>): string {
  let next = base;
  let suffix = 2;

  while (used.has(next)) {
    next = `${base}-${suffix}`;
    suffix += 1;
  }

  used.add(next);
  return next;
}

function createSectionKeyMap(raw: Record<string, unknown>): Map<string, string> {
  const map = new Map<string, string>();
  const usedIds = new Set<string>(Array.from(BUILTIN_SECTION_IDS));
  const rawCustomSections = Array.isArray(raw.customSections) ? raw.customSections : [];
  const rawSections = Array.isArray(raw.sections) ? raw.sections : [];

  const addCustomKey = (rawKey: string, indexHint: number) => {
    if (map.has(rawKey)) return;

    const normalized = normalizeCustomKey(rawKey, indexHint);
    const internalId = ensureUniqueId(toInternalSectionId(normalized), usedIds);
    map.set(rawKey, internalId);
  };

  rawCustomSections.forEach((section, index) => {
    if (!isRecord(section)) return;
    addCustomKey(typeof section.key === 'string' ? section.key : '', index);
  });

  rawSections.forEach((section, index) => {
    if (!isRecord(section)) return;
    if (typeof section.key !== 'string') return;
    if (!section.key.startsWith('custom:')) return;

    const customKey = section.key.slice('custom:'.length);
    addCustomKey(customKey, index);
  });

  return map;
}

function mapProjectContributions(value: unknown): Record<string, unknown>[] | undefined {
  if (!Array.isArray(value)) {
    return undefined;
  }

  const mapped = value.reduce<Record<string, unknown>[]>((acc, item, index) => {
    if (!isRecord(item)) return acc;

    acc.push({
      ...item,
      id: `contribution-${index + 1}`,
    });
    return acc;
  }, []);

  return mapped.length > 0 ? mapped : undefined;
}

function mapSkillEntries(value: unknown): Record<string, unknown>[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.reduce<Record<string, unknown>[]>((acc, item, index) => {
    if (typeof item === 'string') {
      const name = item.trim();
      if (!name) return acc;

      acc.push({
        id: `skill-item-${index + 1}`,
        name,
        level: 'proficient',
        showLogo: true,
        showContext: true,
      });
      return acc;
    }

    if (!isRecord(item)) return acc;

    acc.push({
      ...item,
      id: `skill-item-${index + 1}`,
    });
    return acc;
  }, []);
}

export function prepareImportedResumeData(input: unknown): unknown {
  if (!isLatestRawData(input)) {
    throw new Error(RAW_SCHEMA_ERROR_MESSAGE);
  }

  const raw = input as Record<string, unknown>;
  const customKeyMap = createSectionKeyMap(raw);
  const rawSections = Array.isArray(raw.sections) ? raw.sections : [];
  const rawCustomSections = Array.isArray(raw.customSections) ? raw.customSections : [];
  const rawExperience = Array.isArray(raw.experience) ? raw.experience : [];
  const rawEducation = Array.isArray(raw.education) ? raw.education : [];
  const rawProjects = Array.isArray(raw.projects) ? raw.projects : [];
  const rawSkills = Array.isArray(raw.skills) ? raw.skills : [];
  const personalInfo = isRecord(raw.personalInfo) ? raw.personalInfo : {};
  const contacts = Array.isArray(personalInfo.contacts) ? personalInfo.contacts : [];

  const sections = rawSections.map((section, index) => {
    if (!isRecord(section)) {
      return null;
    }

    if (typeof section.key !== 'string' || section.key.length === 0) {
      return null;
    }

    if (BUILTIN_SECTION_IDS.has(section.key)) {
      return {
        id: section.key,
        title: section.title || '',
        visible: section.visible !== false,
        order: index + 1,
      };
    }

    if (section.key.startsWith('custom:')) {
      const customKey = section.key.slice('custom:'.length);
      const internalId = customKeyMap.get(customKey);
      if (!internalId) return null;

      return {
        id: internalId,
        title: section.title || '',
        visible: section.visible !== false,
        order: index + 1,
        isCustom: true,
      };
    }

    return null;
  }).filter(Boolean);

  const customSections = rawCustomSections.map((section, sectionIndex) => {
    if (!isRecord(section) || typeof section.key !== 'string') {
      return null;
    }

    const internalId = customKeyMap.get(section.key);
    if (!internalId) return null;

    const items = Array.isArray(section.items) ? section.items : [];
    const type = typeof section.type === 'string' ? section.type : undefined;

    return {
      id: internalId,
      type,
      items: items.reduce<Record<string, unknown>[]>((acc, item, itemIndex) => {
        if (!isRecord(item)) return acc;

        const baseItem: Record<string, unknown> = {
          ...item,
          id: `custom-item-${sectionIndex + 1}-${itemIndex + 1}`,
        };

        const resolvedType = type || 'project';

        if (resolvedType === 'project' && Array.isArray(item.contributions)) {
          baseItem.contributions = mapProjectContributions(item.contributions);
        } else if (resolvedType === 'skill' && Array.isArray(item.items)) {
          baseItem.items = mapSkillEntries(item.items);
        }

        acc.push(baseItem);
        return acc;
      }, []),
    };
  }).filter(Boolean);

  const mappedContacts = contacts.reduce<Record<string, unknown>[]>((acc, contact, index) => {
    if (!isRecord(contact)) return acc;

    acc.push({
      ...contact,
      id: `contact-${index + 1}`,
      order: index,
    });
    return acc;
  }, []);

  const mappedExperience = rawExperience.reduce<Record<string, unknown>[]>((acc, item, index) => {
    if (!isRecord(item)) return acc;

    acc.push({
      ...item,
      id: `exp-${index + 1}`,
    });
    return acc;
  }, []);

  const mappedEducation = rawEducation.reduce<Record<string, unknown>[]>((acc, item, index) => {
    if (!isRecord(item)) return acc;

    acc.push({
      ...item,
      id: `edu-${index + 1}`,
    });
    return acc;
  }, []);

  const mappedProjects = rawProjects.reduce<Record<string, unknown>[]>((acc, item, index) => {
    if (!isRecord(item)) return acc;

    acc.push({
      ...item,
      id: `proj-${index + 1}`,
      contributions: mapProjectContributions(item.contributions),
    });
    return acc;
  }, []);

  const mappedSkills = rawSkills.reduce<Record<string, unknown>[]>((acc, item, index) => {
    if (!isRecord(item)) return acc;

    acc.push({
      ...item,
      id: `skill-${index + 1}`,
      items: mapSkillEntries(item.items),
    });
    return acc;
  }, []);

  return {
    schemaVersion: 1,
    personalInfo: {
      ...personalInfo,
      contacts: mappedContacts,
    },
    experience: mappedExperience,
    education: mappedEducation,
    projects: mappedProjects,
    skills: mappedSkills,
    customSections,
    sections,
    theme: isRecord(raw.theme) ? raw.theme : {},
  };
}
