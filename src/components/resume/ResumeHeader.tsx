import { Circle, Path, Svg, Text, View } from '@/components/core/Universal';
import { InlineMetadataItem } from '@/components/resume/InlineMetadataItem';
import { pxToPt } from '@/components/resume/layoutMetrics';
import type { ResumeLayoutProps, ResumeSectionSharedProps } from '@/components/resume/layoutTypes';
import {
  customContactAnchor,
  personalInfoFieldAnchor,
} from '@/lib/previewAnchor';
import { sanitizeUrl } from '@/lib/resumeUtils';

interface ResumeHeaderProps {
  data: ResumeLayoutProps['data'];
  shared: ResumeSectionSharedProps;
}

function getContactIconSvg(type: string) {
  if (type.includes('mail')) {
    return (
      <Path
        d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
        stroke="#6b7280"
        strokeWidth={1.5}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    );
  }

  if (type.includes('phone')) {
    return (
      <Path
        d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z"
        stroke="#6b7280"
        strokeWidth={1.5}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    );
  }

  if (type.includes('github')) {
    return (
      <Path
        d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
        fill="#6b7280"
      />
    );
  }

  if (type.includes('linkedin')) {
    return (
      <Path
        d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6zM2 9h4v12H2z M4 6a2 2 0 110-4 2 2 0 010 4z"
        stroke="#6b7280"
        strokeWidth={1.5}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    );
  }

  if (type.includes('map') || type.includes('location')) {
    return (
      <Path
        d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z M12 13a3 3 0 100-6 3 3 0 000 6z"
        stroke="#6b7280"
        strokeWidth={1.5}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    );
  }

  if (type.includes('website') || type.includes('globe')) {
    return (
      <>
        <Circle cx="12" cy="12" r="10" stroke="#6b7280" strokeWidth={1.5} fill="none" />
        <Path
          d="M12 2a14.5 14.5 0 000 20 14.5 14.5 0 000-20z M2 12h20"
          stroke="#6b7280"
          strokeWidth={1.5}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </>
    );
  }

  return (
    <Path
      d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"
      stroke="#6b7280"
      strokeWidth={1.5}
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  );
}

export function ResumeHeader({ data, shared }: ResumeHeaderProps) {
  const { theme, linksEnabled, metrics, SelectableBlock, renderMarkdown } = shared;
  const { headerMarginBottom, headingLineHeight, detailLineHeight, metadataLineHeight, contactIconSize, contactIconBoxSize, isDenseLayout } = metrics;

  return (
    <SelectableBlock
      anchor="personalInfo"
      style={{ marginBottom: headerMarginBottom }}
    >
      <Text style={{ fontSize: theme.fontSize + 8, fontWeight: 'bold', color: theme.primaryColor, lineHeight: headingLineHeight }}>
        {data.personalInfo.name}
      </Text>
      {data.personalInfo.title ? (
        <Text style={{ fontSize: theme.fontSize + 2, color: '#4b5563', marginTop: pxToPt(isDenseLayout ? 3 : 4), lineHeight: headingLineHeight }}>
          {data.personalInfo.title}
        </Text>
      ) : null}
      {data.personalInfo.summary ? (
        <Text style={{ fontSize: theme.fontSize - 1, marginTop: pxToPt(isDenseLayout ? 4 : 6), lineHeight: detailLineHeight, color: '#374151' }}>
          {renderMarkdown(data.personalInfo.summary)}
        </Text>
      ) : null}
      <View
        style={{
          marginTop: data.personalInfo.summary ? pxToPt(isDenseLayout ? 3 : 4) : 1,
          flexDirection: 'row',
          flexWrap: 'wrap',
          fontSize: theme.fontSize - 1,
          color: '#4b5563',
        }}
      >
        {[
          {
            anchor: personalInfoFieldAnchor('email'),
            type: data.personalInfo.iconConfig?.emailIcon || 'mail',
            value: data.personalInfo.email,
            href: sanitizeUrl(data.personalInfo.email),
          },
          {
            anchor: personalInfoFieldAnchor('phone'),
            type: data.personalInfo.iconConfig?.phoneIcon || 'phone',
            value: data.personalInfo.phone,
            href: sanitizeUrl(data.personalInfo.phone),
          },
          {
            anchor: personalInfoFieldAnchor('location'),
            type: data.personalInfo.iconConfig?.locationIcon || 'map-pin',
            value: data.personalInfo.location,
            href: undefined,
          },
          {
            anchor: personalInfoFieldAnchor('website'),
            type: data.personalInfo.iconConfig?.websiteIcon || 'globe',
            value: data.personalInfo.website,
            href: sanitizeUrl(data.personalInfo.website),
          },
          {
            anchor: personalInfoFieldAnchor('linkedin'),
            type: data.personalInfo.iconConfig?.linkedinIcon || 'linkedin',
            value: data.personalInfo.linkedin,
            href: sanitizeUrl(data.personalInfo.linkedin),
          },
          {
            anchor: personalInfoFieldAnchor('github'),
            type: data.personalInfo.iconConfig?.githubIcon || 'github',
            value: data.personalInfo.github,
            href: sanitizeUrl(data.personalInfo.github),
          },
          ...(data.personalInfo.contacts || [])
            .filter((contact) => contact.value)
            .sort((left, right) => left.order - right.order)
            .map((contact) => ({
              anchor: customContactAnchor(contact.id),
              type: contact.type,
              value: contact.value,
              href: contact.href ? sanitizeUrl(contact.href) : sanitizeUrl(contact.value),
            })),
        ]
          .filter((contact) => contact.value)
          .map((contact) => (
            <SelectableBlock key={contact.anchor} anchor={contact.anchor}>
              <InlineMetadataItem
                value={contact.value || ''}
                href={contact.href}
                enableLinks={linksEnabled}
                color="#4b5563"
                fontSize={theme.fontSize - 1}
                lineHeight={metadataLineHeight}
                iconBoxSize={contactIconBoxSize}
                iconGap={pxToPt(4)}
                style={{
                  marginRight: pxToPt(isDenseLayout ? 10 : 12),
                  marginBottom: isDenseLayout ? 1 : pxToPt(2),
                }}
                icon={
                  <Svg viewBox="0 0 24 24" style={{ width: contactIconSize, height: contactIconSize }}>
                    {getContactIconSvg(contact.type || 'link')}
                  </Svg>
                }
              />
            </SelectableBlock>
          ))}
      </View>
    </SelectableBlock>
  );
}
