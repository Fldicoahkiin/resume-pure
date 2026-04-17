import { Image, Path, Svg, Text, View } from '@/components/core/Universal';
import { resolveSkillLogo } from '@/lib/skillLogo';
import type { ResumeData, SkillLevel } from '@/types';
import type { ResumeLayoutMetrics } from './layoutTypes';
import { pxToPt } from './layoutMetrics';

interface SkillCapsuleProps {
  item: ResumeData['skills'][number]['items'][number];
  theme: ResumeData['theme'];
  metrics: ResumeLayoutMetrics;
}

function getCapsuleStyle(level: SkillLevel, primaryColor: string) {
  switch (level) {
    case 'core':
      return {
        backgroundColor: '#ffffff',
        color: '#111827',
        borderColor: primaryColor,
        fontWeight: 600 as const,
      };
    case 'proficient':
      return {
        backgroundColor: '#ffffff',
        color: '#4b5563',
        borderColor: '#d1d5db',
        fontWeight: 500 as const,
      };
    case 'familiar':
      return {
        backgroundColor: '#f3f4f6',
        color: '#6b7280',
        borderColor: 'transparent',
        fontWeight: 400 as const,
      };
  }
}

export function SkillCapsule({ item, theme, metrics }: SkillCapsuleProps) {
  const logo = resolveSkillLogo(item.name);
  const capsuleStyle = getCapsuleStyle(item.level, theme.primaryColor);

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        flexWrap: 'nowrap',
        borderRadius: 100,
        minHeight: metrics.skillCapsuleMinHeight,
        paddingLeft: pxToPt(metrics.isDenseLayout ? 4.5 : 6.5),
        paddingRight: pxToPt(metrics.isDenseLayout ? 4.5 : 6.5),
        paddingTop: 0,
        paddingBottom: 0,
        marginRight: pxToPt(metrics.isDenseLayout ? 4 : 7),
        marginBottom: metrics.isDenseLayout ? 1 : 2.5,
        backgroundColor: capsuleStyle.backgroundColor,
        borderWidth: 1,
        borderStyle: 'solid',
        borderColor: capsuleStyle.borderColor,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'nowrap' }}>
        {item.showLogo === false ? null : item.logo ? (
          <Image
            src={item.logo}
            alt=""
            style={{
              width: theme.fontSize - 1,
              height: theme.fontSize - 1,
              marginRight: pxToPt(4),
            }}
          />
        ) : logo ? (
          <Svg
            viewBox="0 0 24 24"
            style={{
              width: theme.fontSize - 1,
              height: theme.fontSize - 1,
              marginRight: pxToPt(4),
            }}
          >
            <Path d={logo.svgPath} fill={logo.color} />
          </Svg>
        ) : null}
        <Text
          style={{
            fontSize: theme.fontSize - (metrics.isDenseLayout ? 1 : 0.5),
            color: capsuleStyle.color,
            fontWeight: capsuleStyle.fontWeight,
            lineHeight: metrics.capsuleLabelLineHeight,
          }}
        >
          {item.name}
        </Text>
      </View>

      {item.showContext !== false && item.context ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'nowrap' }}>
          <View
            style={{
              width: 1,
              height: theme.fontSize,
              backgroundColor:
                item.level === 'core'
                  ? `${theme.primaryColor}40`
                  : item.level === 'proficient'
                    ? '#e5e7eb'
                    : '#d1d5db',
              marginLeft: pxToPt(metrics.isDenseLayout ? 3 : 6),
              marginRight: pxToPt(metrics.isDenseLayout ? 3 : 6),
            }}
          />
          <Text
            style={{
              fontSize: theme.fontSize - (metrics.isDenseLayout ? 2.5 : 1.5),
              color:
                item.level === 'core'
                  ? '#4b5563'
                  : item.level === 'proficient'
                    ? '#6b7280'
                    : '#9ca3af',
              fontWeight: 400,
              lineHeight: metrics.capsuleContextLineHeight,
            }}
          >
            {item.context}
          </Text>
        </View>
      ) : null}
    </View>
  );
}
