import { ResumeData, ContactItem, Experience, Education, Project, Skill, CustomSectionItem, SectionConfig } from '@/types';

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
}

interface RawProjectItem {
  name: string;
  role?: string;
  startDate: string;
  endDate: string;
  current?: boolean;
  url?: string;
  description: string[];
  technologies?: string[];
}

interface RawSkillItem {
  category: string;
  items: string[];
}

interface RawCustomSectionItem {
  title?: string;
  subtitle?: string;
  date?: string;
  description: string[];
}

interface RawCustomSection {
  key: string;
  items: RawCustomSectionItem[];
}

interface RawSectionConfig {
  key: string;
  title?: string;
  visible: boolean;
}

export interface RawResumeData {
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
    description: item.description,
    technologies: item.technologies,
  }));
}

function toRawSkills(items: Skill[]): RawSkillItem[] {
  return items.map((item) => ({
    category: item.category,
    items: item.items,
  }));
}

function toRawCustomItems(items: CustomSectionItem[]): RawCustomSectionItem[] {
  return items.map((item) => ({
    title: item.title,
    subtitle: item.subtitle,
    date: item.date,
    description: item.description,
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
  const sectionOrder = new Map<string, number>();
  getOrderedSections(data.sections).forEach((section, index) => {
    sectionOrder.set(section.id, index);
  });

  return [...data.customSections]
    .sort((a, b) => (sectionOrder.get(a.id) ?? Number.MAX_SAFE_INTEGER) - (sectionOrder.get(b.id) ?? Number.MAX_SAFE_INTEGER))
    .map((section) => ({
      key: keyMap.get(section.id) || section.id,
      items: toRawCustomItems(section.items),
    }));
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

    return {
      id: internalId,
      items: items.reduce<Record<string, unknown>[]>((acc, item, itemIndex) => {
        if (!isRecord(item)) return acc;

        acc.push({
          ...item,
          id: `custom-item-${sectionIndex + 1}-${itemIndex + 1}`,
        });
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
    });
    return acc;
  }, []);

  const mappedSkills = rawSkills.reduce<Record<string, unknown>[]>((acc, item, index) => {
    if (!isRecord(item)) return acc;

    acc.push({
      ...item,
      id: `skill-${index + 1}`,
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
