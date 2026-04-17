import type { CSSProperties, ReactNode } from 'react';
import { isSafePdfUrl } from '@/lib/resumeUtils';
import { Link, Text, View } from '@/components/core/Universal';

interface InlineMetadataItemProps {
  value: string;
  icon: ReactNode;
  href?: string;
  enableLinks: boolean;
  color: string;
  fontSize: number;
  lineHeight: number;
  iconBoxSize: number;
  iconGap: number;
  style?: CSSProperties;
}

export function InlineMetadataItem({
  value,
  icon,
  href,
  enableLinks,
  color,
  fontSize,
  lineHeight,
  iconBoxSize,
  iconGap,
  style,
}: InlineMetadataItemProps) {
  const textStyle: CSSProperties = {
    color,
    fontSize,
    lineHeight,
    flexShrink: 1,
    minWidth: 0,
  };

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', minWidth: 0, ...style }}>
      <View
        style={{
          width: iconBoxSize,
          height: iconBoxSize,
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: iconGap,
          flexShrink: 0,
        }}
      >
        {icon}
      </View>
      {enableLinks && href && isSafePdfUrl(href) ? (
        <Link href={href} inline={false} style={{ ...textStyle, textDecoration: 'none' }}>
          {value}
        </Link>
      ) : (
        <Text style={textStyle}>{value}</Text>
      )}
    </View>
  );
}
