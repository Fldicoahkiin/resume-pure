import type { CanvasKit, TypefaceFontProvider } from 'canvaskit-wasm';
import { describe, expect, it } from 'vitest';
import type { RenderFontSet } from '@/lib/render/fontSet';
import type { RenderParagraph } from '@/lib/render/types';
import type { Project, ResumeData, SectionConfig } from '@/types';
import { getRenderLayoutMetrics, ptToPx, type LayoutContext } from './context';
import { addProjectSection } from './projects';

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

function createContext(project: Project): LayoutContext {
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
    projects: [project],
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

describe('addProjectSection', () => {
  it('starts project details beside the logo instead of reserving a blank logo-height row', () => {
    const project: Project = {
      id: 'aghub',
      name: 'aghub',
      startDate: '2026.04',
      endDate: '',
      current: true,
      customLogo: 'data:image/png;base64,AA==',
      description: ['项目与亮点 | 面向多种 AI coding agents 的桌面资源工作台'],
    };
    const context = createContext(project);
    const section: SectionConfig = {
      id: 'projects',
      title: 'AI 应用与全栈项目',
      visible: true,
      order: 0,
    };

    addProjectSection(context, section, [project]);

    const logo = context.drawOps.find((operation) => operation.kind === 'image');
    const description = context.drawOps.find(
      (operation): operation is RenderParagraph =>
        operation.kind === 'paragraph' && operation.box.paragraph.rawText.startsWith('项目与亮点'),
    );
    const projectRegion = context.hitRegions.find((region) => region.anchor === 'projects:aghub');

    expect(logo?.kind).toBe('image');
    expect(description).toBeDefined();
    if (!logo || logo.kind !== 'image' || !description || !projectRegion) {
      throw new Error('Project layout operations are incomplete');
    }

    expect(description.box.x).toBeGreaterThanOrEqual(logo.x + logo.width);
    expect(description.box.y).toBeLessThan(logo.y + logo.height);
    expect(projectRegion.y + projectRegion.height).toBeGreaterThanOrEqual(logo.y + logo.height);
  });
});
