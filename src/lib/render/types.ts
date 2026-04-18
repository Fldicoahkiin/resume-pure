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
  fontFamilies?: string[];
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
  semanticScale?: number;
  linkColor?: string;
}

export interface RenderParagraphBox extends RenderRect {
  paragraph: ParagraphSpec;
}

export interface SemanticTextRun {
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fontFamily: string;
  fontSize: number;
  fontWeight: RenderFontWeight;
  fontStyle: RenderFontStyle;
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

export interface LayoutDocument {
  width: number;
  height: number;
  drawOps: RenderDrawOp[];
  textRuns: SemanticTextRun[];
  linkRegions: RenderLinkRegion[];
  hitRegions: RenderHitRegion[];
}

export interface RenderArtifact {
  blob: Blob;
  pngBytes: Uint8Array;
  width: number;
  height: number;
  pixelWidth: number;
  pixelHeight: number;
  document: LayoutDocument;
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
