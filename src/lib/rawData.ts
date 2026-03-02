import { ResumeData, ContactItem, Experience, Education, Project, Skill, CustomSectionItem, SectionConfig } from '@/types';

const RAW_SCHEMA_VERSION = 2;
export const RAW_SCHEMA_ERROR_MESSAGE = 'Unsupported raw schema version. Expected schemaVersion 2.';

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

export interface RawResumeDataV2 {
  schemaVersion: typeof RAW_SCHEMA_VERSION;
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

export function exportRawResumeData(data: ResumeData): RawResumeDataV2 {
  const keyMap = buildCustomSectionKeyMap(data);

  return {
    schemaVersion: RAW_SCHEMA_VERSION,
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

function isRawV2(value: unknown): value is RawResumeDataV2 {
  if (!isRecord(value)) {
    return false;
  }

  const version = typeof value.schemaVersion === 'number'
    ? value.schemaVersion
    : typeof value.schemaVersion === 'string'
      ? Number.parseInt(value.schemaVersion, 10)
      : Number.NaN;

  return Number.isFinite(version) && version === RAW_SCHEMA_VERSION;
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

function createSectionKeyMap(raw: RawResumeDataV2): Map<string, string> {
  const map = new Map<string, string>();
  const usedIds = new Set<string>(Array.from(BUILTIN_SECTION_IDS));

  const addCustomKey = (rawKey: string, indexHint: number) => {
    if (map.has(rawKey)) return;

    const normalized = normalizeCustomKey(rawKey, indexHint);
    const internalId = ensureUniqueId(toInternalSectionId(normalized), usedIds);
    map.set(rawKey, internalId);
  };

  raw.customSections.forEach((section, index) => {
    addCustomKey(section.key, index);
  });

  raw.sections.forEach((section, index) => {
    if (typeof section.key !== 'string') return;
    if (!section.key.startsWith('custom:')) return;

    const customKey = section.key.slice('custom:'.length);
    addCustomKey(customKey, index);
  });

  return map;
}

export function prepareImportedResumeData(input: unknown): unknown {
  if (!isRawV2(input)) {
    throw new Error(RAW_SCHEMA_ERROR_MESSAGE);
  }

  const raw = input;
  const customKeyMap = createSectionKeyMap(raw);

  const sections = raw.sections.map((section, index) => {
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

  const customSections = raw.customSections.map((section, sectionIndex) => {
    const internalId = customKeyMap.get(section.key);
    if (!internalId) return null;

    return {
      id: internalId,
      items: (Array.isArray(section.items) ? section.items : []).map((item, itemIndex) => ({
        ...item,
        id: `custom-item-${sectionIndex + 1}-${itemIndex + 1}`,
      })),
    };
  }).filter(Boolean);

  return {
    schemaVersion: 1,
    personalInfo: {
      ...raw.personalInfo,
      contacts: (Array.isArray(raw.personalInfo.contacts) ? raw.personalInfo.contacts : []).map((contact, index) => ({
        ...contact,
        id: `contact-${index + 1}`,
        order: index,
      })),
    },
    experience: (Array.isArray(raw.experience) ? raw.experience : []).map((item, index) => ({
      ...item,
      id: `exp-${index + 1}`,
    })),
    education: (Array.isArray(raw.education) ? raw.education : []).map((item, index) => ({
      ...item,
      id: `edu-${index + 1}`,
    })),
    projects: (Array.isArray(raw.projects) ? raw.projects : []).map((item, index) => ({
      ...item,
      id: `proj-${index + 1}`,
    })),
    skills: (Array.isArray(raw.skills) ? raw.skills : []).map((item, index) => ({
      ...item,
      id: `skill-${index + 1}`,
    })),
    customSections,
    sections,
    theme: raw.theme,
  };
}
