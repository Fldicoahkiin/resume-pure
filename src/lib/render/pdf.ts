import fontkit from '@pdf-lib/fontkit';
import {
  PDFDocument,
  PDFFont,
  PDFHexString,
  PDFImage,
  PDFName,
  PDFNumber,
  PDFString,
  appendBezierCurve,
  clip,
  closePath,
  degrees,
  endPath,
  fill,
  fillAndStroke,
  lineTo,
  moveTo,
  popGraphicsState,
  pushGraphicsState,
  rgb,
  setFillingColor,
  setLineWidth,
  setStrokingColor,
  stroke,
  type PDFOperator,
  type PDFPage,
  type RGB,
} from 'pdf-lib';
import { RENDER_FALLBACK_FAMILY, type RendererFontFace } from '@/lib/render/fonts';
import { subsetFont } from '@/lib/render/fontSubset';
import { loadEncodedImageBuffer } from '@/lib/render/surface';
import { svgPathToPdfOperators } from '@/lib/render/svgPath';
import type {
  LayoutPage,
  RenderArtifact,
  RenderDrawOp,
  SemanticTextRun,
} from '@/lib/render/types';

/** CSS 像素（96dpi）到 PDF point（72dpi）的换算 */
const K = 72 / 96;
const ICON_VIEWBOX_SIZE = 24;
/** 合成斜体的倾斜角度，与 CanvasKit 的 fake-italic（skew 0.25）一致 */
const ITALIC_SKEW_DEGREES = 14;
/** 三次贝塞尔拟合四分之一圆弧的控制点系数 */
const BEZIER_ARC_KAPPA = 0.5523;

function parseHexColor(value: string): RGB {
  const hex = value.trim().replace(/^#/, '');
  const expanded = hex.length === 3
    ? hex.split('').map((ch) => ch + ch).join('')
    : hex;

  if (!/^[0-9a-f]{6}$/i.test(expanded)) {
    return rgb(0, 0, 0);
  }

  return rgb(
    parseInt(expanded.slice(0, 2), 16) / 255,
    parseInt(expanded.slice(2, 4), 16) / 255,
    parseInt(expanded.slice(4, 6), 16) / 255,
  );
}

function pickFace(faces: RendererFontFace[], family: string, targetWeight: number): RendererFontFace | null {
  const candidates = faces.filter((face) => face.family === family);
  if (candidates.length === 0) {
    return null;
  }

  return candidates.reduce((best, face) =>
    Math.abs(face.weight - targetWeight) < Math.abs(best.weight - targetWeight) ? face : best,
  );
}

function resolveFace(faces: RendererFontFace[], family: string, fontWeight: number): RendererFontFace | null {
  const targetWeight = fontWeight >= 600 ? 700 : 400;
  return pickFace(faces, family, targetWeight) ?? pickFace(faces, RENDER_FALLBACK_FAMILY, targetWeight);
}

function faceKey(face: RendererFontFace) {
  return `${face.family}#${face.weight}#${face.style}`;
}

/**
 * 预扫描所有页的文本 run，按实际使用的 face 收集码点，逐 face 手动子集后嵌入。
 * 返回按 (family, weight) 取回已嵌入 PDFFont 的函数。
 */
function createFontEmbedder(
  pdfDoc: PDFDocument,
  faces: RendererFontFace[],
  pages: RenderArtifact['document']['pages'],
) {
  const usageByFace = new Map<string, { face: RendererFontFace; codePoints: Set<number> }>();

  for (const page of pages) {
    for (const run of page.textRuns) {
      const face = resolveFace(faces, run.fontFamily, run.fontWeight);
      if (!face) {
        continue;
      }
      const key = faceKey(face);
      let entry = usageByFace.get(key);
      if (!entry) {
        entry = { face, codePoints: new Set<number>() };
        usageByFace.set(key, entry);
      }
      for (const char of run.text) {
        const codePoint = char.codePointAt(0);
        if (codePoint !== undefined) {
          entry.codePoints.add(codePoint);
        }
      }
    }
  }

  const embedded = new Map<string, Promise<PDFFont>>();

  return async (family: string, fontWeight: number): Promise<PDFFont> => {
    const face = resolveFace(faces, family, fontWeight);
    if (!face) {
      throw new Error(`pdf-font-face-missing:${family}`);
    }

    const key = faceKey(face);
    const cached = embedded.get(key);
    if (cached) {
      return await cached;
    }

    const codePoints = usageByFace.get(key)?.codePoints ?? new Set<number>();
    const subsetBytes = subsetFont(face.buffer, codePoints);
    const pending = pdfDoc.embedFont(subsetBytes, { subset: false });
    embedded.set(key, pending);
    return await pending;
  };
}

function isPng(bytes: Uint8Array) {
  return bytes.length > 4 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47;
}

function isJpeg(bytes: Uint8Array) {
  return bytes.length > 2 && bytes[0] === 0xff && bytes[1] === 0xd8;
}

/** 其他编码（webp/gif 等）经 canvas 转成 PNG 再嵌入 */
async function transcodeToPng(buffer: ArrayBuffer): Promise<ArrayBuffer> {
  const bitmap = await createImageBitmap(new Blob([buffer]));
  try {
    const canvas = document.createElement('canvas');
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('pdf-image-transcode-context');
    }
    context.drawImage(bitmap, 0, 0);

    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
    if (!blob) {
      throw new Error('pdf-image-transcode-encode');
    }
    return await blob.arrayBuffer();
  } finally {
    bitmap.close();
  }
}

