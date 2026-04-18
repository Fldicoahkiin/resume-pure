import type { Canvas, CanvasKit, FontMgr, Image, Surface } from 'canvaskit-wasm';
import { getCanvasKit } from '@/lib/render/canvaskit';
import { EXPORT_BACKGROUND, RENDER_SCALE } from '@/lib/render/constants';
import { loadRendererFonts } from '@/lib/render/fonts';
import { buildLayoutDocument } from '@/lib/render/layout';
import { createCanvasKitTextStyle } from '@/lib/render/textStyle';
import type {
  LayoutDocument,
  RenderArtifact,
  RenderBuildOptions,
  RenderDrawOp,
} from '@/lib/render/types';
import type { ResumeData } from '@/types';

const ICON_VIEWBOX_SIZE = 24;

const imageCache = new Map<string, Promise<Image | null>>();

function hashString(value: string) {
  let hash = 2166136261;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return (hash >>> 0).toString(16);
}

function createSurface(CanvasKitModule: CanvasKit, width: number, height: number) {
  const canvasElement = document.createElement('canvas');
  canvasElement.width = width;
  canvasElement.height = height;

  const surface = CanvasKitModule.MakeSWCanvasSurface(canvasElement);
  if (!surface) {
    throw new Error('render-surface-unavailable');
  }

  return { surface, canvasElement };
}

function createPaint(CanvasKitModule: CanvasKit, config: {
  color?: string;
  stroke?: boolean;
  strokeWidth?: number;
}) {
  const paint = new CanvasKitModule.Paint();
  paint.setAntiAlias(true);
  paint.setColor(CanvasKitModule.parseColorString(config.color || '#000000'));
  paint.setStyle(config.stroke ? CanvasKitModule.PaintStyle.Stroke : CanvasKitModule.PaintStyle.Fill);
  if (config.strokeWidth) {
    paint.setStrokeWidth(config.strokeWidth);
  }
  return paint;
}

function revokeObjectUrl(objectUrl: string | null) {
  if (objectUrl) {
    URL.revokeObjectURL(objectUrl);
  }
}

async function loadRenderImage(CanvasKitModule: CanvasKit, src: string) {
  const cached = imageCache.get(src);
  if (cached) {
    return await cached;
  }

  const pending = (async () => {
    const response = await fetch(src, { cache: 'force-cache' });
    if (!response.ok) {
      throw new Error(`image-fetch-failed:${src}`);
    }

    const buffer = await response.arrayBuffer();
    const image = CanvasKitModule.MakeImageFromEncoded(buffer);
    if (!image) {
      throw new Error(`image-decode-failed:${src}`);
    }

    return image;
  })().catch((error) => {
    console.error('渲染图片资源失败:', error);
    return null;
  });

  imageCache.set(src, pending);
  return await pending;
}

function drawPathOp(CanvasKitModule: CanvasKit, canvas: Canvas, operation: Extract<RenderDrawOp, { kind: 'path' }>) {
  const path = CanvasKitModule.Path.MakeFromSVGString(operation.path);
  if (!path) {
    return;
  }

  canvas.save();
  canvas.translate(operation.x, operation.y);
  canvas.scale(operation.width / ICON_VIEWBOX_SIZE, operation.height / ICON_VIEWBOX_SIZE);

  if (operation.fill) {
    const fillPaint = createPaint(CanvasKitModule, { color: operation.fill });
    canvas.drawPath(path, fillPaint);
    fillPaint.delete();
  }

  if (operation.stroke) {
    const strokePaint = createPaint(CanvasKitModule, {
      color: operation.stroke,
      stroke: true,
      strokeWidth: operation.strokeWidth ? operation.strokeWidth / (operation.width / ICON_VIEWBOX_SIZE || 1) : 1,
    });
    canvas.drawPath(path, strokePaint);
    strokePaint.delete();
  }

  path.delete();
  canvas.restore();
}

