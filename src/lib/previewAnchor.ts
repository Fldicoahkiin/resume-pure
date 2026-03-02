import type { ResumeData } from '@/types';
import { getRawSectionKeyMap } from '@/lib/rawData';

export const PERSONAL_INFO_ANCHOR = 'personalInfo';
const PERSONAL_INFO_FIELD_PREFIX = 'personalInfo:';
const CUSTOM_CONTACT_PREFIX = 'contact:';
const SECTION_PREFIX = 'section:';
const EXPERIENCE_PREFIX = 'experience:';
const EDUCATION_PREFIX = 'education:';
const PROJECT_PREFIX = 'projects:';
const SKILL_PREFIX = 'skills:';
const CUSTOM_PREFIX = 'custom:';

export function sectionAnchor(sectionId: string): string {
  return `${SECTION_PREFIX}${sectionId}`;
}

export function personalInfoFieldAnchor(
  field: 'name' | 'title' | 'summary' | 'email' | 'phone' | 'website' | 'linkedin' | 'github' | 'location'
): string {
  return `${PERSONAL_INFO_FIELD_PREFIX}${field}`;
}

export function customContactAnchor(contactId: string): string {
  return `${CUSTOM_CONTACT_PREFIX}${contactId}`;
}

export function experienceAnchor(id: string): string {
  return `${EXPERIENCE_PREFIX}${id}`;
}

export function educationAnchor(id: string): string {
  return `${EDUCATION_PREFIX}${id}`;
}

export function projectAnchor(id: string): string {
  return `${PROJECT_PREFIX}${id}`;
}

export function skillAnchor(id: string): string {
  return `${SKILL_PREFIX}${id}`;
}

export function customItemAnchor(sectionId: string, itemId: string): string {
  return `${CUSTOM_PREFIX}${sectionId}:${itemId}`;
}

export interface ParsedPreviewAnchor {
  kind: 'personalInfo' | 'personalField' | 'contact' | 'section' | 'experience' | 'education' | 'projects' | 'skills' | 'custom' | 'unknown';
  sectionId?: string;
  field?: string;
  contactId?: string;
  itemId?: string;
}

export function parsePreviewAnchor(anchor: string): ParsedPreviewAnchor {
  if (anchor === PERSONAL_INFO_ANCHOR) {
    return { kind: 'personalInfo', sectionId: 'personalInfo' };
  }

  if (anchor.startsWith(PERSONAL_INFO_FIELD_PREFIX)) {
    return {
      kind: 'personalField',
      sectionId: 'personalInfo',
      field: anchor.slice(PERSONAL_INFO_FIELD_PREFIX.length),
    };
  }

  if (anchor.startsWith(CUSTOM_CONTACT_PREFIX)) {
    return {
      kind: 'contact',
      sectionId: 'personalInfo',
      contactId: anchor.slice(CUSTOM_CONTACT_PREFIX.length),
    };
  }

  if (anchor.startsWith(SECTION_PREFIX)) {
    return {
      kind: 'section',
      sectionId: anchor.slice(SECTION_PREFIX.length),
    };
  }

  if (anchor.startsWith(EXPERIENCE_PREFIX)) {
    return {
      kind: 'experience',
      sectionId: 'experience',
      itemId: anchor.slice(EXPERIENCE_PREFIX.length),
    };
  }

  if (anchor.startsWith(EDUCATION_PREFIX)) {
    return {
      kind: 'education',
      sectionId: 'education',
      itemId: anchor.slice(EDUCATION_PREFIX.length),
    };
  }

  if (anchor.startsWith(PROJECT_PREFIX)) {
    return {
      kind: 'projects',
      sectionId: 'projects',
      itemId: anchor.slice(PROJECT_PREFIX.length),
    };
  }

  if (anchor.startsWith(SKILL_PREFIX)) {
    return {
      kind: 'skills',
      sectionId: 'skills',
      itemId: anchor.slice(SKILL_PREFIX.length),
    };
  }

  if (anchor.startsWith(CUSTOM_PREFIX)) {
    const rest = anchor.slice(CUSTOM_PREFIX.length);
    const [sectionId, itemId] = rest.split(':');
    if (sectionId && itemId) {
      return {
        kind: 'custom',
        sectionId,
        itemId,
      };
    }
  }

  return { kind: 'unknown' };
}

export function getSectionIdFromPreviewAnchor(anchor: string): string | undefined {
  return parsePreviewAnchor(anchor).sectionId;
}

export function getEditorAnchorCandidates(anchor: string): string[] {
  const parsed = parsePreviewAnchor(anchor);
  const candidates = [anchor];

  if (parsed.sectionId && parsed.kind !== 'section' && parsed.sectionId !== 'personalInfo') {
    candidates.push(sectionAnchor(parsed.sectionId));
  }

  if (parsed.sectionId === 'personalInfo') {
    candidates.push(PERSONAL_INFO_ANCHOR);
  }

  return Array.from(new Set(candidates));
}

function getValueSearchPatterns(value: string | undefined): string[] {
  if (!value) return [];
  const trimmed = value.trim();
  if (!trimmed) return [];

  return [
    `"${trimmed}"`,
    `: ${trimmed}`,
    `: "${trimmed}"`,
  ];
}

