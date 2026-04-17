import React, { CSSProperties, ReactNode } from 'react';

interface UniversalBaseProps {
  style?: CSSProperties;
  className?: string;
  children?: ReactNode;
  [key: string]: unknown;
}

interface TextProps extends UniversalBaseProps {
  inline?: boolean;
}

export interface SvgProps extends UniversalBaseProps {
  viewBox?: string;
}

export interface PathProps extends UniversalBaseProps {
  d: string;
  fill?: string;
  stroke?: string;
  strokeWidth?: number | string;
  strokeLinecap?: 'butt' | 'round' | 'square';
  strokeLinejoin?: 'miter' | 'round' | 'bevel';
}

export interface CircleProps extends UniversalBaseProps {
  cx: string | number;
  cy: string | number;
  r: string | number;
  fill?: string;
  stroke?: string;
  strokeWidth?: string | number;
}

function shouldForceFlex(style?: CSSProperties): boolean {
  if (!style) return false;

  return Boolean(
    style.flexDirection ||
      style.justifyContent ||
      style.alignItems ||
      style.alignContent ||
      style.flexWrap ||
      style.gap ||
      style.rowGap ||
      style.columnGap
  );
}

const POINT_BASED_STYLE_PROPERTIES = new Set([
  'borderBottomLeftRadius',
  'borderBottomRightRadius',
  'borderBottomWidth',
  'borderLeftWidth',
  'borderRadius',
  'borderRightWidth',
  'borderTopLeftRadius',
  'borderTopRightRadius',
  'borderTopWidth',
  'borderWidth',
  'bottom',
  'columnGap',
  'fontSize',
  'gap',
  'height',
  'left',
  'letterSpacing',
  'margin',
  'marginBottom',
  'marginLeft',
  'marginRight',
  'marginTop',
  'maxHeight',
  'maxWidth',
  'minHeight',
  'minWidth',
  'outlineOffset',
  'padding',
  'paddingBottom',
  'paddingLeft',
  'paddingRight',
  'paddingTop',
  'right',
  'rowGap',
  'top',
  'width',
  'flexBasis',
]);

function normalizeWebStyle(style?: CSSProperties): CSSProperties | undefined {
  if (!style) {
    return style;
  }

  const normalizedStyle: CSSProperties = {};

  for (const [key, value] of Object.entries(style)) {
    if (typeof value === 'number' && value !== 0 && POINT_BASED_STYLE_PROPERTIES.has(key)) {
      (normalizedStyle as Record<string, unknown>)[key] = `${value}pt`;
      continue;
    }

    (normalizedStyle as Record<string, unknown>)[key] = value;
  }

  return normalizedStyle;
}

export const View = ({ style, className, children, ...props }: UniversalBaseProps) => {
  const webStyle = normalizeWebStyle(style);
  const nextStyle: CSSProperties = {
    ...(shouldForceFlex(style) && !style?.display ? { display: 'flex' } : {}),
    ...webStyle,
  };

  return (
    <div className={className} style={nextStyle} {...props}>
      {children}
    </div>
  );
};

export const Text = ({ style, className, children, inline = false, ...props }: TextProps) => {
  const webStyle = normalizeWebStyle(style);
  const nextStyle: CSSProperties = {
    ...(inline ? {} : { display: 'block' }),
    ...webStyle,
  };

  return (
    <span className={className} style={nextStyle} {...props}>
      {children}
    </span>
  );
};

export const Link = ({
  style,
  className,
  href,
  children,
  inline = true,
  ...props
}: UniversalBaseProps & { href?: string; inline?: boolean }) => {
  const { onClick, ...restProps } = props;
  const webStyle = normalizeWebStyle(style);
  const nextStyle: CSSProperties = {
    ...(inline ? {} : { display: 'block' }),
    ...webStyle,
  };

  return (
    <a
      href={href}
      className={className}
      style={nextStyle}
      onClick={(event) => {
        event.stopPropagation();
        if (typeof onClick === 'function') {
          onClick(event);
        }
      }}
      {...restProps}
    >
      {children}
    </a>
  );
};

export const Image = ({
  style,
  className,
  src,
  ...props
}: UniversalBaseProps & { src: string }) => {
  const webStyle = normalizeWebStyle(style);
  const nextStyle: CSSProperties = {
    display: 'block',
    ...webStyle,
  };

  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} className={className} style={nextStyle} alt="" {...props} />;
};

export const Svg = ({ viewBox, className, style, children, ...props }: SvgProps) => {
  const webStyle = normalizeWebStyle(style);
  const nextStyle: CSSProperties = {
    display: 'block',
    flexShrink: 0,
    ...webStyle,
  };

  return (
    <svg viewBox={viewBox} className={className} style={nextStyle} {...props}>
      {children}
    </svg>
  );
};

export const Path = ({
  d,
  fill,
  stroke,
  strokeWidth,
  strokeLinecap,
  strokeLinejoin,
  className,
  style,
}: PathProps) => {
  return (
    <path
      className={className}
      style={normalizeWebStyle(style)}
      d={d}
      fill={fill}
      stroke={stroke}
      strokeWidth={strokeWidth}
      strokeLinecap={strokeLinecap}
      strokeLinejoin={strokeLinejoin}
    />
  );
};

export const Circle = ({ cx, cy, r, fill, stroke, strokeWidth, className, style }: CircleProps) => {
  return (
    <circle
      className={className}
      style={normalizeWebStyle(style)}
      cx={cx}
      cy={cy}
      r={r}
      fill={fill}
      stroke={stroke}
      strokeWidth={strokeWidth}
    />
  );
};
