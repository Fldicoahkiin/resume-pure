import type { CanvasKit, TypefaceFontProvider } from 'canvaskit-wasm';
import { getPaperDimensions } from '@/lib/paper';
import type { RenderFontSet } from '@/lib/render/fontSet';
import type { LayoutDocument, RenderBuildOptions } from '@/lib/render/types';
import type { ResumeData, SectionConfig } from '@/types';
import { getRenderLayoutMetrics, ptToPx, type LayoutContext } from './context';
import { addHeader } from './header';
import { addExperienceSection } from './experience';
import { addEducationSection } from './education';
import { addProjectSection } from './projects';
import { addSkillSection } from './skills';
import { addCustomSection } from './custom';
import { paginateDocument } from './paginate';

/**
 * 内置模块的布局分发表：新增模块类型时在此登记，
 * 编辑器侧的对应表见 components/editor/sectionRegistry。
 */
const BUILTIN_SECTION_LAYOUTS: Record<
  string,
  (context: LayoutContext, section: SectionConfig, data: ResumeData) => void
> = {
  experience: (context, section, data) => addExperienceSection(context, section, data.experience),
  education: (context, section, data) => addEducationSection(context, section, data.education),
  projects: (context, section, data) => addProjectSection(context, section, data.projects),
  skills: (context, section, data) => addSkillSection(context, section, data.skills),
};

export async function buildLayoutDocument(
  CanvasKitModule: CanvasKit,
  fontProvider: TypefaceFontProvider,
  fontSet: RenderFontSet,
  data: ResumeData,
  options: RenderBuildOptions,
): Promise<LayoutDocument> {
  const paper = getPaperDimensions(data.theme.paperSize);
  const metrics = getRenderLayoutMetrics(data.theme);
  const renderData: ResumeData = {
    ...data,
    theme: {
      ...data.theme,
      fontSize: ptToPx(data.theme.fontSize),
    },
  };
  const context: LayoutContext = {
    CanvasKitModule,
    fontManager: fontProvider,
    fontSet,
    fallbackFamilies: fontSet.fallbackFamilies(renderData.theme.fontFamily),
    data: renderData,
    options,
    metrics,
    width: paper.width,
    contentX: metrics.pageHorizontalPadding,
    contentWidth: paper.width - metrics.pageHorizontalPadding * 2,
    cursorY: 0,
    drawOps: [],
    textRuns: [],
    linkRegions: [],
    hitRegions: [],
    outline: [],
    breakMarks: [],
  };

  addHeader(context);

  for (const section of data.sections
    .filter((sectionItem) => sectionItem.visible)
    .sort((left, right) => left.order - right.order)) {
    if (section.id === 'summary') {
      continue;
    }

    const layoutSection = BUILTIN_SECTION_LAYOUTS[section.id];
    if (layoutSection) {
      layoutSection(context, section, data);
      continue;
    }

    if (!section.isCustom) {
      continue;
    }

    const customSection = data.customSections.find((record) => record.id === section.id);
    if (!customSection || customSection.items.length === 0) {
      continue;
    }

    addCustomSection(context, section, customSection);
  }

  const pages = paginateDocument(context, paper.height);
  const lastPage = pages[pages.length - 1];

  return {
    width: paper.width,
    height: Math.ceil(lastPage.top + lastPage.height),
    pages,
    drawOps: context.drawOps,
    textRuns: context.textRuns,
    linkRegions: context.linkRegions,
    hitRegions: context.hitRegions,
    outline: context.outline,
  };
}