function createImageEmbedder(pdfDoc: PDFDocument) {
  const embedded = new Map<string, Promise<PDFImage | null>>();

  return (src: string): Promise<PDFImage | null> => {
    const cached = embedded.get(src);
    if (cached) {
      return cached;
    }

    const pending = (async () => {
      const buffer = await loadEncodedImageBuffer(src);
      const bytes = new Uint8Array(buffer);

      if (isPng(bytes)) {
        return await pdfDoc.embedPng(buffer);
      }
      if (isJpeg(bytes)) {
        return await pdfDoc.embedJpg(buffer);
      }
      return await pdfDoc.embedPng(await transcodeToPng(buffer));
    })().catch((error) => {
      console.error('PDF 图片嵌入失败，已跳过:', src, error);
      return null;
    });

    embedded.set(src, pending);
    return pending;
  };
}

/**
 * 生成圆角矩形的贝塞尔路径操作符（PDF 坐标，y 向上）。
 * (x, y) 为左下角，radius 已按宽高钳制。
 */
function roundedRectOperators(x: number, y: number, width: number, height: number, radius: number) {
  const r = Math.min(radius, width / 2, height / 2);
  const c = r * BEZIER_ARC_KAPPA;

  return [
    moveTo(x + r, y),
    lineTo(x + width - r, y),
    appendBezierCurve(x + width - r + c, y, x + width, y + r - c, x + width, y + r),
    lineTo(x + width, y + height - r),
    appendBezierCurve(x + width, y + height - r + c, x + width - r + c, y + height, x + width - r, y + height),
    lineTo(x + r, y + height),
    appendBezierCurve(x + r - c, y + height, x, y + height - r + c, x, y + height - r),
    lineTo(x, y + r),
    appendBezierCurve(x, y + r - c, x + r - c, y, x + r, y),
    closePath(),
  ];
}

interface PageGeometry {
  /** 该页顶边的文档 y 坐标（CSS px） */
  top: number;
  /** 页面高度（pt） */
  heightPt: number;
}

/** 文档坐标（top 基准，px）→ PDF 坐标（bottom 基准，pt） */
function toPdfY(geometry: PageGeometry, docTop: number, height: number) {
  return geometry.heightPt - (docTop - geometry.top + height) * K;
}

/**
 * 用 fill / stroke 绘制一组路径操作符，自带图形状态保存。
 * fill rule 取 PDF 默认 nonzero，与 CanvasKit drawPath 的 Winding 一致。
 */
function paintPath(
  page: PDFPage,
  pathOperators: PDFOperator[],
  style: { fill?: string; stroke?: string; strokeWidth?: number },
) {
  const paint: PDFOperator[] = [];
  if (style.fill) {
    paint.push(setFillingColor(parseHexColor(style.fill)));
  }
  if (style.stroke) {
    paint.push(setStrokingColor(parseHexColor(style.stroke)), setLineWidth((style.strokeWidth ?? 1) * K));
  }
  const painter = style.fill && style.stroke ? fillAndStroke() : style.fill ? fill() : stroke();
  page.pushOperators(pushGraphicsState(), ...paint, ...pathOperators, painter, popGraphicsState());
}