function getRawSearchPatternsWithResume(anchor: string, resume?: ResumeData): string[] {
  const parsed = parsePreviewAnchor(anchor);
  const patterns: string[] = [];

  const push = (...values: string[]) => {
    values.forEach((value) => {
      if (!value) return;
      patterns.push(value);
    });
  };

  if (parsed.kind === 'personalInfo') {
    push('"personalInfo"', 'personalInfo:');
    return Array.from(new Set(patterns));
  }

  if (parsed.kind === 'personalField' && parsed.field) {
    const field = parsed.field;
    push(
      `"${field}":`,
      `${field}:`,
      `"personalInfo"`,
      'personalInfo:',
    );

    if (resume) {
      switch (field) {
        case 'name':
          push(...getValueSearchPatterns(resume.personalInfo.name));
          break;
        case 'title':
          push(...getValueSearchPatterns(resume.personalInfo.title));
          break;
        case 'summary':
          push(...getValueSearchPatterns(resume.personalInfo.summary));
          break;
        case 'email':
          push(...getValueSearchPatterns(resume.personalInfo.email));
          break;
        case 'phone':
          push(...getValueSearchPatterns(resume.personalInfo.phone));
          break;
        case 'website':
          push(...getValueSearchPatterns(resume.personalInfo.website));
          break;
        case 'linkedin':
          push(...getValueSearchPatterns(resume.personalInfo.linkedin));
          break;
        case 'github':
          push(...getValueSearchPatterns(resume.personalInfo.github));
          break;
        case 'location':
          push(...getValueSearchPatterns(resume.personalInfo.location));
          break;
        default:
          break;
      }
    }

    return Array.from(new Set(patterns));
  }

  if (parsed.kind === 'contact' && parsed.contactId) {
    push(
      `"id": "${parsed.contactId}"`,
      `id: ${parsed.contactId}`,
      `id: "${parsed.contactId}"`,
      '"contacts"',
      'contacts:',
      '"personalInfo"',
      'personalInfo:',
    );

    if (resume) {
      const contact = (resume.personalInfo.contacts || []).find((item) => item.id === parsed.contactId);
      if (contact) {
        push(...getValueSearchPatterns(contact.value));
        push(...getValueSearchPatterns(contact.href));
        push(`"${contact.type}"`, `type: ${contact.type}`, `type: "${contact.type}"`);
      }
    }

    return Array.from(new Set(patterns));
  }

  if (parsed.kind === 'section' && parsed.sectionId) {
    let sectionToken = parsed.sectionId;
    if (resume) {
      sectionToken = getRawSectionKeyMap(resume).get(parsed.sectionId) || parsed.sectionId;
    }

    push(
      `"key": "${sectionToken}"`,
      `key: ${sectionToken}`,
      `key: "${sectionToken}"`,
      `"${sectionToken}"`,
      `${sectionToken}:`,
      `"id": "${parsed.sectionId}"`,
      `id: ${parsed.sectionId}`,
      `id: "${parsed.sectionId}"`,
    );

    if (resume) {
      const section = resume.sections.find((item) => item.id === parsed.sectionId);
      if (section?.isCustom) {
        push(...getValueSearchPatterns(section.title));
      }
    }

    return Array.from(new Set(patterns));
  }

  if (parsed.itemId) {
    let sectionToken = parsed.sectionId || '';
    if (resume && parsed.sectionId) {
      sectionToken = getRawSectionKeyMap(resume).get(parsed.sectionId) || parsed.sectionId;
    }

    push(
      `"id": "${parsed.itemId}"`,
      `id: ${parsed.itemId}`,
      `id: "${parsed.itemId}"`,
      `"${sectionToken}"`,
      `${sectionToken}:`,
      `"key": "${sectionToken}"`,
      `key: ${sectionToken}`,
      `key: "${sectionToken}"`,
    );

    if (resume) {
      if (parsed.kind === 'experience') {
        const item = resume.experience.find((record) => record.id === parsed.itemId);
        if (item) {
          push(...getValueSearchPatterns(item.company), ...getValueSearchPatterns(item.position));
        }
      } else if (parsed.kind === 'education') {
        const item = resume.education.find((record) => record.id === parsed.itemId);
        if (item) {
          push(...getValueSearchPatterns(item.school), ...getValueSearchPatterns(item.degree), ...getValueSearchPatterns(item.major));
        }
      } else if (parsed.kind === 'projects') {
        const item = resume.projects.find((record) => record.id === parsed.itemId);
        if (item) {
          push(...getValueSearchPatterns(item.name), ...getValueSearchPatterns(item.role));
        }
      } else if (parsed.kind === 'skills') {
        const item = resume.skills.find((record) => record.id === parsed.itemId);
        if (item) {
          push(...getValueSearchPatterns(item.category));
          if (item.items.length > 0) {
            push(...getValueSearchPatterns(item.items[0]));
          }
        }
      } else if (parsed.kind === 'custom' && parsed.sectionId) {
        const section = resume.customSections.find((record) => record.id === parsed.sectionId);
        const item = section?.items.find((record) => record.id === parsed.itemId);
        if (item) {
          push(...getValueSearchPatterns(item.title), ...getValueSearchPatterns(item.subtitle), ...getValueSearchPatterns(item.date));
        }
      }
    }

    return Array.from(new Set(patterns));
  }

  push(anchor);
  return Array.from(new Set(patterns));
}

export function getRawSearchPatterns(anchor: string, resume?: ResumeData): string[] {
  return getRawSearchPatternsWithResume(anchor, resume);
}
