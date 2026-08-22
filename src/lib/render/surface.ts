import type { Canvas, CanvasKit, Surface, TypefaceFontProvider } from 'canvaskit-wasm';
import { fetchWithTimeout } from '@/lib/fetchWithTimeout';
import { isSvgImageContentType, normalizeImageSource } from '@/lib/imageSource';
import { getCanvasKit } from '@/lib/render/canvaskit';
import {
  EXPORT_BACKGROUND,
  PAGE_BORDER_COLOR,
  PAGE_BORDER_WIDTH,
  RENDER_SCALE,
} from '@/lib/render/constants';
import { loadRendererFonts } from '@/lib/render/fonts';
import { FontContextCache } from '@/lib/render/fontContextCache';
import { createRenderFontSet } from '@/lib/render/fontSet';
import { fitRenderImage } from '@/lib/render/imageGeometry';
import { buildLayoutDocument } from '@/lib/render/layout';
import { layoutParagraph } from '@/lib/render/paragraph';
import { RenderImageCache, type RenderImageLease } from '@/lib/render/renderImageCache';
import { prefetchRenderImages } from '@/lib/render/renderImagePrefetch';
import type {
  LayoutDocument,
  RenderArtifact,
  RenderBuildOptions,
  RenderDocumentMode,
  RenderDrawOp,
} from '@/lib/render/types';
import type { ResumeData } from '@/types';

const ICON_VIEWBOX_SIZE = 24;
const RENDER_FETCH_TIMEOUT_MS = 5000;
const IMAGE_LOAD_TIMEOUT_MS = 5000;

const imageCache = new RenderImageCache(32);

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

function loadImageElementAsDataUrl(src: string): Promise<string | null> {
  return new Promise((resolve) => {
    const imageElement = document.createElement('img');
    let settled = false;
    const finish = (value: string | null) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timeout);
      imageElement.onload = null;
      imageElement.onerror = null;
      if (!value) imageElement.src = '';
      resolve(value);
    };
    const timeout = window.setTimeout(() => finish(null), IMAGE_LOAD_TIMEOUT_MS);

    imageElement.crossOrigin = 'anonymous';
    imageElement.referrerPolicy = 'no-referrer';
    imageElement.decoding = 'async';
    imageElement.onload = () => {
      try {
        const canvasElement = document.createElement('canvas');
        canvasElement.width = imageElement.naturalWidth;
        canvasElement.height = imageElement.naturalHeight;
        const renderingContext = canvasElement.getContext('2d');
        if (!renderingContext) {
          finish(null);
          return;
        }

        renderingContext.drawImage(imageElement, 0, 0);
        finish(canvasElement.toDataURL('image/png'));
      } catch {
        finish(null);
      }
    };
    imageElement.onerror = () => finish(null);
    imageElement.src = src;
  });
}

export async function loadEncodedImageBuffer(src: string) {
  const safeSrc = normalizeImageSource(src);
  if (!safeSrc) {
    throw new Error('image-source-unsupported');
  }
  const normalizedSrc = safeSrc;
  try {
    const response = await fetchWithTimeout(normalizedSrc, {
      cache: 'force-cache',
      credentials: 'omit',
      referrerPolicy: 'no-referrer',
    }, RENDER_FETCH_TIMEOUT_MS);
    if (response.ok && !isSvgImageContentType(response.headers.get('content-type'))) {
      return await response.arrayBuffer();
    }
  } catch {
    // Fall through to the image element path for cross-origin image hosts.
  }

  const dataUrl = await loadImageElementAsDataUrl(normalizedSrc);
  if (!dataUrl) {
    throw new Error(`image-fetch-failed:${normalizedSrc}`);
  }

  const dataUrlResponse = await fetchWithTimeout(dataUrl, {
    cache: 'force-cache',
    credentials: 'omit',
    referrerPolicy: 'no-referrer',
  }, RENDER_FETCH_TIMEOUT_MS);
  if (!dataUrlResponse.ok) {
    throw new Error(`image-dataurl-fetch-failed:${normalizedSrc}`);
  }

  return await dataUrlResponse.arrayBuffer();
}

