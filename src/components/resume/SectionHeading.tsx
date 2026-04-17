import { Text, View } from '@/components/core/Universal';
import { SECTION_BAR_STYLE, pxToPt } from './layoutMetrics';
import type { ResumeSectionSharedProps } from './layoutTypes';

interface SectionHeadingProps {
  anchor: string;
  title: string;
  shared: ResumeSectionSharedProps;
}

export function SectionHeading({ anchor, title, shared }: SectionHeadingProps) {
  const { theme, metrics, SelectableBlock } = shared;

  return (
    <SelectableBlock anchor={anchor}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: metrics.sectionHeadingMarginBottom }}>
        <View
          style={{
            ...SECTION_BAR_STYLE,
            backgroundColor: theme.primaryColor,
            marginRight: metrics.isDenseLayout ? pxToPt(6) : pxToPt(8),
          }}
        />
        <Text style={{ fontSize: theme.fontSize + 2, fontWeight: 'bold', color: '#374151' }}>
          {title}
        </Text>
      </View>
    </SelectableBlock>
  );
}
