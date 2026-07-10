import type { RendererFontFace } from '@/lib/render/fonts';
import type { ResumeData } from '@/types';

export interface RenderRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface RenderLinkRegion extends RenderRect {
  href: string;
}

export interface RenderHitRegion extends RenderRect {
  anchor: string;
}

export type RenderFontWeight = 400 | 500 | 600 | 700;
export type RenderFontStyle = 'normal' | 'italic';

export interface InlineTextSegment {
  text: string;
  kind: 'text' | 'bold' | 'italic' | 'strike' | 'code' | 'link';
  href?: string;
}

export interface RenderTextSegment extends InlineTextSegment {
  start: number;
  end: number;
  fontWeight: RenderFontWeight;
  fontStyle: RenderFontStyle;
  color?: string;
  backgroundColor?: string;
}

export interface ParagraphSpec {
  x: number;
  y: number;
  width: number;
  segments: RenderTextSegment[];
  rawText: string;
  fontFamily: string;
  fontSize: number;
  lineHeight: number;
  color: string;
  align?: 'left' | 'center' | 'right';
  letterSpacing?: number;
  linkColor?: string;
}

export interface RenderParagraphBox extends RenderRect {
  paragraph: ParagraphSpec;
}

/** 单行内一段同字体、同样式的文本，坐标为文档 CSS 像素。矢量 PDF 直接按此绘制。 */
export interface SemanticTextRun {
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
  /** 行基线的文档 y 坐标（PDF 文本定位以基线为准） */
  baselineY: number;
  /** 实际渲染该段文本的字体族（含 emoji 等回退结果） */
  fontFamily: string;
  fontSize: number;
  fontWeight: RenderFontWeight;
  fontStyle: RenderFontStyle;
  color: string;
  backgroundColor?: string;
  strike?: boolean;
  href?: string;
}

export interface RenderRectFill {
  kind: 'rect';
  rect: RenderRect;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  radius?: number;
}

export interface RenderLine {
  kind: 'line';
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  color: string;
  strokeWidth: number;
}

export interface RenderPath {
  kind: 'path';
  path: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
}

export interface RenderImage {
  kind: 'image';
  x: number;
  y: number;
  width: number;
  height: number;
  src: string;
  radius?: number;
}

export interface RenderParagraph {
  kind: 'paragraph';
  box: RenderParagraphBox;
}

export type RenderDrawOp = RenderRectFill | RenderLine | RenderPath | RenderImage | RenderParagraph;

/** 分页后的单页切片：top 为页面顶边在文档坐标系中的 y，内容坐标仍是文档坐标。 */
export interface LayoutPage {
  top: number;
  height: number;
  drawOps: RenderDrawOp[];
  textRuns: SemanticTextRun[];
  linkRegions: RenderLinkRegion[];
}

/** 章节书签：分页后的文档 y 坐标，PDF 侧生成 outline */
export interface OutlineEntry {
  title: string;
  y: number;
}

export interface LayoutDocument {
  /** 文档总宽高（含页间空隙），预览画布使用 */
  width: number;
  height: number;
  pages: LayoutPage[];
  drawOps: RenderDrawOp[];
  textRuns: SemanticTextRun[];
  linkRegions: RenderLinkRegion[];
  hitRegions: RenderHitRegion[];
  outline: OutlineEntry[];
}

export interface RenderArtifact {
  blob: Blob;
  pngBytes: Uint8Array;
  width: number;
  height: number;
  pixelWidth: number;
  pixelHeight: number;
  document: LayoutDocument;
  /** 布局使用的字体 face（PDF 导出据此嵌入同一批字体） */
  fonts: RendererFontFace[];
  objectUrl: string;
  fingerprint: string;
}

export interface RenderBuildOptions {
  theme: ResumeData['theme'];
  translations: {
    experience: string;
    education: string;
    projects: string;
    skills: string;
    present: string;
    customSection: string;
  };
  activeAnchor?: string | null;
}