function drawRectOp(page: PDFPage, geometry: PageGeometry, op: Extract<RenderDrawOp, { kind: 'rect' }>) {
  const x = op.rect.x * K;
  const width = op.rect.width * K;
  const height = op.rect.height * K;

  if (op.radius) {
    const y = toPdfY(geometry, op.rect.y, op.rect.height);
    const radius = Math.min(op.radius * K, width / 2, height / 2);
    paintPath(page, roundedRectOperators(x, y, width, height, radius), {
      fill: op.fill,
      stroke: op.stroke,
      strokeWidth: op.strokeWidth,
    });
    return;
  }

  page.drawRectangle({
    x,
    y: toPdfY(geometry, op.rect.y, op.rect.height),
    width,
    height,
    color: op.fill ? parseHexColor(op.fill) : undefined,
    borderColor: op.stroke ? parseHexColor(op.stroke) : undefined,
    borderWidth: op.strokeWidth ? op.strokeWidth * K : undefined,
  });
}

function drawLineOp(page: PDFPage, geometry: PageGeometry, op: Extract<RenderDrawOp, { kind: 'line' }>) {
  page.drawLine({
    start: { x: op.x1 * K, y: toPdfY(geometry, op.y1, 0) },
    end: { x: op.x2 * K, y: toPdfY(geometry, op.y2, 0) },
    thickness: op.strokeWidth * K,
    color: parseHexColor(op.color),
  });
}

function drawPathOp(page: PDFPage, geometry: PageGeometry, op: Extract<RenderDrawOp, { kind: 'path' }>) {
  // 图标 viewBox 24×24，x 用宽度缩放、y 用高度缩放（与 canvas 侧一致）
  const pathOperators = svgPathToPdfOperators(op.path, {
    x: op.x * K,
    y: toPdfY(geometry, op.y, 0),
    scaleX: (op.width / ICON_VIEWBOX_SIZE) * K,
    scaleY: (op.height / ICON_VIEWBOX_SIZE) * K,
  });
  paintPath(page, pathOperators, {
    fill: op.fill,
    stroke: op.stroke,
    strokeWidth: op.strokeWidth,
  });
}

async function drawImageOp(
  page: PDFPage,
  geometry: PageGeometry,
  op: Extract<RenderDrawOp, { kind: 'image' }>,
  embedImage: ReturnType<typeof createImageEmbedder>,
) {
  const image = await embedImage(op.src);
  if (!image) {
    return;
  }

  const x = op.x * K;
  const y = toPdfY(geometry, op.y, op.height);
  const width = op.width * K;
  const height = op.height * K;

  if (op.radius) {
    const radius = Math.min(op.radius * K, width / 2, height / 2);
    page.pushOperators(
      pushGraphicsState(),
      ...roundedRectOperators(x, y, width, height, radius),
      clip(),
      endPath(),
    );
    page.drawImage(image, { x, y, width, height });
    page.pushOperators(popGraphicsState());
    return;
  }

  page.drawImage(image, { x, y, width, height });
}

async function drawTextRun(
  page: PDFPage,
  geometry: PageGeometry,
  run: SemanticTextRun,
  embedFont: ReturnType<typeof createFontEmbedder>,
) {
  if (run.backgroundColor) {
    page.drawRectangle({
      x: run.x * K,
      y: toPdfY(geometry, run.y, run.height),
      width: run.width * K,
      height: run.height * K,
      color: parseHexColor(run.backgroundColor),
    });
  }

  const font = await embedFont(run.fontFamily, run.fontWeight);
  const size = run.fontSize * K;

  page.drawText(run.text, {
    x: run.x * K,
    y: toPdfY(geometry, run.baselineY, 0),
    size,
    font,
    color: parseHexColor(run.color),
    // PDF 文本矩阵里 ySkew 进 c 位（x 随 y 偏移）才是"竖笔画倾斜、基线水平"的斜体；
    // xSkew 进 b 位会让基线随字符前进爬升
    ySkew: run.fontStyle === 'italic' ? degrees(ITALIC_SKEW_DEGREES) : undefined,
  });

  if (run.strike) {
    const strikeY = toPdfY(geometry, run.baselineY, 0) + size * 0.28;
    page.drawLine({
      start: { x: run.x * K, y: strikeY },
      end: { x: (run.x + run.width) * K, y: strikeY },
      thickness: Math.max(size / 18, 0.5),
      color: parseHexColor(run.color),
    });
  }
}