function drawRectOp(CanvasKitModule: CanvasKit, canvas: Canvas, operation: Extract<RenderDrawOp, { kind: 'rect' }>) {
  const { rect } = operation;

  if (operation.radius) {
    const rrect = CanvasKitModule.RRectXY(
      CanvasKitModule.LTRBRect(rect.x, rect.y, rect.x + rect.width, rect.y + rect.height),
      operation.radius,
      operation.radius,
    );

    if (operation.fill) {
      const fillPaint = createPaint(CanvasKitModule, { color: operation.fill });
      canvas.drawRRect(rrect, fillPaint);
      fillPaint.delete();
    }

    if (operation.stroke) {
      const strokePaint = createPaint(CanvasKitModule, {
        color: operation.stroke,
        stroke: true,
        strokeWidth: operation.strokeWidth,
      });
      canvas.drawRRect(rrect, strokePaint);
      strokePaint.delete();
    }

    return;
  }

  if (operation.fill) {
    const fillPaint = createPaint(CanvasKitModule, { color: operation.fill });
    canvas.drawRect(CanvasKitModule.LTRBRect(rect.x, rect.y, rect.x + rect.width, rect.y + rect.height), fillPaint);
    fillPaint.delete();
  }

  if (operation.stroke) {
    const strokePaint = createPaint(CanvasKitModule, {
      color: operation.stroke,
      stroke: true,
      strokeWidth: operation.strokeWidth,
    });
    canvas.drawRect(CanvasKitModule.LTRBRect(rect.x, rect.y, rect.x + rect.width, rect.y + rect.height), strokePaint);
    strokePaint.delete();
  }
}

function drawLineOp(CanvasKitModule: CanvasKit, canvas: Canvas, operation: Extract<RenderDrawOp, { kind: 'line' }>) {
  const paint = createPaint(CanvasKitModule, {
    color: operation.color,
    stroke: true,
    strokeWidth: operation.strokeWidth,
  });
  canvas.drawLine(operation.x1, operation.y1, operation.x2, operation.y2, paint);
  paint.delete();
}

function drawParagraphOp(
  CanvasKitModule: CanvasKit,
  fontManager: FontMgr,
  canvas: Canvas,
  operation: Extract<RenderDrawOp, { kind: 'paragraph' }>,
) {
  const paragraph = operation.box.paragraph;
  const built = CanvasKitModule.ParagraphBuilder.Make(
    new CanvasKitModule.ParagraphStyle({
      textAlign:
        paragraph.align === 'center'
          ? CanvasKitModule.TextAlign.Center
          : paragraph.align === 'right'
            ? CanvasKitModule.TextAlign.Right
            : CanvasKitModule.TextAlign.Left,
      textStyle: {
        fontFamilies: [paragraph.fontFamily, 'Noto Sans SC'],
        fontSize: paragraph.fontSize,
        heightMultiplier: paragraph.lineHeight,
      },
    }),
    fontManager,
  );

  for (const segment of paragraph.segments) {
    built.pushStyle(createCanvasKitTextStyle(CanvasKitModule, paragraph, segment));
    built.addText(segment.text);
    built.pop();
  }

  const renderedParagraph = built.build();
  renderedParagraph.layout(paragraph.width);
  canvas.drawParagraph(renderedParagraph, paragraph.x, paragraph.y);
  renderedParagraph.delete();
  built.delete();
}

async function drawImageOp(
  CanvasKitModule: CanvasKit,
  canvas: Canvas,
  operation: Extract<RenderDrawOp, { kind: 'image' }>,
) {
  const image = await loadRenderImage(CanvasKitModule, operation.src);
  if (!image) {
    return;
  }

  const draw = () => {
    const srcRect = CanvasKitModule.LTRBRect(0, 0, image.width(), image.height());
    const destRect = CanvasKitModule.LTRBRect(
      operation.x,
      operation.y,
      operation.x + operation.width,
      operation.y + operation.height,
    );
    const paint = createPaint(CanvasKitModule, { color: '#ffffff' });
    canvas.drawImageRect(image, srcRect, destRect, paint, true);
    paint.delete();
  };

  if (operation.radius) {
    canvas.save();
    canvas.clipRRect(
      CanvasKitModule.RRectXY(
        CanvasKitModule.LTRBRect(operation.x, operation.y, operation.x + operation.width, operation.y + operation.height),
        operation.radius,
        operation.radius,
      ),
      CanvasKitModule.ClipOp.Intersect,
      true,
    );
    draw();
    canvas.restore();
    return;
  }

  draw();
}

