import { CSSProperties, ReactNode } from 'react';
import type { ResumeData } from '@/types';

export interface ResumeSelectableBlockProps {
  anchor: string;
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}

export interface ResumeLayoutTranslations {
  experience: string;
  education: string;
  projects: string;
  skills: string;
  present: string;
  customSection?: string;
}

export interface ResumeLayoutProps {
  data: ResumeData;
  translations: ResumeLayoutTranslations;
  SelectableBlock?: React.ComponentType<ResumeSelectableBlockProps>;
}

export interface ResumeLayoutMetrics {
  isDenseLayout: boolean;
  sectionMarginBottom: number;
  headerMarginBottom: number;
  pageHorizontalPadding: number;
  pageTopPadding: number;
  pageBottomPadding: number;
  topBarHeight: number;
  itemMarginBottom: number;
  sectionHeadingMarginBottom: number;
  headingLineHeight: number;
  metadataLineHeight: number;
  detailLineHeight: number;
  capsuleLineHeight: number;
  capsuleLabelLineHeight: number;
  capsuleContextLineHeight: number;
  skillCapsuleMinHeight: number;
  technologyPillMinHeight: number;
  inlineIconSize: number;
  inlineIconBoxSize: number;
  contactIconSize: number;
  contactIconBoxSize: number;
}

export interface ResumeSectionSharedProps {
  theme: ResumeData['theme'];
  linksEnabled: boolean;
  translations: ResumeLayoutTranslations;
  metrics: ResumeLayoutMetrics;
  SelectableBlock: React.ComponentType<ResumeSelectableBlockProps>;
  renderMarkdown: (text: string) => ReactNode;
}
