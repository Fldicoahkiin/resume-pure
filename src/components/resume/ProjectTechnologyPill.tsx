import { Path, Svg, Text, View } from '@/components/core/Universal';
import type { ResumeData } from '@/types';
import type { ResumeLayoutMetrics } from './layoutTypes';
import { pxToPt } from './layoutMetrics';

interface ProjectTechnologyPillProps {
  label: string;
  theme: ResumeData['theme'];
  metrics: ResumeLayoutMetrics;
  icon?: {
    svgPath: string;
    color: string;
  } | null;
  muted?: boolean;
}

export function ProjectTechnologyPill({
  label,
  theme,
  metrics,
  icon,
  muted = false,
}: ProjectTechnologyPillProps) {
  const textColor = muted ? '#9ca3af' : '#4b5563';

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f9fafb',
        borderRadius: pxToPt(metrics.isDenseLayout ? 7 : 8),
        borderWidth: 0.5,
        borderStyle: 'solid',
        borderColor: '#e5e7eb',
        minHeight: metrics.technologyPillMinHeight,
        marginRight: pxToPt(metrics.isDenseLayout ? 3 : 4),
        marginBottom: pxToPt(metrics.isDenseLayout ? 1 : 2),
        paddingLeft: pxToPt(metrics.isDenseLayout ? 5 : 6),
        paddingRight: pxToPt(metrics.isDenseLayout ? 5 : 6),
        paddingTop: 0,
        paddingBottom: 0,
      }}
    >
      {icon ? (
        <View
          style={{
            width: metrics.inlineIconBoxSize,
            height: metrics.inlineIconBoxSize,
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: pxToPt(2),
            flexShrink: 0,
          }}
        >
          <Svg viewBox="0 0 24 24" style={{ width: metrics.inlineIconSize, height: metrics.inlineIconSize }}>
            <Path d={icon.svgPath} fill={icon.color} />
          </Svg>
        </View>
      ) : null}
      <Text
        style={{
          fontSize: theme.fontSize - (metrics.isDenseLayout ? 2.5 : 2),
          color: textColor,
          lineHeight: metrics.capsuleLineHeight,
        }}
      >
        {label}
      </Text>
    </View>
  );
}
