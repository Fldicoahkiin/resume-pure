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

export function getRawSearchPatterns(anchor: string): string[] {
  const parsed = parsePreviewAnchor(anchor);

  if (parsed.kind === 'personalInfo') {
    return ['"personalInfo"', 'personalInfo:'];
  }

  if (parsed.kind === 'personalField' && parsed.field) {
    const field = parsed.field;
    return [
      `"${field}":`,
      `${field}:`,
      `"personalInfo"`,
      'personalInfo:',
    ];
  }

  if (parsed.kind === 'contact' && parsed.contactId) {
    return [
      `"id": "${parsed.contactId}"`,
      `id: ${parsed.contactId}`,
      `id: "${parsed.contactId}"`,
      '"contacts"',
      'contacts:',
      '"personalInfo"',
      'personalInfo:',
    ];
  }

  if (parsed.kind === 'section' && parsed.sectionId) {
    return [
      `"${parsed.sectionId}"`,
      `${parsed.sectionId}:`,
      `"id": "${parsed.sectionId}"`,
      `id: ${parsed.sectionId}`,
      `id: "${parsed.sectionId}"`,
    ];
  }

  if (parsed.itemId) {
    const sectionToken = parsed.sectionId || '';
    return [
      `"id": "${parsed.itemId}"`,
      `id: ${parsed.itemId}`,
      `id: "${parsed.itemId}"`,
      `"${sectionToken}"`,
      `${sectionToken}:`,
    ].filter(Boolean);
  }

  return [anchor];
}
