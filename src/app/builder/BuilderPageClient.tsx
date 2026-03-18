'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { PersonalInfoEditor } from '@/components/editor/PersonalInfoEditor';
import { ExperienceEditor } from '@/components/editor/ExperienceEditor';
import { EducationEditor } from '@/components/editor/EducationEditor';
import { ProjectEditor } from '@/components/editor/ProjectEditor';
import { SkillEditor } from '@/components/editor/SkillEditor';
import { CustomSectionEditor } from '@/components/editor/CustomSectionEditor';
import { ThemeEditor } from '@/components/editor/ThemeEditor';
import { DraggableSection } from '@/components/editor/DraggableSection';
import { RawEditor } from '@/components/editor/RawEditor';
import { ResumePreview } from '@/components/preview/ResumePreview';
import { ExportButtons } from '@/components/export/ExportButtons';
import { ThemeToggle } from '@/components/ThemeToggle';
import { LanguageToggle } from '@/components/LanguageToggle';
import { FileText, Code, FormInput, Briefcase, GraduationCap, FolderKanban, Wrench, Plus, Minus, FileText as CustomIcon, Eye, Edit3 } from 'lucide-react';
import Link from 'next/link';
import { useResumeStore } from '@/store/resumeStore';
import { useTranslation } from 'react-i18next';
import { getEditorAnchorCandidates, getSectionIdFromPreviewAnchor } from '@/lib/previewAnchor';
import { getPaperDimensions } from '@/lib/paper';
import type { ResumeData, SectionConfig } from '@/types';

type EditorMode = 'form' | 'raw';
type MobileView = 'edit' | 'preview';
type PreviewScaleMode = 'fit' | 'manual';
type RawJumpRequest = { id: number; anchor: string };

interface BuilderUIState {
  scale: number;
  previewScaleMode: PreviewScaleMode;
  editorMode: EditorMode;
  mobileView: MobileView;
  draggedIdx: number | null;
  collapsedSections: Set<string>;
}

const PREVIEW_SCALE_MIN = 0.45;
const PREVIEW_SCALE_MAX = 1.25;
const PREVIEW_SCALE_STEP = 0.05;
const PREVIEW_HORIZONTAL_PADDING = 40;
const PREVIEW_FEEDBACK_DURATION = 1500;
const EDITOR_FLASH_DURATION = 1400;
const EDITOR_FLASH_CLASSES = [
  'ring-2',
  'ring-blue-400',
  'ring-offset-2',
  'ring-offset-white',
  'dark:ring-offset-gray-900',
];

const sectionIcons: Record<string, React.ReactNode> = {
  experience: <Briefcase size={18} />,
  education: <GraduationCap size={18} />,
  projects: <FolderKanban size={18} />,
  skills: <Wrench size={18} />,
};

const sectionEditors: Record<string, React.ReactNode> = {
  experience: <ExperienceEditor embedded />,
  education: <EducationEditor embedded />,
  projects: <ProjectEditor embedded />,
  skills: <SkillEditor embedded />,
};

interface SectionActions {
  sortableSections: SectionConfig[];
  handleDragStart: (idx: number) => void;
  handleDragOver: (e: React.DragEvent, idx: number) => void;
  handleDragEnd: () => void;
  toggleCollapse: (sectionId: string) => void;
  toggleVisible: (sectionId: string) => void;
  getSectionTitle: (sectionId: string) => string | undefined;
}

