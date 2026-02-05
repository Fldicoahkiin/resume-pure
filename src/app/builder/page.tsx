'use client';

import { useState } from 'react';
import { PersonalInfoEditor } from '@/components/editor/PersonalInfoEditor';
import { ExperienceEditor } from '@/components/editor/ExperienceEditor';
import { EducationEditor } from '@/components/editor/EducationEditor';
import { ProjectEditor } from '@/components/editor/ProjectEditor';
import { SkillEditor } from '@/components/editor/SkillEditor';
import { ThemeEditor } from '@/components/editor/ThemeEditor';
import { DraggableSection } from '@/components/editor/DraggableSection';
import { RawEditor } from '@/components/editor/RawEditor';
import { ResumePreview } from '@/components/preview/ResumePreview';
import { ExportButtons } from '@/components/export/ExportButtons';
import { FileText, Code, FormInput, Briefcase, GraduationCap, FolderKanban, Wrench } from 'lucide-react';
import Link from 'next/link';
import { useResumeStore } from '@/store/resumeStore';

type EditorMode = 'form' | 'raw';

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
  const [scale, setScale] = useState(0.6);
  const [editorMode, setEditorMode] = useState<EditorMode>('form');
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());

  const { resume, hasHydrated, reorderSections, updateSectionConfig } = useResumeStore();

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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-20">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 text-gray-900 hover:text-gray-600 transition">
              <FileText size={20} />
              <span className="font-semibold">Resume Pure</span>
            </Link>
            <ExportButtons />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2">
        {/* 左侧编辑区 */}
        <div className="h-[calc(100vh-57px)] overflow-hidden flex flex-col">
          {/* 编辑模式切换 */}
          <div className="flex items-center gap-1 px-6 py-2 border-b bg-white">
            <button
              onClick={() => setEditorMode('form')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded transition ${
                editorMode === 'form'
                  ? 'bg-gray-900 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <FormInput size={14} />
              表单
            </button>
            <button
              onClick={() => setEditorMode('raw')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded transition ${
                editorMode === 'raw'
                  ? 'bg-gray-900 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Code size={14} />
              Raw
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
                    icon={sectionIcons[section.id]}
                    isCollapsed={collapsedSections.has(section.id)}
                    onToggleCollapse={() => toggleCollapse(section.id)}
                    onToggleVisible={() => toggleVisible(section.id)}
                    onDragStart={() => handleDragStart(idx)}
                    onDragOver={(e) => handleDragOver(e, idx)}
                    onDragEnd={handleDragEnd}
                    isDragging={draggedIdx === idx}
                  >
                    {sectionEditors[section.id]}
                  </DraggableSection>
                ))}

                {/* 主题设置 - 固定在底部 */}
                <ThemeEditor />
                <div className="h-8" />
              </div>
            </div>
          ) : (
            <RawEditor />
          )}
        </div>

        {/* 右侧预览区 */}
        <div className="hidden lg:block bg-gray-100 h-[calc(100vh-57px)] relative">
          {/* 缩放控制 */}
          <div className="absolute bottom-0 left-0 right-0 flex items-center justify-center gap-4 py-3 bg-gray-200 border-t z-10">
            <button
              onClick={() => setScale(s => Math.max(0.3, s - 0.1))}
              className="px-3 py-1 bg-white rounded border hover:bg-gray-50 text-sm"
            >
              −
            </button>
            <span className="text-sm font-medium w-12 text-center text-gray-600">
              {Math.round(scale * 100)}%
            </span>
            <button
              onClick={() => setScale(s => Math.min(1, s + 0.1))}
              className="px-3 py-1 bg-white rounded border hover:bg-gray-50 text-sm"
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
