import type { CanvasKit } from 'canvaskit-wasm';
import type { ParagraphSpec, RenderTextSegment } from '@/lib/render/types';

function resolveSegmentColor(paragraph: ParagraphSpec, segment: RenderTextSegment) {
  return (
    segment.color ||
    (segment.kind === 'link' && paragraph.linkColor ? paragraph.linkColor : paragraph.color)
  );
}

function resolveFontWeight(CanvasKitModule: CanvasKit, fontWeight: RenderTextSegment['fontWeight']) {
  switch (fontWeight) {
    case 700:
      return CanvasKitModule.FontWeight.Bold;
    case 600:
      return CanvasKitModule.FontWeight.SemiBold;
    case 500:
      return CanvasKitModule.FontWeight.Medium;
    default:
      return CanvasKitModule.FontWeight.Normal;
  }
}

export function createCanvasKitTextStyle(
  CanvasKitModule: CanvasKit,
  paragraph: ParagraphSpec,
  segment: RenderTextSegment,
) {
  const segmentColor = resolveSegmentColor(paragraph, segment);

  return new CanvasKitModule.TextStyle({
    color: CanvasKitModule.parseColorString(segmentColor),
    backgroundColor: segment.backgroundColor
      ? CanvasKitModule.parseColorString(segment.backgroundColor)
      : undefined,
    fontFamilies: segment.fontFamilies || [paragraph.fontFamily, 'Noto Sans SC'],
    fontSize: paragraph.fontSize,
    heightMultiplier: paragraph.lineHeight,
    fontStyle: {
      weight: resolveFontWeight(CanvasKitModule, segment.fontWeight),
      slant:
        segment.fontStyle === 'italic'
          ? CanvasKitModule.FontSlant.Italic
          : CanvasKitModule.FontSlant.Upright,
    },
    decoration:
      segment.kind === 'strike'
        ? CanvasKitModule.LineThroughDecoration
        : CanvasKitModule.NoDecoration,
    decorationColor:
      segment.kind === 'strike' ? CanvasKitModule.parseColorString(segmentColor) : undefined,
    letterSpacing: paragraph.letterSpacing ?? 0,
  });
}