async function acquireRenderImage(CanvasKitModule: CanvasKit, src: string): Promise<RenderImageLease | null> {
  try {
    return await imageCache.acquire(src, async () => {
      const buffer = await loadEncodedImageBuffer(src);
      const image = CanvasKitModule.MakeImageFromEncoded(buffer);
      if (!image) {
        throw new Error(`image-decode-failed:${src}`);
      }
      return image;
    });
  } catch (error) {
    console.error('渲染图片资源失败:', error);
    return null;
  }
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
  fontProvider: TypefaceFontProvider,
  canvas: Canvas,
  operation: Extract<RenderDrawOp, { kind: 'paragraph' }>,
  fallbackFamilies: string[],
) {
  const paragraph = operation.box.paragraph;
  const renderedParagraph = layoutParagraph(CanvasKitModule, fontProvider, paragraph, fallbackFamilies);
  canvas.drawParagraph(renderedParagraph, paragraph.x, paragraph.y);
  renderedParagraph.delete();
}

async function drawImageOp(
  CanvasKitModule: CanvasKit,
  canvas: Canvas,
  operation: Extract<RenderDrawOp, { kind: 'image' }>,
  lease: RenderImageLease | null | undefined,
) {
  if (!lease) {
    return;
  }
  const { image } = lease;

  const srcRect = CanvasKitModule.LTRBRect(0, 0, image.width(), image.height());
  const destination = fitRenderImage(
    {
      x: operation.x,
      y: operation.y,
      width: operation.width,
      height: operation.height,
    },
    { width: image.width(), height: image.height() },
    operation.fit,
  );
  const destRect = CanvasKitModule.LTRBRect(
    destination.x,
    destination.y,
    destination.x + destination.width,
    destination.y + destination.height,
  );
  const draw = () => {
    const paint = createPaint(CanvasKitModule, { color: '#ffffff' });
    canvas.drawImageRect(image, srcRect, destRect, paint, true);
    paint.delete();
  };

  if (operation.radius || operation.fit === 'cover') {
    canvas.save();
    const clipRect = CanvasKitModule.LTRBRect(
      operation.x,
      operation.y,
      operation.x + operation.width,
      operation.y + operation.height,
    );
    if (operation.radius) {
      canvas.clipRRect(
        CanvasKitModule.RRectXY(clipRect, operation.radius, operation.radius),
        CanvasKitModule.ClipOp.Intersect,
        true,
      );
    } else {
      canvas.clipRect(clipRect, CanvasKitModule.ClipOp.Intersect, true);
    }
    draw();
    canvas.restore();
    return;
  }

  draw();
}

async function drawOperation(
  CanvasKitModule: CanvasKit,
  fontProvider: TypefaceFontProvider,
  canvas: Canvas,
  operation: RenderDrawOp,
  fallbackFamilies: string[],
  imageLeases: Map<string, RenderImageLease | null>,
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
      await drawImageOp(CanvasKitModule, canvas, operation, imageLeases.get(operation.src));
      return;
    case 'paragraph':
      drawParagraphOp(CanvasKitModule, fontProvider, canvas, operation, fallbackFamilies);
      return;
    default:
      return;
  }
}

