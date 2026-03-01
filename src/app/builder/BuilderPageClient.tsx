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
import { FileText, Code, FormInput, Briefcase, GraduationCap, FolderKanban, Wrench, Plus, FileText as CustomIcon, Eye, Edit3 } from 'lucide-react';
import Link from 'next/link';
import { useResumeStore } from '@/store/resumeStore';
import { useTranslation } from 'react-i18next';

type EditorMode = 'form' | 'raw';
type MobileView = 'edit' | 'preview';
type PreviewScaleMode = 'fit' | 'manual';

const PREVIEW_BASE_WIDTH = 595;
const PREVIEW_SCALE_MIN = 0.45;
const PREVIEW_SCALE_MAX = 1.25;
const PREVIEW_SCALE_STEP = 0.05;
const PREVIEW_HORIZONTAL_PADDING = 40;

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

export default function BuilderPage() {
  const { t } = useTranslation();
  const [ui, setUi] = useState({
    scale: 0.8,
    previewScaleMode: 'fit' as PreviewScaleMode,
    editorMode: 'form' as EditorMode,
    mobileView: 'edit' as MobileView,
    draggedIdx: null as number | null,
    collapsedSections: new Set<string>(),
  });
  const previewViewportRef = useRef<HTMLDivElement>(null);

  const { resume, hasHydrated, reorderSections, updateSectionConfig, addCustomSection, deleteCustomSection } = useResumeStore();

  const clampScale = useCallback((value: number) => {
    return Math.min(PREVIEW_SCALE_MAX, Math.max(PREVIEW_SCALE_MIN, value));
  }, []);

  const getFitScale = useCallback(() => {
    const viewport = previewViewportRef.current;
    if (!viewport) return 0.8;

    const availableWidth = Math.max(viewport.clientWidth - PREVIEW_HORIZONTAL_PADDING, 280);
    return clampScale(availableWidth / PREVIEW_BASE_WIDTH);
  }, [clampScale]);

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

  // 排除 summary（个人简介在头部显示）
  const sortableSections = hasHydrated
    ? [...resume.sections].filter(s => s.id !== 'summary').sort((a, b) => a.order - b.order)
    : [];

  const handleDragStart = (idx: number) => {
    setUi((prev) => ({ ...prev, draggedIdx: idx }));
  };

  const handleDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    if (ui.draggedIdx === null || ui.draggedIdx === idx) return;

    const newSections = [...sortableSections];
    const [removed] = newSections.splice(ui.draggedIdx, 1);
    newSections.splice(idx, 0, removed);

    // 保持 summary 的位置
    const summarySection = resume.sections.find(s => s.id === 'summary');
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
    const section = resume.sections.find(s => s.id === sectionId);
    if (section) {
      updateSectionConfig(sectionId, { visible: !section.visible });
    }
  };

  const getSectionTitle = (sectionId: string): string | undefined => {
    const section = resume.sections.find(s => s.id === sectionId);
    // 如果用户自定义了标题，使用用户的标题；否则返回 undefined 让组件使用 i18n
    if (section?.title) {
      return section.title;
    }
    return t(`builder.sections.${sectionId}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-20">
        <div className="container mx-auto px-4 py-3">
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
      <div className="lg:hidden flex items-center justify-center gap-1 px-4 py-2 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
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
      <div className="grid grid-cols-1 lg:grid-cols-2">
        {/* 左侧编辑区 - 移动端根据 mobileView 切换显示 */}
        <div className={`h-[calc(100vh-110px)] lg:h-[calc(100vh-57px)] overflow-hidden flex flex-col ${ui.mobileView === 'preview' ? 'hidden lg:flex' : 'flex'}`}>
          {/* 编辑模式切换 */}
          <div className="flex items-center gap-1 px-4 sm:px-6 py-2 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
            <button
              onClick={() => setUi((prev) => ({ ...prev, editorMode: 'form' }))}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded transition ${
                ui.editorMode === 'form'
                  ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <FormInput size={14} />
              {t('builder.form')}
            </button>
            <button
              onClick={() => setUi((prev) => ({ ...prev, editorMode: 'raw' }))}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded transition ${
                ui.editorMode === 'raw'
                  ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <Code size={14} />
              {t('builder.raw')}
            </button>
          </div>

          {/* 编辑内容 */}
          {ui.editorMode === 'form' ? (
            <div className="flex-1 overflow-y-auto">
              <div className="flex flex-col gap-6 p-6 max-w-2xl mx-auto lg:mr-0">
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
            <RawEditor />
          )}
        </div>

        {/* 右侧预览区 - 移动端根据 mobileView 切换显示 */}
        <div className={`bg-gray-100 dark:bg-gray-950 h-[calc(100vh-110px)] lg:h-[calc(100vh-57px)] relative flex flex-col ${ui.mobileView === 'edit' ? 'hidden lg:!flex' : 'flex'}`}>
          {/* 缩放控制 */}
          <div className="border-b border-gray-200 dark:border-gray-700 bg-gray-50/95 dark:bg-gray-900/95 px-3 sm:px-4 py-2">
            <div className="flex flex-wrap items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => handleZoom(-PREVIEW_SCALE_STEP)}
                aria-label={t('builder.previewZoomOut')}
                className="px-3 py-1.5 bg-white dark:bg-gray-700 rounded border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 text-sm text-gray-700 dark:text-gray-200"
              >
                −
              </button>

              <span className="text-sm font-medium w-14 text-center tabular-nums text-gray-700 dark:text-gray-300">
                {Math.round(ui.scale * 100)}%
              </span>

              <button
                type="button"
                onClick={() => handleZoom(PREVIEW_SCALE_STEP)}
                aria-label={t('builder.previewZoomIn')}
                className="px-3 py-1.5 bg-white dark:bg-gray-700 rounded border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 text-sm text-gray-700 dark:text-gray-200"
              >
                +
              </button>

              <input
                type="range"
                min={PREVIEW_SCALE_MIN}
                max={PREVIEW_SCALE_MAX}
                step={PREVIEW_SCALE_STEP}
                value={ui.scale}
                onChange={(event) => handleScaleChange(Number(event.target.value))}
                aria-label={t('builder.preview')}
                className="w-24 sm:w-32 accent-gray-900 dark:accent-gray-100"
              />

              <button
                type="button"
                onClick={handleFitScale}
                className={`px-3 py-1.5 rounded border text-xs sm:text-sm transition ${
                  ui.previewScaleMode === 'fit'
                    ? 'bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 border-gray-900 dark:border-gray-100'
                    : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600'
                }`}
              >
                {t('builder.previewFitWidth')}
              </button>

              <button
                type="button"
                onClick={handleActualScale}
                className="px-3 py-1.5 rounded border text-xs sm:text-sm bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 transition"
              >
                {t('builder.previewActualSize')}
              </button>
            </div>

            <p className="hidden sm:block text-[11px] text-center mt-1 text-gray-500 dark:text-gray-400">
              {t('builder.previewHelp')}
            </p>
          </div>

          {/* 预览内容 */}
          <div
            ref={previewViewportRef}
            onWheel={handlePreviewWheel}
            className="flex-1 overflow-auto overflow-x-hidden px-2 py-3 sm:px-6 sm:py-5"
          >
            <div className="flex justify-center">
              <div
                className="will-change-transform"
                style={{
                  transform: `scale(${ui.scale})`,
                  transformOrigin: 'top center',
                }}
              >
                <ResumePreview />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
