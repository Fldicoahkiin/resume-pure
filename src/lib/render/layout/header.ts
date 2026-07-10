import { customContactAnchor, personalInfoFieldAnchor } from '@/lib/previewAnchor';
import { sanitizeUrl } from '@/lib/resumeUtils';
import type { ContactItem } from '@/types';
import { DEFAULT_TEXT_COLOR, addBlockHitRegion, addParagraph, buildParagraphSpec, createMarkdownSegments, createPlainSegments, createRectFill, layoutInlineItems, ptToPx, withPointDelta } from './context';
import type { InlinePlacementItem, LayoutContext } from './context';
import { getContactIconVisual } from './icons';
import { buildInlineMetadataItem } from './inline';

const TOP_BAR_MARGIN = 0;

const CONTACT_ITEM_GAP = 12;

const CONTACT_TOP_GAP_DENSE = 3;

const CONTACT_TOP_GAP_DEFAULT = 4;

const SUMMARY_TOP_GAP_DENSE = 4;

const SUMMARY_TOP_GAP_DEFAULT = 6;

export function addHeader(context: LayoutContext) {
  const { data, metrics, width } = context;
  const { personalInfo, theme } = data;
  context.drawOps.push(
    createRectFill(
      { x: 0, y: TOP_BAR_MARGIN, width, height: metrics.topBarHeight },
      theme.primaryColor,
    ),
  );
  context.cursorY = metrics.topBarHeight + metrics.pageTopPadding;

  const headerStartY = context.cursorY;
  const nameSpec = buildParagraphSpec(
    context.contentX,
    context.cursorY,
    context.contentWidth,
    createPlainSegments(personalInfo.name, {
      color: theme.primaryColor,
      fontWeight: 700,
    }),
    {
      fontFamily: theme.fontFamily,
      fontSize: withPointDelta(theme.fontSize, 8),
      lineHeight: metrics.headingLineHeight,
      color: theme.primaryColor,
    },
  );
  const nameSize = addParagraph(context, nameSpec);
  context.cursorY += nameSize.height;

  if (personalInfo.title) {
    const titleGap = ptToPx(metrics.isDenseLayout ? 3 : 4);
    const titleSpec = buildParagraphSpec(
      context.contentX,
      context.cursorY + titleGap,
      context.contentWidth,
      createPlainSegments(personalInfo.title, { color: '#4b5563' }),
      {
        fontFamily: theme.fontFamily,
        fontSize: withPointDelta(theme.fontSize, 2),
        lineHeight: metrics.headingLineHeight,
        color: '#4b5563',
      },
    );
    const titleSize = addParagraph(context, titleSpec);
    context.cursorY += titleGap + titleSize.height;
  }

  if (personalInfo.summary) {
    const summaryGap = metrics.isDenseLayout ? SUMMARY_TOP_GAP_DENSE : SUMMARY_TOP_GAP_DEFAULT;
    const summarySpec = buildParagraphSpec(
      context.contentX,
      context.cursorY + summaryGap,
      context.contentWidth,
      createMarkdownSegments(personalInfo.summary, theme.primaryColor, DEFAULT_TEXT_COLOR),
      {
        fontFamily: theme.fontFamily,
        fontSize: withPointDelta(theme.fontSize, -1),
        lineHeight: metrics.detailLineHeight,
        color: DEFAULT_TEXT_COLOR,
        linkColor: theme.primaryColor,
      },
    );
    const summarySize = addParagraph(context, summarySpec);
    context.cursorY += summaryGap + summarySize.height;
  }

  const contacts = [
    {
      anchor: personalInfoFieldAnchor('email'),
      type: personalInfo.iconConfig?.emailIcon || 'mail',
      value: personalInfo.email,
      href: sanitizeUrl(personalInfo.email),
    },
    {
      anchor: personalInfoFieldAnchor('phone'),
      type: personalInfo.iconConfig?.phoneIcon || 'phone',
      value: personalInfo.phone,
      href: sanitizeUrl(personalInfo.phone),
    },
    {
      anchor: personalInfoFieldAnchor('location'),
      type: personalInfo.iconConfig?.locationIcon || 'map-pin',
      value: personalInfo.location,
      href: undefined,
    },
    {
      anchor: personalInfoFieldAnchor('website'),
      type: personalInfo.iconConfig?.websiteIcon || 'globe',
      value: personalInfo.website,
      href: sanitizeUrl(personalInfo.website),
    },
    {
      anchor: personalInfoFieldAnchor('linkedin'),
      type: personalInfo.iconConfig?.linkedinIcon || 'linkedin',
      value: personalInfo.linkedin,
      href: sanitizeUrl(personalInfo.linkedin),
    },
    {
      anchor: personalInfoFieldAnchor('github'),
      type: personalInfo.iconConfig?.githubIcon || 'github',
      value: personalInfo.github,
      href: sanitizeUrl(personalInfo.github),
    },
    ...(personalInfo.contacts || [])
      .filter((contact) => contact.value)
      .sort((left, right) => left.order - right.order)
      .map((contact: ContactItem) => ({
        anchor: customContactAnchor(contact.id),
        type: contact.type,
        value: contact.value,
        href: contact.href ? sanitizeUrl(contact.href) : sanitizeUrl(contact.value),
      })),
  ].filter((contact) => contact.value);

  const contactTopGap = personalInfo.summary
    ? metrics.isDenseLayout
      ? CONTACT_TOP_GAP_DENSE
      : CONTACT_TOP_GAP_DEFAULT
    : 1;
  const normalizedContactTopGap = ptToPx(contactTopGap);

  const contactItems = contacts.map((contact) => {
    const metadata = buildInlineMetadataItem(context, {
      value: contact.value || '',
      href: theme.enableLinks === false ? undefined : contact.href,
      color: '#4b5563',
      fontSize: withPointDelta(theme.fontSize, -1),
      lineHeight: metrics.metadataLineHeight,
      iconBoxSize: metrics.contactIconBoxSize,
      iconGap: 4,
      iconVisual: getContactIconVisual(contact.type || 'link', metrics.contactIconSize),
      marginRight: CONTACT_ITEM_GAP,
    });

    return {
      ...metadata,
      place: (x: number, y: number) => {
        metadata.place(x, y);
        addBlockHitRegion(context, contact.anchor, {
          x,
          y,
          width: metadata.width,
          height: metadata.height,
        });
      },
    } satisfies InlinePlacementItem;
  });

  const contactsLayout = layoutInlineItems(contactItems, {
    x: context.contentX,
    y: context.cursorY + normalizedContactTopGap,
    maxWidth: context.contentWidth,
    rowGap: 0,
  });

  context.cursorY += normalizedContactTopGap + contactsLayout.height;
  addBlockHitRegion(context, 'personalInfo', {
    x: context.contentX,
    y: headerStartY,
    width: context.contentWidth,
    height: context.cursorY - headerStartY,
  });
  context.cursorY += metrics.headerMarginBottom;
}
