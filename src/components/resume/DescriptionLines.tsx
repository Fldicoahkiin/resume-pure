import type { ReactNode } from 'react';
import { Text, View } from '@/components/core/Universal';
import { getDescriptionLines } from '@/lib/resumeUtils';
import type { ResumeData } from '@/types';
import { pxToPt } from './layoutMetrics';

interface DescriptionLinesProps {
  items: string[];
  keyPrefix: string;
  theme: ResumeData['theme'];
  renderMarkdown: (text: string) => ReactNode;
  lineHeight: number;
  showBulletPoints?: boolean;
  itemGap?: number;
}

export function DescriptionLines({
  items,
  keyPrefix,
  theme,
  renderMarkdown,
  lineHeight,
  showBulletPoints = true,
  itemGap = 2.5,
}: DescriptionLinesProps) {
  const descriptionLines = getDescriptionLines(items, keyPrefix);
  if (descriptionLines.length === 0) return null;

  if (!showBulletPoints) {
    return descriptionLines.map((line, index) => (
      <Text
        key={line.key}
        style={{
          fontSize: theme.fontSize - 1,
          color: '#374151',
          lineHeight,
          marginBottom: index === descriptionLines.length - 1 ? 0 : itemGap,
        }}
      >
        {renderMarkdown(line.value)}
      </Text>
    ));
  }

  return descriptionLines.map((line, index) => (
    <View
      key={line.key}
      style={{
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: index === descriptionLines.length - 1 ? 0 : itemGap,
      }}
    >
      <Text
        style={{
          color: '#9ca3af',
          fontSize: theme.fontSize - 1,
          fontWeight: 700,
          lineHeight,
          marginRight: pxToPt(4),
          width: pxToPt(8),
          flexShrink: 0,
        }}
      >
        •
      </Text>
      <Text
        style={{
          color: '#374151',
          flex: 1,
          fontSize: theme.fontSize - 1,
          lineHeight,
        }}
      >
        {renderMarkdown(line.value)}
      </Text>
    </View>
  ));
}