function createSectionActions({
  resume,
  hasHydrated,
  draggedIdx,
  reorderSections,
  updateSectionConfig,
  setUi,
  t,
}: {
  resume: ResumeData;
  hasHydrated: boolean;
  draggedIdx: number | null;
  reorderSections: (sections: SectionConfig[]) => void;
  updateSectionConfig: (sectionId: string, config: Partial<SectionConfig>) => void;
  setUi: React.Dispatch<React.SetStateAction<BuilderUIState>>;
  t: (key: string) => string;
}): SectionActions {
  const sortableSections = hasHydrated
    ? [...resume.sections].filter((section) => section.id !== 'summary').sort((a, b) => a.order - b.order)
    : [];

  const handleDragStart = (idx: number) => {
    setUi((prev) => ({ ...prev, draggedIdx: idx }));
  };

  const handleDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    if (draggedIdx === null || draggedIdx === idx) return;

    const newSections = [...sortableSections];
    const [removed] = newSections.splice(draggedIdx, 1);
    newSections.splice(idx, 0, removed);

    const summarySection = resume.sections.find((section) => section.id === 'summary');
    const allSections = summarySection ? [summarySection, ...newSections] : newSections;

    reorderSections(allSections);
    setUi((prev) => ({ ...prev, draggedIdx: idx }));
  };

  const handleDragEnd = () => {
    setUi((prev) => ({ ...prev, draggedIdx: null }));
  };

  const toggleCollapse = (sectionId: string) => {
    setUi((prev) => {
      const next = new Set(prev.collapsedSections);
      if (next.has(sectionId)) {
        next.delete(sectionId);
      } else {
        next.add(sectionId);
      }
      return {
        ...prev,
        collapsedSections: next,
      };
    });
  };

  const toggleVisible = (sectionId: string) => {
    const section = resume.sections.find((record) => record.id === sectionId);
    if (section) {
      updateSectionConfig(sectionId, { visible: !section.visible });
    }
  };

  const getSectionTitle = (sectionId: string): string | undefined => {
    const section = resume.sections.find((record) => record.id === sectionId);
    if (section?.title) {
      return section.title;
    }
    return t(`builder.sections.${sectionId}`);
  };

  return {
    sortableSections,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
    toggleCollapse,
    toggleVisible,
    getSectionTitle,
  };
}

