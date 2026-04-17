import type { CustomSectionType, ProjectProofRef } from '@/types';

export function formatCompactNumber(value: number): string {
  return Intl.NumberFormat('en-US', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value);
}

export function formatGitHubPath(url: string): string {
  try {
    const parsed = new URL(url);
    if (parsed.hostname === 'github.com' || parsed.hostname === 'www.github.com') {
      return parsed.pathname.replace(/^\//, '').replace(/\.git$/i, '').replace(/\/$/, '');
    }
  } catch { /* ignore */ }
  return url;
}

export function formatProofRefLabel(ref: ProjectProofRef): string {
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

export function withStableStringKey(items: string[], prefix: string) {
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

export function getDescriptionLines(items: string[], prefix: string) {
  return withStableStringKey(
    items.filter((desc) => desc && desc.trim()),
    prefix
  );
}

export function getDateRange(startDate: string, endDate: string, current: boolean | undefined, presentLabel: string): string {
  if (!startDate && !endDate && !current) {
    return '';
  }

  const normalizedPresentLabel = presentLabel.replace(/^\s*[-–—]+\s*/, '');
  const trailingValue = current ? normalizedPresentLabel : endDate;

  return `${startDate}${startDate && trailingValue ? ' - ' : ''}${trailingValue}`;
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

export const isSafePdfUrl = (url: string | undefined): boolean => {
  if (!url) return false;
  return /^(https?:\/\/|mailto:|tel:)/i.test(url);
};

export function inferCustomSectionType(value: {
  type?: string;
  items?: unknown[];
}): CustomSectionType {
  if (value.type && ['custom', 'project', 'experience', 'education', 'skill'].includes(value.type)) {
    return value.type as CustomSectionType;
  }

  const [firstItem] = value.items || [];
  if (typeof firstItem !== 'object' || firstItem === null || Array.isArray(firstItem)) {
    return 'custom';
  }

  if ('company' in firstItem || 'position' in firstItem) {
    return 'experience';
  }

  if ('school' in firstItem || 'degree' in firstItem || 'major' in firstItem) {
    return 'education';
  }

  if ('category' in firstItem || ('items' in firstItem && Array.isArray(firstItem.items))) {
    return 'skill';
  }

  if (
    'name' in firstItem ||
    'role' in firstItem ||
    'technologies' in firstItem ||
    'proofs' in firstItem ||
    'customLogo' in firstItem
  ) {
    return 'project';
  }

  return 'custom';
}
