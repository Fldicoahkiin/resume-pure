import fontkit from '@pdf-lib/fontkit';
import {
  PDFDocument,
  PDFName,
  PDFNumber,
  PDFString,
  rgb,
} from 'pdf-lib';
import { loadFontFaceBuffer } from '@/lib/render/fonts';
import type { RenderArtifact } from '@/lib/render/types';

const CSS_PIXEL_TO_PDF_POINT = 72 / 96;
const PDF_TEXT_OPACITY = 0;
const NOTO_SANS_SC_REGULAR = '/fonts/noto-sans-sc-400.ttf';
const NOTO_SANS_SC_BOLD = '/fonts/noto-sans-sc-700.ttf';

function getPdfCoordinateY(pageHeight: number, top: number, height: number) {
  return pageHeight - (top + height) * CSS_PIXEL_TO_PDF_POINT;
}

function createLinkAnnotation(
  pdfDoc: PDFDocument,
  page: ReturnType<PDFDocument['addPage']>,
  linkRegion: RenderArtifact['document']['linkRegions'][number],
  pageHeight: number,
) {
  const x1 = linkRegion.x * CSS_PIXEL_TO_PDF_POINT;
  const y1 = getPdfCoordinateY(pageHeight, linkRegion.y, linkRegion.height);
  const x2 = (linkRegion.x + linkRegion.width) * CSS_PIXEL_TO_PDF_POINT;
  const y2 = pageHeight - linkRegion.y * CSS_PIXEL_TO_PDF_POINT;

  const annotation = pdfDoc.context.obj({
    Type: PDFName.of('Annot'),
    Subtype: PDFName.of('Link'),
    Rect: [
      PDFNumber.of(x1),
      PDFNumber.of(y1),
      PDFNumber.of(x2),
      PDFNumber.of(y2),
    ],
    Border: [0, 0, 0],
    A: {
      Type: PDFName.of('Action'),
      S: PDFName.of('URI'),
      URI: PDFString.of(linkRegion.href),
    },
  });

  const annotationRef = pdfDoc.context.register(annotation);
  page.node.addAnnot(annotationRef);
}

export async function exportRenderArtifactToPDF(
  artifact: RenderArtifact,
  filename: string,
) {
  const pdfDoc = await PDFDocument.create();
  pdfDoc.registerFontkit(fontkit);

  const [regularFontBytes, boldFontBytes] = await Promise.all([
    loadFontFaceBuffer(NOTO_SANS_SC_REGULAR),
    loadFontFaceBuffer(NOTO_SANS_SC_BOLD),
  ]);
  const [regularFont, boldFont] = await Promise.all([
    pdfDoc.embedFont(regularFontBytes),
    pdfDoc.embedFont(boldFontBytes),
  ]);
  const pngImage = await pdfDoc.embedPng(artifact.pngBytes);
  const pageWidth = artifact.width * CSS_PIXEL_TO_PDF_POINT;
  const pageHeight = artifact.height * CSS_PIXEL_TO_PDF_POINT;
  const page = pdfDoc.addPage([pageWidth, pageHeight]);

  page.drawImage(pngImage, {
    x: 0,
    y: 0,
    width: pageWidth,
    height: pageHeight,
  });

  for (const textRun of artifact.document.textRuns) {
    page.drawText(textRun.text, {
      x: textRun.x * CSS_PIXEL_TO_PDF_POINT,
      y: getPdfCoordinateY(pageHeight, textRun.y, textRun.height),
      size: textRun.fontSize * CSS_PIXEL_TO_PDF_POINT,
      font: textRun.fontWeight >= 600 ? boldFont : regularFont,
      color: rgb(1, 1, 1),
      opacity: PDF_TEXT_OPACITY,
      lineHeight: textRun.height * CSS_PIXEL_TO_PDF_POINT,
      maxWidth: textRun.width * CSS_PIXEL_TO_PDF_POINT,
    });
  }

  for (const linkRegion of artifact.document.linkRegions) {
    createLinkAnnotation(pdfDoc, page, linkRegion, pageHeight);
  }

  pdfDoc.setTitle(filename);
  pdfDoc.setProducer('resume-pure');

  return await pdfDoc.save();
}