function renderBuilderPageLayout({
  t,
  ui,
  setUi,
  editorViewportRef,
  previewViewportRef,
  rawJumpRequest,
  activePreviewAnchor,
  sortableSections,
  getSectionTitle,
  toggleCollapse,
  toggleVisible,
  updateSectionConfig,
  handleDragStart,
  handleDragOver,
  handleDragEnd,
  deleteCustomSection,
  addCustomSection,
  handlePreviewWheel,
  handleZoom,
  handleScaleChange,
  handleFitScale,
  handleActualScale,
  handlePreviewSelect,
}: {
  t: (key: string) => string;
  ui: BuilderUIState;
  setUi: React.Dispatch<React.SetStateAction<BuilderUIState>>;
  editorViewportRef: React.RefObject<HTMLDivElement>;
  previewViewportRef: React.RefObject<HTMLDivElement>;
  rawJumpRequest: RawJumpRequest | null;
  activePreviewAnchor: string | null;
  sortableSections: SectionActions['sortableSections'];
  getSectionTitle: (sectionId: string) => string | undefined;
  toggleCollapse: (sectionId: string) => void;
  toggleVisible: (sectionId: string) => void;
  updateSectionConfig: (sectionId: string, config: Partial<SectionConfig>) => void;
  handleDragStart: (idx: number) => void;
  handleDragOver: (e: React.DragEvent, idx: number) => void;
  handleDragEnd: () => void;
  deleteCustomSection: (sectionId: string) => void;
  addCustomSection: (title: string) => string;
  handlePreviewWheel: (event: React.WheelEvent<HTMLDivElement>) => void;
  handleZoom: (delta: number) => void;
  handleScaleChange: (nextScale: number) => void;
  handleFitScale: () => void;
  handleActualScale: () => void;
  handlePreviewSelect: (anchor: string) => void;
}) {
  return (
    <div id="builder-page" className="h-screen overflow-hidden flex flex-col bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header data-print-hide className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shrink-0 z-20">
        <div className="w-full px-4 sm:px-6 py-3">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 text-gray-900 dark:text-white hover:text-gray-600 dark:hover:text-gray-300 transition">
              <FileText size={20} />
              <span className="font-semibold">{t('common.appName')}</span>
            </Link>
            <div className="flex items-center gap-3">
              <LanguageToggle />
              <ThemeToggle />
              <ExportButtons />
            </div>
          </div>
        </div>
      </header>

      {/* 移动端视图切换 - 放在 Main Content 外部，始终可见 */}
      <div data-print-hide className="lg:hidden shrink-0 flex items-center justify-center gap-1 px-4 py-2 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
        <button
          onClick={() => setUi((prev) => ({ ...prev, mobileView: 'edit' }))}
          className={`flex items-center gap-1.5 px-4 py-2 text-sm rounded-lg transition flex-1 justify-center ${
            ui.mobileView === 'edit'
              ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 shadow-sm'
              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
        >
          <Edit3 size={16} />
          {t('builder.edit')}
        </button>
        <button
          onClick={() => setUi((prev) => ({ ...prev, mobileView: 'preview' }))}
          className={`flex items-center gap-1.5 px-4 py-2 text-sm rounded-lg transition flex-1 justify-center ${
            ui.mobileView === 'preview'
              ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 shadow-sm'
              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
        >
          <Eye size={16} />
          {t('builder.preview')}
        </button>
      </div>

      {/* Main Content */}
      <div id="builder-grid" className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-2">
        {/* 左侧编辑区 - 移动端根据 mobileView 切换显示 */}
        <div data-print-hide className={`h-full overflow-hidden flex flex-col ${ui.mobileView === 'preview' ? 'hidden lg:flex' : 'flex'}`}>
          {/* 编辑模式切换 */}
          <div className="flex items-center h-14 shrink-0 px-4 sm:px-6 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
            <div className="flex items-center gap-1 p-1 bg-gray-100 dark:bg-gray-900 rounded-lg">
              <button
                onClick={() => setUi((prev) => ({ ...prev, editorMode: 'form' }))}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                  ui.editorMode === 'form'
                    ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                }`}
              >
                <FormInput size={15} />
                {t('builder.form')}
              </button>
              <button
                onClick={() => setUi((prev) => ({ ...prev, editorMode: 'raw' }))}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                  ui.editorMode === 'raw'
                    ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                }`}
              >
                <Code size={15} />
                {t('builder.raw')}
              </button>
            </div>
          </div>

          {/* 编辑内容 */}
          {ui.editorMode === 'form' ? (
            <div ref={editorViewportRef} className="flex-1 overflow-y-auto">
              <div className="flex flex-col gap-6 p-6 max-w-4xl w-full mx-auto">
                {/* 个人信息 - 固定在顶部 */}
                <PersonalInfoEditor />

                {/* 可拖拽的模块 */}
                {sortableSections.map((section, idx) => (
                  <DraggableSection
                    key={section.id}
                    section={section}
                    icon={section.isCustom ? <CustomIcon size={18} /> : sectionIcons[section.id]}
                    title={getSectionTitle(section.id)}
                    isCollapsed={ui.collapsedSections.has(section.id)}
                    onToggleCollapse={() => toggleCollapse(section.id)}
                    onToggleVisible={() => toggleVisible(section.id)}
                    onTitleChange={(newTitle) => updateSectionConfig(section.id, { title: newTitle })}
                    onDragStart={() => handleDragStart(idx)}
                    onDragOver={(e) => handleDragOver(e, idx)}
                    onDragEnd={handleDragEnd}
                    isDragging={ui.draggedIdx === idx}
                    onDelete={section.isCustom ? () => deleteCustomSection(section.id) : undefined}
                  >
                    {section.isCustom ? (
                      <CustomSectionEditor sectionId={section.id} embedded />
                    ) : (
                      sectionEditors[section.id]
                    )}
                  </DraggableSection>
                ))}

                {/* 添加自定义模块按钮 */}
                <button
                  onClick={() => {
                    const title = t('editor.customSection.newSectionTitle');
                    addCustomSection(title);
                  }}
                  className="w-full py-3 px-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-gray-500 dark:text-gray-400 hover:border-blue-400 hover:text-blue-500 dark:hover:border-blue-500 dark:hover:text-blue-400 transition-colors flex items-center justify-center gap-2"
                >
                  <Plus size={18} />
                  {t('editor.customSection.addSection')}
                </button>

                {/* 主题设置 - 固定在底部 */}
                <ThemeEditor />
                <div className="h-8" />
              </div>
            </div>
          ) : (
            <RawEditor jumpRequest={rawJumpRequest} />
          )}
        </div>

        {/* 右侧预览区 - 移动端根据 mobileView 切换显示 */}
        <div id="builder-preview-area" className={`bg-gray-100 dark:bg-gray-950 h-full relative flex flex-col ${ui.mobileView === 'edit' ? 'hidden lg:!flex' : 'flex'}`}>
          {/* 缩放控制 */}
          <div data-print-hide className="flex h-auto sm:h-14 shrink-0 flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 px-4 sm:px-6 py-2 sm:py-0 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
            <p className="hidden md:block text-xs text-gray-400 dark:text-gray-500">
              {t('builder.previewHelp')}
            </p>

            <div className="flex flex-wrap items-center justify-center gap-3">
              <div className="flex items-center p-1 bg-gray-100 dark:bg-gray-900 rounded-lg">
                <button
                  type="button"
                  onClick={() => handleZoom(-PREVIEW_SCALE_STEP)}
                  aria-label={t('builder.previewZoomOut')}
                  className="p-1 text-gray-500 hover:text-gray-900 hover:bg-white dark:hover:bg-gray-800 dark:hover:text-white rounded-md transition-all focus:outline-none"
                >
                  <Minus size={16} />
                </button>
                <span className="w-14 text-center text-xs font-semibold tabular-nums text-gray-700 dark:text-gray-300">
                  {Math.round(ui.scale * 100)}%
                </span>
                <button
                  type="button"
                  onClick={() => handleZoom(PREVIEW_SCALE_STEP)}
                  aria-label={t('builder.previewZoomIn')}
                  className="p-1 text-gray-500 hover:text-gray-900 hover:bg-white dark:hover:bg-gray-800 dark:hover:text-white rounded-md transition-all focus:outline-none"
                >
                  <Plus size={16} />
                </button>
              </div>

              <div className="flex items-center p-1 bg-gray-100 dark:bg-gray-900 rounded-lg">
                <button
                  type="button"
                  onClick={handleFitScale}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                    ui.previewScaleMode === 'fit'
                      ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm'
                      : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                  }`}
                >
                  {t('builder.previewFitWidth')}
                </button>
                <button
                  type="button"
                  onClick={handleActualScale}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                    ui.previewScaleMode === 'actual'
                      ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm'
                      : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                  }`}
                >
                  {t('builder.previewActualSize')}
                </button>
              </div>
            </div>
          </div>

          {/* 预览内容 */}
          <div
            id="resume-preview-viewport"
            ref={previewViewportRef}
            onWheel={handlePreviewWheel}
            className="flex-1 overflow-auto overflow-x-hidden px-2 py-3 sm:px-6 sm:py-5"
          >
            <div className="flex justify-center">
              <div
                id="resume-preview-scale-wrapper"
                className="will-change-transform"
                style={{
                  transform: `scale(${ui.scale})`,
                  transformOrigin: 'top center',
                }}
              >
                <ResumePreview
                  onSelectAnchor={handlePreviewSelect}
                  activeAnchor={activePreviewAnchor}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function BuilderPage() {
  const { t } = useTranslation();
  const [activePreviewAnchor, setActivePreviewAnchor] = useState<string | null>(null);
  const [rawJumpRequest, setRawJumpRequest] = useState<RawJumpRequest | null>(null);
  const [ui, setUi] = useState<BuilderUIState>({
    scale: 0.8,
    previewScaleMode: 'fit',
    editorMode: 'form',
    mobileView: 'edit',
    draggedIdx: null,
    collapsedSections: new Set<string>(),
  });
  const previewViewportRef = useRef<HTMLDivElement>(null);
  const editorViewportRef = useRef<HTMLDivElement>(null);
  const previewFeedbackTimerRef = useRef<number | null>(null);
  const editorFlashTimerRef = useRef<number | null>(null);
  const rawJumpCounterRef = useRef(0);
  const activeEditorElementRef = useRef<HTMLElement | null>(null);

  const { resume, hasHydrated, reorderSections, updateSectionConfig, addCustomSection, deleteCustomSection } = useResumeStore();
  const previewBaseWidth = getPaperDimensions(resume.theme.paperSize).width;

  const clampScale = useCallback((value: number) => {
    return Math.min(PREVIEW_SCALE_MAX, Math.max(PREVIEW_SCALE_MIN, value));
  }, []);

  const getFitScale = useCallback(() => {
    const viewport = previewViewportRef.current;
    if (!viewport) return 0.8;

    const availableWidth = Math.max(viewport.clientWidth - PREVIEW_HORIZONTAL_PADDING, 280);
    return clampScale(availableWidth / previewBaseWidth);
  }, [clampScale, previewBaseWidth]);

  const syncFitScale = useCallback(() => {
    const fitScale = getFitScale();
    setUi((prev) => {
      if (prev.previewScaleMode !== 'fit' || Math.abs(prev.scale - fitScale) < 0.001) {
        return prev;
      }
      return {
        ...prev,
        scale: fitScale,
      };
    });
  }, [getFitScale]);

  const handleZoom = useCallback((delta: number) => {
    setUi((prev) => ({
      ...prev,
      previewScaleMode: 'manual',
      scale: clampScale(prev.scale + delta),
    }));
  }, [clampScale]);

  const handleScaleChange = useCallback((nextScale: number) => {
    setUi((prev) => ({
      ...prev,
      previewScaleMode: 'manual',
      scale: clampScale(nextScale),
    }));
  }, [clampScale]);

  const handleFitScale = useCallback(() => {
    const fitScale = getFitScale();
    setUi((prev) => ({
      ...prev,
      previewScaleMode: 'fit',
      scale: fitScale,
    }));
  }, [getFitScale]);

  const handleActualScale = useCallback(() => {
    setUi((prev) => ({
      ...prev,
      previewScaleMode: 'manual',
      scale: 1,
    }));
  }, []);

  const handlePreviewWheel = useCallback((event: React.WheelEvent<HTMLDivElement>) => {
    if (!(event.ctrlKey || event.metaKey)) {
      return;
    }

    event.preventDefault();
    handleZoom(event.deltaY > 0 ? -PREVIEW_SCALE_STEP : PREVIEW_SCALE_STEP);
  }, [handleZoom]);

  useEffect(() => {
    syncFitScale();
  }, [syncFitScale, ui.mobileView]);

  useEffect(() => {
    const viewport = previewViewportRef.current;
    if (!viewport) return;

    if (typeof ResizeObserver !== 'undefined') {
      const observer = new ResizeObserver(syncFitScale);
      observer.observe(viewport);
      return () => observer.disconnect();
    }

    const handleResize = () => syncFitScale();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [syncFitScale]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!(event.metaKey || event.ctrlKey)) return;
      const target = event.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
        return;
      }

      if (event.key === '+' || event.key === '=') {
        event.preventDefault();
        handleZoom(PREVIEW_SCALE_STEP);
        return;
      }

      if (event.key === '-') {
        event.preventDefault();
        handleZoom(-PREVIEW_SCALE_STEP);
        return;
      }

      if (event.key === '0') {
        event.preventDefault();
        handleFitScale();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleFitScale, handleZoom]);

  const clearEditorFlash = useCallback(() => {
    if (!activeEditorElementRef.current) return;

    activeEditorElementRef.current.classList.remove(...EDITOR_FLASH_CLASSES);
    activeEditorElementRef.current = null;
  }, []);

  const flashEditorElement = useCallback((element: HTMLElement) => {
    clearEditorFlash();
    element.classList.add(...EDITOR_FLASH_CLASSES);
    activeEditorElementRef.current = element;

    if (editorFlashTimerRef.current !== null) {
      window.clearTimeout(editorFlashTimerRef.current);
    }

    editorFlashTimerRef.current = window.setTimeout(() => {
      clearEditorFlash();
    }, EDITOR_FLASH_DURATION);
  }, [clearEditorFlash]);

  const findEditorElement = useCallback((anchor: string): HTMLElement | null => {
    const container = editorViewportRef.current;
    if (!container) return null;

    const candidates = getEditorAnchorCandidates(anchor);
    for (const candidate of candidates) {
      const target = container.querySelector<HTMLElement>(`[data-editor-anchor="${candidate}"]`);
      if (target) {
        return target;
      }
    }

    return null;
  }, []);

  const scrollToEditorAnchor = useCallback((anchor: string) => {
    let tries = 0;
    const maxTries = 8;

    const locateAndScroll = () => {
      tries += 1;
      const target = findEditorElement(anchor);

      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'center' });
        flashEditorElement(target);

        const firstInput = target.querySelector<HTMLElement>('input, textarea, select, [contenteditable="true"]');
        if (firstInput) {
          firstInput.focus({ preventScroll: true });
        }
        return;
      }

      if (tries < maxTries) {
        window.setTimeout(locateAndScroll, 60);
      }
    };

    locateAndScroll();
  }, [findEditorElement, flashEditorElement]);

  const handlePreviewSelect = useCallback((anchor: string) => {
    setActivePreviewAnchor(anchor);
    if (previewFeedbackTimerRef.current !== null) {
      window.clearTimeout(previewFeedbackTimerRef.current);
    }
    previewFeedbackTimerRef.current = window.setTimeout(() => {
      setActivePreviewAnchor(null);
    }, PREVIEW_FEEDBACK_DURATION);

    const sectionId = getSectionIdFromPreviewAnchor(anchor);
    setUi((prev) => {
      const nextCollapsed = new Set(prev.collapsedSections);
      if (sectionId) {
        nextCollapsed.delete(sectionId);
      }
      return {
        ...prev,
        mobileView: prev.mobileView === 'preview' ? 'edit' : prev.mobileView,
        collapsedSections: nextCollapsed,
      };
    });

    if (ui.editorMode === 'raw') {
      rawJumpCounterRef.current += 1;
      setRawJumpRequest({
        id: rawJumpCounterRef.current,
        anchor,
      });
      return;
    }

    window.setTimeout(() => {
      scrollToEditorAnchor(anchor);
    }, 90);
  }, [scrollToEditorAnchor, ui.editorMode]);

  useEffect(() => {
    return () => {
      if (previewFeedbackTimerRef.current !== null) {
        window.clearTimeout(previewFeedbackTimerRef.current);
      }
      if (editorFlashTimerRef.current !== null) {
        window.clearTimeout(editorFlashTimerRef.current);
      }
      clearEditorFlash();
    };
  }, [clearEditorFlash]);

  const {
    sortableSections,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
    toggleCollapse,
    toggleVisible,
    getSectionTitle,
  } = createSectionActions({
    resume,
    hasHydrated,
    draggedIdx: ui.draggedIdx,
    reorderSections,
    updateSectionConfig,
    setUi,
    t,
  });

  return renderBuilderPageLayout({
    t,
    ui,
    setUi,
    editorViewportRef,
    previewViewportRef,
    rawJumpRequest,
    activePreviewAnchor,
    sortableSections,
    getSectionTitle,
    toggleCollapse,
    toggleVisible,
    updateSectionConfig,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
    deleteCustomSection,
    addCustomSection,
    handlePreviewWheel,
    handleZoom,
    handleScaleChange,
    handleFitScale,
    handleActualScale,
    handlePreviewSelect,
  });
}
