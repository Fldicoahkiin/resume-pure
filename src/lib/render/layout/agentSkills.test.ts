import type { CanvasKit, TypefaceFontProvider } from 'canvaskit-wasm';
import { describe, expect, it } from 'vitest';
import type { RenderFontSet } from '@/lib/render/fontSet';
import type { RenderParagraph } from '@/lib/render/types';
import type { CustomSectionItem, ResumeData, SectionConfig } from '@/types';
import { getRenderLayoutMetrics, ptToPx, type LayoutContext } from './context';
import { addAgentSkillSection } from './agentSkills';

function createCanvasKitMock() {
  class Style {
    constructor(options: unknown) {
      void options;
    }
  }

  return {
    FontSlant: { Italic: 1, Upright: 0 },
    FontWeight: { Bold: 700, Medium: 500, Normal: 400, SemiBold: 600 },
    LineThroughDecoration: 1,
    NoDecoration: 0,
    ParagraphBuilder: {
      MakeFromFontProvider: () => {
        let text = '';
        return {
          addText: (value: string) => {
            text += value;
          },
          build: () => ({
            delete: () => undefined,
            getHeight: () => 16,
            getLineMetrics: () => [],
            getLongestLine: () => text.length * 7,
            getRectsForRange: () => [],
            layout: () => undefined,
          }),
          delete: () => undefined,
          pop: () => undefined,
          pushStyle: () => undefined,
        };
      },
    },
    ParagraphStyle: Style,
    TextAlign: { Center: 1, Left: 0, Right: 2 },
    TextStyle: Style,
    parseColorString: () => new Float32Array([0, 0, 0, 1]),
  } as unknown as CanvasKit;
}

function createContext(): LayoutContext {
  const theme: ResumeData['theme'] = {
    primaryColor: '#3b82f6',
    fontFamily: 'Test Sans',
    fontSize: 10,
    spacing: 2,
    lineHeight: 1.1,
    enableLinks: true,
    paperSize: 'A4',
  };
  const data: ResumeData = {
    schemaVersion: 1,
    personalInfo: {
      name: '',
      email: '',
      phone: '',
      school: '',
      location: '',
      summary: '',
    },
    experience: [],
    education: [],
    projects: [],
    skills: [],
    customSections: [],
    sections: [],
    theme: { ...theme, fontSize: ptToPx(theme.fontSize) },
  };
  const fontSet: RenderFontSet = {
    faces: [],
    fallbackFamilies: () => ['Test Sans'],
    resolveFamily: () => 'Test Sans',
    dispose: () => undefined,
  };

  return {
    CanvasKitModule: createCanvasKitMock(),
    fontManager: {} as TypefaceFontProvider,
    fontSet,
    fallbackFamilies: ['Test Sans'],
    data,
    options: {
      theme,
      translations: {
        experience: 'Experience',
        education: 'Education',
        projects: 'Projects',
        skills: 'Skills',
        present: 'Present',
        customSection: 'Custom',
      },
    },
    metrics: getRenderLayoutMetrics(theme),
    width: 794,
    contentX: 48,
    contentWidth: 698,
    cursorY: 0,
    drawOps: [],
    textRuns: [],
    linkRegions: [],
    hitRegions: [],
    outline: [],
    breakMarks: [],
  };
}

describe('addAgentSkillSection', () => {
  it('keeps a long purpose inside the content column', () => {
    const context = createContext();
    const section: SectionConfig = { id: 'skills', title: 'Skills', visible: true, order: 0, isCustom: true };
    const purpose = 'Turns a rough product idea into a reviewed spec, an implementation plan and a set of tracked tasks';
    const item: CustomSectionItem = {
      id: 'spec',
      title: 'spec-writer',
      subtitle: purpose,
      description: [],
      showLogo: true,
    };

    addAgentSkillSection(context, section, [item]);

    const subtitle = context.drawOps.find(
      (op): op is RenderParagraph => op.kind === 'paragraph' && op.box.paragraph.rawText === purpose,
    );
    expect(subtitle).toBeDefined();
    expect(subtitle!.box.x + subtitle!.box.width).toBeLessThanOrEqual(context.contentX + context.contentWidth);
  });
});
