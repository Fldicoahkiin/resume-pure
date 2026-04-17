import { Image, Path, Svg, Text, View } from '@/components/core/Universal';
import { DescriptionLines } from '@/components/resume/DescriptionLines';
import { InlineMetadataItem } from '@/components/resume/InlineMetadataItem';
import { SectionHeading } from '@/components/resume/SectionHeading';
import { pxToPt } from '@/components/resume/layoutMetrics';
import type { ResumeSectionSharedProps } from '@/components/resume/layoutTypes';
import {
  customItemAnchor,
  sectionAnchor,
} from '@/lib/previewAnchor';
import {
  formatCompactNumber,
  formatGitHubPath,
  sanitizeUrl,
} from '@/lib/resumeUtils';
import type { CustomSection, CustomSectionItem, SectionConfig } from '@/types';

const INLINE_ICON_GAP = pxToPt(2);
const INLINE_ICON_LINK_GAP = pxToPt(3);
const INLINE_METADATA_GAP = pxToPt(6);

interface GenericCustomSectionProps {
  section: SectionConfig;
  customSection: CustomSection;
  shared: ResumeSectionSharedProps;
}

function isCustomSectionItem(value: CustomSection['items'][number]): value is CustomSectionItem {
  return (
    'title' in value ||
    'subtitle' in value ||
    'date' in value ||
    'url' in value ||
    'repoUrl' in value
  );
}

function CustomLinks({ item, shared }: { item: CustomSectionItem; shared: ResumeSectionSharedProps }) {
  const { theme, linksEnabled, metrics } = shared;
  const repoHref = sanitizeUrl(item.repoUrl);
  const itemHref = sanitizeUrl(item.url);

  return (
    <>
      {item.repoUrl ? (
        <InlineMetadataItem
          value={formatGitHubPath(item.repoUrl)}
          href={repoHref}
          enableLinks={linksEnabled}
          color="#9ca3af"
          fontSize={theme.fontSize - 2}
          lineHeight={metrics.metadataLineHeight}
          iconBoxSize={metrics.inlineIconBoxSize}
          iconGap={INLINE_ICON_GAP}
          style={{ marginLeft: INLINE_METADATA_GAP }}
          icon={
            <Svg viewBox="0 0 24 24" style={{ width: metrics.inlineIconSize, height: metrics.inlineIconSize }}>
              <Path
                d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                fill="#9ca3af"
              />
            </Svg>
          }
        />
      ) : null}

      {item.showStars !== false && typeof item.repoStars === 'number' && item.repoStars > 0 ? (
        <InlineMetadataItem
          value={formatCompactNumber(item.repoStars)}
          enableLinks={false}
          color="#d97706"
          fontSize={theme.fontSize - 2}
          lineHeight={metrics.metadataLineHeight}
          iconBoxSize={metrics.inlineIconBoxSize}
          iconGap={INLINE_ICON_GAP}
          style={{ marginLeft: INLINE_METADATA_GAP }}
          icon={
            <Svg viewBox="0 0 24 24" style={{ width: metrics.inlineIconSize, height: metrics.inlineIconSize }}>
              <Path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill="#d97706" />
            </Svg>
          }
        />
      ) : null}

      {item.url ? (
        <InlineMetadataItem
          value={item.url}
          href={itemHref}
          enableLinks={linksEnabled}
          color="#9ca3af"
          fontSize={theme.fontSize - 2}
          lineHeight={metrics.metadataLineHeight}
          iconBoxSize={metrics.inlineIconBoxSize}
          iconGap={INLINE_ICON_LINK_GAP}
          style={{ marginLeft: INLINE_METADATA_GAP }}
          icon={
            <Svg viewBox="0 0 24 24" style={{ width: metrics.inlineIconSize, height: metrics.inlineIconSize }}>
              <Path d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z" fill="#9ca3af" />
            </Svg>
          }
        />
      ) : null}
    </>
  );
}

export function GenericCustomSection({
  section,
  customSection,
  shared,
}: GenericCustomSectionProps) {
  const { theme, translations, metrics, SelectableBlock, renderMarkdown } = shared;
  const customItems = customSection.items.filter(isCustomSectionItem);

  if (customItems.length === 0) {
    return null;
  }

  return (
    <View style={{ marginBottom: Math.max(theme.spacing * 2, 0) }}>
      <SectionHeading
        anchor={sectionAnchor(section.id)}
        title={section.title || translations.customSection || '自定义模块'}
        shared={shared}
      />
      {customItems.map((item) => {
        const keyPrefix = `custom-${section.id}-${item.id}`;
        const hasMeta = Boolean(item.subtitle || item.date);
        const hasLogo = item.showLogo !== false && Boolean(item.repoAvatarUrl);

        return (
          <SelectableBlock key={item.id} anchor={customItemAnchor(section.id, item.id)}>
            <View style={{ marginBottom: metrics.itemMarginBottom }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                {hasLogo ? (
                  <Image
                    src={item.repoAvatarUrl || ''}
                    alt=""
                    style={{
                      width: pxToPt(metrics.isDenseLayout ? 20 : 24),
                      height: pxToPt(metrics.isDenseLayout ? 20 : 24),
                      borderRadius: pxToPt(metrics.isDenseLayout ? 10 : 12),
                      marginRight: pxToPt(metrics.isDenseLayout ? 6 : 9),
                      objectFit: 'cover',
                    }}
                  />
                ) : null}
                <View style={{ flex: 1, minWidth: 0 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Text style={{ fontSize: theme.fontSize, fontWeight: 'bold', color: '#374151', lineHeight: metrics.headingLineHeight }}>
                      {item.title || 'Untitled'}
                    </Text>
                    {item.date ? (
                      <Text style={{ fontSize: theme.fontSize - 1, color: '#666', flexShrink: 0, lineHeight: metrics.metadataLineHeight }}>
                        {item.date}
                      </Text>
                    ) : null}
                  </View>

                  {hasMeta ? (
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', marginTop: 1 }}>
                      {item.subtitle ? (
                        <Text inline style={{ fontSize: theme.fontSize - 1, color: '#6b7280' }}>
                          {item.subtitle}
                        </Text>
                      ) : null}
                      <CustomLinks item={item} shared={shared} />
                    </View>
                  ) : (
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', marginTop: 1 }}>
                      <CustomLinks item={item} shared={shared} />
                    </View>
                  )}

                  <DescriptionLines
                    items={item.description}
                    keyPrefix={keyPrefix}
                    theme={theme}
                    renderMarkdown={renderMarkdown}
                    lineHeight={metrics.detailLineHeight}
                    showBulletPoints={item.showBulletPoints !== false}
                    itemGap={metrics.isDenseLayout ? 1 : 1.5}
                  />
                </View>
              </View>
            </View>
          </SelectableBlock>
        );
      })}
    </View>
  );
}