async function drawDocument(
  CanvasKitModule: CanvasKit,
  fontProvider: TypefaceFontProvider,
  surface: Surface,
  document: LayoutDocument,
  fallbackFamilies: string[],
  documentMode: RenderDocumentMode,
) {
  const imageLeases = await prefetchRenderImages(
    document.drawOps,
    (src) => acquireRenderImage(CanvasKitModule, src),
  );
  const canvas = surface.getCanvas();
  canvas.save();
  canvas.scale(RENDER_SCALE, RENDER_SCALE);

  try {
    if (documentMode === 'continuous') {
      canvas.clear(CanvasKitModule.parseColorString(EXPORT_BACKGROUND));
    } else {
      // 页与页之间留透明空隙，每页画白底与描边，预览呈现独立纸张的观感。
      canvas.clear(CanvasKitModule.TRANSPARENT);
      for (const page of document.pages) {
        const pageRect = CanvasKitModule.LTRBRect(0, page.top, document.width, page.top + page.height);
        const backgroundPaint = createPaint(CanvasKitModule, { color: EXPORT_BACKGROUND });
        canvas.drawRect(pageRect, backgroundPaint);
        backgroundPaint.delete();

        const borderPaint = createPaint(CanvasKitModule, {
          color: PAGE_BORDER_COLOR,
          stroke: true,
          strokeWidth: PAGE_BORDER_WIDTH,
        });
        canvas.drawRect(pageRect, borderPaint);
        borderPaint.delete();
      }
    }

    for (const operation of document.drawOps) {
      await drawOperation(CanvasKitModule, fontProvider, canvas, operation, fallbackFamilies, imageLeases);
    }
  } finally {
    canvas.restore();
    for (const lease of imageLeases.values()) {
      lease?.release();
    }
  }

  surface.flush();
}

interface FontContext {
  key: string;
  faces: Awaited<ReturnType<typeof loadRendererFonts>>['faces'];
  fontProvider: TypefaceFontProvider;
  fontSet: ReturnType<typeof createRenderFontSet>;
  fallbackFamilies: string[];
}

async function createFontContext(CanvasKitModule: CanvasKit, selectedFamily: string): Promise<FontContext> {
  const { faces } = await loadRendererFonts(selectedFamily);
  // 按 manifest 的 family 名注册（registerFont 的 alias），绕开字体内部 name 表：
  // Google static TTF 常把 family 标成带字重的名字（如 "Noto Serif SC ExtraLight"），
  // 按内部名匹配会静默回退，导致预览与 PDF 用上不同的字体。
  const fontProvider = CanvasKitModule.TypefaceFontProvider.Make();
  for (const face of faces) {
    fontProvider.registerFont(face.buffer, face.family);
  }
  const fontSet = createRenderFontSet(CanvasKitModule, faces);

  return {
    key: selectedFamily,
    faces,
    fontProvider,
    fontSet,
    fallbackFamilies: fontSet.fallbackFamilies(selectedFamily),
  };
}

let fontContextCache: FontContextCache<FontContext> | null = null;

function acquireFontContext(CanvasKitModule: CanvasKit, selectedFamily: string) {
  if (!fontContextCache) {
    fontContextCache = new FontContextCache(
      (family) => createFontContext(CanvasKitModule, family),
      (context) => {
        context.fontSet.dispose();
        context.fontProvider.delete();
      },
    );
  }

  return fontContextCache.acquire(selectedFamily);
}

export async function buildRenderArtifact(
  data: ResumeData,
  options: RenderBuildOptions,
  documentMode: RenderDocumentMode = 'paged',
): Promise<RenderArtifact> {
  const CanvasKitModule = await getCanvasKit();
  const fontLease = await acquireFontContext(
    CanvasKitModule,
    data.theme.fontFamily,
  );
  const { faces, fontProvider, fontSet, fallbackFamilies } = fontLease.value;
  let surface: Surface | null = null;

  try {
    const document = await buildLayoutDocument(
      CanvasKitModule,
      fontProvider,
      fontSet,
      data,
      options,
      documentMode,
    );
    const pixelWidth = Math.max(1, Math.ceil(document.width * RENDER_SCALE));
    const pixelHeight = Math.max(1, Math.ceil(document.height * RENDER_SCALE));
    surface = createSurface(CanvasKitModule, pixelWidth, pixelHeight).surface;

    await drawDocument(
      CanvasKitModule,
      fontProvider,
      surface,
      document,
      fallbackFamilies,
      documentMode,
    );
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
          pages: document.pages.length,
          ops: document.drawOps.length,
          text: document.textRuns.length,
          links: document.linkRegions.length,
          documentMode,
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
        fonts: faces,
        objectUrl,
        fingerprint,
      };
    } finally {
      snapshot.delete();
    }
  } finally {
    surface?.delete();
    fontLease.release();
  }
}

export function disposeRenderArtifact(artifact: RenderArtifact | null) {
  revokeObjectUrl(artifact?.objectUrl || null);
}
