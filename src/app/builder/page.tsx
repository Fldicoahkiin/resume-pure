'use client';

import { useState } from 'react';
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
  const [scale, setScale] = useState(0.6);
  const [editorMode, setEditorMode] = useState<EditorMode>('form');
  const [mobileView, setMobileView] = useState<MobileView>('edit');
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());

  const { resume, hasHydrated, reorderSections, updateSectionConfig, addCustomSection, deleteCustomSection } = useResumeStore();

  // 排除 summary（个人简介在头部显示）
  const sortableSections = hasHydrated
    ? [...resume.sections].filter(s => s.id !== 'summary').sort((a, b) => a.order - b.order)
    : [];

  const handleDragStart = (idx: number) => {
    setDraggedIdx(idx);
  };

  const handleDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    if (draggedIdx === null || draggedIdx === idx) return;

    const newSections = [...sortableSections];
    const [removed] = newSections.splice(draggedIdx, 1);
    newSections.splice(idx, 0, removed);

    // 保持 summary 的位置
    const summarySection = resume.sections.find(s => s.id === 'summary');
    const allSections = summarySection ? [summarySection, ...newSections] : newSections;

    reorderSections(allSections);
    setDraggedIdx(idx);
  };

  const handleDragEnd = () => {
    setDraggedIdx(null);
  };

  const toggleCollapse = (sectionId: string) => {
    setCollapsedSections(prev => {
      const next = new Set(prev);
      if (next.has(sectionId)) {
        next.delete(sectionId);
      } else {
        next.add(sectionId);
      }
      return next;
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
          onClick={() => setMobileView('edit')}
          className={`flex items-center gap-1.5 px-4 py-2 text-sm rounded-lg transition flex-1 justify-center ${
            mobileView === 'edit'
              ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 shadow-sm'
              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
        >
          <Edit3 size={16} />
          {t('builder.edit')}
        </button>
        <button
          onClick={() => setMobileView('preview')}
          className={`flex items-center gap-1.5 px-4 py-2 text-sm rounded-lg transition flex-1 justify-center ${
            mobileView === 'preview'
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
        <div className={`h-[calc(100vh-110px)] lg:h-[calc(100vh-57px)] overflow-hidden flex flex-col ${mobileView === 'preview' ? 'hidden lg:flex' : 'flex'}`}>
          {/* 编辑模式切换 */}
          <div className="flex items-center gap-1 px-4 sm:px-6 py-2 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
            <button
              onClick={() => setEditorMode('form')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded transition ${
                editorMode === 'form'
                  ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <FormInput size={14} />
              {t('builder.form')}
            </button>
            <button
              onClick={() => setEditorMode('raw')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded transition ${
                editorMode === 'raw'
                  ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <Code size={14} />
              {t('builder.raw')}
            </button>
          </div>

          {/* 编辑内容 */}
          {editorMode === 'form' ? (
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
                    isCollapsed={collapsedSections.has(section.id)}
                    onToggleCollapse={() => toggleCollapse(section.id)}
                    onToggleVisible={() => toggleVisible(section.id)}
                    onTitleChange={(newTitle) => updateSectionConfig(section.id, { title: newTitle })}
                    onDragStart={() => handleDragStart(idx)}
                    onDragOver={(e) => handleDragOver(e, idx)}
                    onDragEnd={handleDragEnd}
                    isDragging={draggedIdx === idx}
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
        <div className={`bg-gray-100 dark:bg-gray-950 h-[calc(100vh-110px)] lg:h-[calc(100vh-57px)] relative ${mobileView === 'edit' ? 'hidden lg:!flex' : 'flex'}`}>
          {/* 缩放控制 */}
          <div className="absolute bottom-0 left-0 right-0 flex items-center justify-center gap-4 py-3 bg-gray-200 dark:bg-gray-800 border-t border-gray-300 dark:border-gray-700 z-10">
            <button
              onClick={() => setScale(s => Math.max(0.3, s - 0.1))}
              className="px-3 py-1 bg-white dark:bg-gray-700 rounded border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 text-sm text-gray-700 dark:text-gray-200"
            >
              −
            </button>
            <span className="text-sm font-medium w-12 text-center text-gray-600 dark:text-gray-300">
              {Math.round(scale * 100)}%
            </span>
            <button
              onClick={() => setScale(s => Math.min(1, s + 0.1))}
              className="px-3 py-1 bg-white dark:bg-gray-700 rounded border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 text-sm text-gray-700 dark:text-gray-200"
            >
              +
            </button>
          </div>

          {/* 预览内容 */}
          <div className="h-[calc(100%-52px)] overflow-auto p-6 flex justify-center">
            <div
              style={{
                transform: `scale(${scale})`,
                transformOrigin: 'top center',
              }}
            >
              <ResumePreview />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
