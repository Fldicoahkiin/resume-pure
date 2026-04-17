import { CSSProperties } from 'react';
import type { ResumeData } from '@/types';
import type { ResumeLayoutMetrics } from './layoutTypes';

const CSS_PIXEL_TO_POINT = 72 / 96;

const PAGE_HORIZONTAL_PADDING = pxToPt(48);
const PAGE_TOP_PADDING = pxToPt(32);
const PAGE_BOTTOM_PADDING = pxToPt(30);
const TOP_BAR_HEIGHT = pxToPt(8);
const ITEM_MARGIN_BOTTOM = pxToPt(8);
const SECTION_HEADING_MARGIN_BOTTOM = pxToPt(8);
const DENSE_SKILL_CAPSULE_MIN_HEIGHT = pxToPt(18);
const DEFAULT_SKILL_CAPSULE_MIN_HEIGHT = pxToPt(22);
const DENSE_TECHNOLOGY_PILL_MIN_HEIGHT = pxToPt(16);
const DEFAULT_TECHNOLOGY_PILL_MIN_HEIGHT = pxToPt(18);

export function pxToPt(value: number): number {
  return value * CSS_PIXEL_TO_POINT;
}

export const SECTION_BAR_STYLE: CSSProperties = {
  width: pxToPt(32),
  height: pxToPt(4),
  borderRadius: 999,
};

export function getResumeLayoutMetrics(theme: ResumeData['theme']): ResumeLayoutMetrics {
  const isDenseLayout = theme.fontSize <= 10 && theme.spacing <= 2;
  const detailLineHeight = Math.max(theme.lineHeight, isDenseLayout ? 1.05 : 1.15);
  const capsuleLineHeight = Math.max(theme.lineHeight, isDenseLayout ? 1.1 : 1.2);

  return {
    isDenseLayout,
    sectionMarginBottom: Math.max(theme.spacing * 2, 0),
    headerMarginBottom: Math.max(theme.spacing * 2, 0),
    pageHorizontalPadding: isDenseLayout ? pxToPt(32) : PAGE_HORIZONTAL_PADDING,
    pageTopPadding: isDenseLayout ? pxToPt(24) : PAGE_TOP_PADDING,
    pageBottomPadding: isDenseLayout ? pxToPt(14) : PAGE_BOTTOM_PADDING,
    topBarHeight: isDenseLayout ? pxToPt(6) : TOP_BAR_HEIGHT,
    itemMarginBottom: isDenseLayout ? pxToPt(6) : ITEM_MARGIN_BOTTOM,
    sectionHeadingMarginBottom: isDenseLayout ? pxToPt(6) : SECTION_HEADING_MARGIN_BOTTOM,
    headingLineHeight: Math.max(theme.lineHeight, 1.1),
    metadataLineHeight: Math.max(theme.lineHeight, 1.05),
    detailLineHeight,
    capsuleLineHeight,
    capsuleLabelLineHeight: isDenseLayout ? theme.lineHeight : capsuleLineHeight,
    capsuleContextLineHeight: isDenseLayout ? theme.lineHeight : detailLineHeight,
    skillCapsuleMinHeight: isDenseLayout ? DENSE_SKILL_CAPSULE_MIN_HEIGHT : DEFAULT_SKILL_CAPSULE_MIN_HEIGHT,
    technologyPillMinHeight: isDenseLayout ? DENSE_TECHNOLOGY_PILL_MIN_HEIGHT : DEFAULT_TECHNOLOGY_PILL_MIN_HEIGHT,
    inlineIconSize: theme.fontSize - 2,
    inlineIconBoxSize: theme.fontSize - 2,
    contactIconSize: pxToPt(9),
    contactIconBoxSize: pxToPt(9),
  };
}