function addLinkAnnotation(
  pdfDoc: PDFDocument,
  page: PDFPage,
  geometry: PageGeometry,
  linkRegion: LayoutPage['linkRegions'][number],
) {
  const x1 = linkRegion.x * K;
  const y1 = toPdfY(geometry, linkRegion.y, linkRegion.height);
  const x2 = (linkRegion.x + linkRegion.width) * K;
  const y2 = toPdfY(geometry, linkRegion.y, 0);

  const annotation = pdfDoc.context.obj({
    Type: PDFName.of('Annot'),
    Subtype: PDFName.of('Link'),
    Rect: [PDFNumber.of(x1), PDFNumber.of(y1), PDFNumber.of(x2), PDFNumber.of(y2)],
    Border: [0, 0, 0],
    A: {
      Type: PDFName.of('Action'),
      S: PDFName.of('URI'),
      URI: PDFString.of(linkRegion.href),
    },
  });

  page.node.addAnnot(pdfDoc.context.register(annotation));
}

/** 章节书签（PDF outline）：每个 section 标题一条，跳到所在页的对应位置 */
function addDocumentOutline(pdfDoc: PDFDocument, artifact: RenderArtifact) {
  const entries = artifact.document.outline;
  if (entries.length === 0) {
    return;
  }

  const pages = artifact.document.pages;
  const context = pdfDoc.context;
  const outlinesRef = context.nextRef();
  const entryRefs = entries.map(() => context.nextRef());

  entries.forEach((entry, index) => {
    let pageIndex = pages.findIndex((page) => entry.y >= page.top && entry.y < page.top + page.height);
    if (pageIndex === -1) {
      pageIndex = 0;
    }
    const page = pdfDoc.getPage(pageIndex);
    const yPt = page.getHeight() - (entry.y - pages[pageIndex].top) * K;

    const item = context.obj({
      Title: PDFHexString.fromText(entry.title),
      Parent: outlinesRef,
      Dest: [page.ref, PDFName.of('XYZ'), null, PDFNumber.of(yPt), null],
    });
    if (index > 0) {
      item.set(PDFName.of('Prev'), entryRefs[index - 1]);
    }
    if (index < entries.length - 1) {
      item.set(PDFName.of('Next'), entryRefs[index + 1]);
    }
    context.assign(entryRefs[index], item);
  });

  context.assign(
    outlinesRef,
    context.obj({
      Type: PDFName.of('Outlines'),
      First: entryRefs[0],
      Last: entryRefs[entryRefs.length - 1],
      Count: PDFNumber.of(entries.length),
    }),
  );
  pdfDoc.catalog.set(PDFName.of('Outlines'), outlinesRef);
}

export async function exportRenderArtifactToPDF(
  artifact: RenderArtifact,
  filename: string,
) {
  const pdfDoc = await PDFDocument.create();
  pdfDoc.registerFontkit(fontkit);

  const embedFont = createFontEmbedder(pdfDoc, artifact.fonts, artifact.document.pages);
  const embedImage = createImageEmbedder(pdfDoc);
  const pageWidthPt = artifact.width * K;

  for (const pageSlice of artifact.document.pages) {
    const geometry: PageGeometry = {
      top: pageSlice.top,
      heightPt: pageSlice.height * K,
    };
    const page = pdfDoc.addPage([pageWidthPt, geometry.heightPt]);

    // 第一遍：背景与图形（矩形/线条/图标/图片），保持布局给出的绘制顺序
    for (const op of pageSlice.drawOps) {
      switch (op.kind) {
        case 'rect':
          drawRectOp(page, geometry, op);
          break;
        case 'line':
          drawLineOp(page, geometry, op);
          break;
        case 'path':
          drawPathOp(page, geometry, op);
          break;
        case 'image':
          await drawImageOp(page, geometry, op, embedImage);
          break;
        case 'paragraph':
          // 文本统一在第二遍按语义 run 绘制
          break;
      }
    }

    // 第二遍：真实可选中的文本
    for (const run of pageSlice.textRuns) {
      await drawTextRun(page, geometry, run, embedFont);
    }

    for (const linkRegion of pageSlice.linkRegions) {
      addLinkAnnotation(pdfDoc, page, geometry, linkRegion);
    }
  }

  addDocumentOutline(pdfDoc, artifact);
  pdfDoc.setTitle(filename.replace(/\.pdf$/i, ''));
  pdfDoc.setProducer('resume-pure');

  return await pdfDoc.save();
}