async function drawOperation(
  CanvasKitModule: CanvasKit,
  fontManager: FontMgr,
  canvas: Canvas,
  operation: RenderDrawOp,
) {
  switch (operation.kind) {
    case 'rect':
      drawRectOp(CanvasKitModule, canvas, operation);
      return;
    case 'line':
      drawLineOp(CanvasKitModule, canvas, operation);
      return;
    case 'path':
      drawPathOp(CanvasKitModule, canvas, operation);
      return;
    case 'image':
      await drawImageOp(CanvasKitModule, canvas, operation);
      return;
    case 'paragraph':
      drawParagraphOp(CanvasKitModule, fontManager, canvas, operation);
      return;
    default:
      return;
  }
}

async function drawDocument(
  CanvasKitModule: CanvasKit,
  fontManager: FontMgr,
  surface: Surface,
  document: LayoutDocument,
) {
  const canvas = surface.getCanvas();
  canvas.save();
  canvas.scale(RENDER_SCALE, RENDER_SCALE);

  const backgroundPaint = createPaint(CanvasKitModule, { color: EXPORT_BACKGROUND });
  canvas.drawRect(
    CanvasKitModule.LTRBRect(0, 0, document.width, document.height),
    backgroundPaint,
  );
  backgroundPaint.delete();

  for (const operation of document.drawOps) {
    await drawOperation(CanvasKitModule, fontManager, canvas, operation);
  }

  canvas.restore();
  surface.flush();
}

export async function buildRenderArtifact(
  data: ResumeData,
  options: RenderBuildOptions,
): Promise<RenderArtifact> {
  const CanvasKitModule = await getCanvasKit();
  const { buffers } = await loadRendererFonts(data.theme.fontFamily);
  const fontManager = CanvasKitModule.FontMgr.FromData(...buffers);
  if (!fontManager) {
    throw new Error('render-font-manager-unavailable');
  }

  try {
    const document = await buildLayoutDocument(CanvasKitModule, fontManager, data, options);
    const pixelWidth = Math.max(1, Math.ceil(document.width * RENDER_SCALE));
    const pixelHeight = Math.max(1, Math.ceil(document.height * RENDER_SCALE));
    const { surface } = createSurface(CanvasKitModule, pixelWidth, pixelHeight);

    try {
      await drawDocument(CanvasKitModule, fontManager, surface, document);
      const snapshot = surface.makeImageSnapshot();
      if (!snapshot) {
        throw new Error('render-snapshot-unavailable');
      }

      try {
        const encoded = snapshot.encodeToBytes(CanvasKitModule.ImageFormat.PNG, 100);
        if (!encoded) {
          throw new Error('render-encode-failed');
        }

        const pngBytes = new Uint8Array(encoded);
        const pngBuffer = pngBytes.buffer.slice(pngBytes.byteOffset, pngBytes.byteOffset + pngBytes.byteLength);
        const blob = new Blob([pngBuffer], { type: 'image/png' });
        const objectUrl = URL.createObjectURL(blob);
        const fingerprint = hashString(
          JSON.stringify({
            theme: data.theme,
            schemaVersion: data.schemaVersion,
            width: document.width,
            height: document.height,
            ops: document.drawOps.length,
            text: document.textRuns.length,
            links: document.linkRegions.length,
          }),
        );

        return {
          blob,
          pngBytes,
          width: document.width,
          height: document.height,
          pixelWidth,
          pixelHeight,
          document,
          objectUrl,
          fingerprint,
        };
      } finally {
        snapshot.delete();
      }
    } finally {
      surface.delete();
    }
  } finally {
    fontManager.delete();
  }
}

export function disposeRenderArtifact(artifact: RenderArtifact | null) {
  revokeObjectUrl(artifact?.objectUrl || null);
}
