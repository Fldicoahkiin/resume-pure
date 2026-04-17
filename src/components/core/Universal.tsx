import React, { createContext, CSSProperties, ReactNode, useContext } from 'react';
import {
  Circle as PdfCircle,
  Image as PdfImage,
  Link as PdfLink,
  Path as PdfPath,
  Svg as PdfSvg,
  Text as PdfText,
  View as PdfView,
} from '@react-pdf/renderer';
import { createTw } from 'react-pdf-tailwind';

export const tw = createTw({
  theme: {
    extend: {
      colors: {
        gray: {
          50: '#f9fafb',
          100: '#f3f4f6',
          200: '#e5e7eb',
          300: '#d1d5db',
          400: '#9ca3af',
          500: '#6b7280',
          600: '#4b5563',
          700: '#374151',
          800: '#1f2937',
          900: '#111827',
        },
        blue: {
          50: '#eff6ff',
          400: '#60a5fa',
          600: '#2563eb',
          900: '#1e3a8a',
        },
        amber: {
          600: '#d97706',
        },
      },
    },
  },
});

interface PdfContextType {
  isPdf: boolean;
}

export const PdfContext = createContext<PdfContextType>({ isPdf: false });

export const usePdfContext = () => useContext(PdfContext);

type PdfBehaviorProps = Record<string, unknown>;
type PdfStyleProp = NonNullable<React.ComponentProps<typeof PdfView>['style']>;
type ArrayItemOrSelf<T> = T extends readonly (infer Item)[] ? Item : T;
type PdfStyleToken = ArrayItemOrSelf<PdfStyleProp>;

interface UniversalBaseProps {
  style?: CSSProperties;
  className?: string;
  children?: ReactNode;
  pdfProps?: PdfBehaviorProps;
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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isCssProperties(value: unknown): value is CSSProperties {
  return isRecord(value);
}

function toPdfStyle(style: CSSProperties | Record<string, unknown>): PdfStyleToken {
  return style as unknown as PdfStyleToken;
}

function resolvePdfStyles(className?: string, customStyle?: CSSProperties): PdfStyleToken[] {
  const styles: PdfStyleToken[] = [];

  if (className) {
    const safeClasses = className
      .split(' ')
      .filter(
        (segment) =>
          segment &&
          !segment.includes('hover:') &&
          !segment.includes('focus') &&
          !segment.includes('ring') &&
          !segment.includes('transition') &&
          !segment.includes('cursor') &&
          !segment.includes('dark:')
      );
    const safeClassesString = safeClasses.join(' ');

    if (safeClassesString) {
      try {
        styles.push(tw(safeClassesString));
      } catch (error) {
        console.warn(`[react-pdf-tailwind] Failed to parse classes: ${safeClassesString}`, error);
      }
    }
  }

  if (customStyle) {
    styles.push(toPdfStyle(customStyle));
  }

  return styles;
}

function resolvePdfRenderConfig(
  className?: string,
  style?: CSSProperties,
  pdfProps?: PdfBehaviorProps
) {
  const nextPdfProps = { ...(pdfProps || {}) };
  const mergedStyles = resolvePdfStyles(className, style);
  const rawPdfStyle = nextPdfProps.style;
  delete nextPdfProps.style;

  if (Array.isArray(rawPdfStyle)) {
    rawPdfStyle.forEach((entry) => {
      if (isCssProperties(entry)) {
        mergedStyles.push(toPdfStyle(entry));
      }
    });
  } else if (isCssProperties(rawPdfStyle)) {
    mergedStyles.push(toPdfStyle(rawPdfStyle));
  }

  return {
    pdfStyle: mergedStyles,
    pdfProps: nextPdfProps,
  };
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

export const View = ({ style, className, children, pdfProps, ...props }: UniversalBaseProps) => {
  const { isPdf } = usePdfContext();

  if (isPdf) {
    const { pdfStyle, pdfProps: resolvedPdfProps } = resolvePdfRenderConfig(className, style, pdfProps);
    return (
      <PdfView style={pdfStyle} {...resolvedPdfProps}>
        {children}
      </PdfView>
    );
  }

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

export const Text = ({ style, className, children, pdfProps, inline = false, ...props }: TextProps) => {
  const { isPdf } = usePdfContext();

  if (isPdf) {
    const { pdfStyle, pdfProps: resolvedPdfProps } = resolvePdfRenderConfig(className, style, pdfProps);
    return (
      <PdfText style={pdfStyle} {...resolvedPdfProps}>
        {children}
      </PdfText>
    );
  }

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
  pdfProps,
  ...props
}: UniversalBaseProps & { href?: string }) => {
  const { isPdf } = usePdfContext();

  if (isPdf) {
    const { pdfStyle, pdfProps: resolvedPdfProps } = resolvePdfRenderConfig(className, style, pdfProps);
    return (
      <PdfLink src={href || '#'} style={pdfStyle} {...resolvedPdfProps}>
        {children}
      </PdfLink>
    );
  }

  const { onClick, ...restProps } = props;
  const webStyle = normalizeWebStyle(style);

  return (
    <a
      href={href}
      className={className}
      style={webStyle}
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
  pdfProps,
  ...props
}: UniversalBaseProps & { src: string }) => {
  const { isPdf } = usePdfContext();

  if (isPdf) {
    const { pdfStyle, pdfProps: resolvedPdfProps } = resolvePdfRenderConfig(className, style, pdfProps);
    // eslint-disable-next-line jsx-a11y/alt-text
    return <PdfImage src={src} style={pdfStyle} {...resolvedPdfProps} />;
  }

  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} className={className} style={normalizeWebStyle(style)} alt="" {...props} />;
};

export const Svg = ({ viewBox, className, style, children, pdfProps, ...props }: SvgProps) => {
  const { isPdf } = usePdfContext();

  if (isPdf) {
    const { pdfStyle, pdfProps: resolvedPdfProps } = resolvePdfRenderConfig(className, style, pdfProps);
    return (
      <PdfSvg viewBox={viewBox} style={pdfStyle} {...resolvedPdfProps}>
        {children}
      </PdfSvg>
    );
  }

  return (
    <svg viewBox={viewBox} className={className} style={normalizeWebStyle(style)} {...props}>
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
  const { isPdf } = usePdfContext();

  if (isPdf) {
    return (
      <PdfPath
        d={d}
        fill={fill}
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeLinecap={strokeLinecap}
        strokeLinejoin={strokeLinejoin}
      />
    );
  }

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
  const { isPdf } = usePdfContext();

  if (isPdf) {
    return <PdfCircle cx={cx} cy={cy} r={r} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />;
  }

  return (
    <circle className={className} style={normalizeWebStyle(style)} cx={cx} cy={cy} r={r} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />
  );
};
