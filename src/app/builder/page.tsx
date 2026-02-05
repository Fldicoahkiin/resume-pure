'use client';

import { useState } from 'react';
import { PersonalInfoEditor } from '@/components/editor/PersonalInfoEditor';
import { ExperienceEditor } from '@/components/editor/ExperienceEditor';
import { EducationEditor } from '@/components/editor/EducationEditor';
import { ProjectEditor } from '@/components/editor/ProjectEditor';
import { SkillEditor } from '@/components/editor/SkillEditor';
import { RawEditor } from '@/components/editor/RawEditor';
import { ResumePreview } from '@/components/preview/ResumePreview';
import { ExportButtons } from '@/components/export/ExportButtons';
import { FileText, Code, FormInput } from 'lucide-react';
import Link from 'next/link';

type EditorMode = 'form' | 'raw';

export default function BuilderPage() {
  const [scale, setScale] = useState(0.6);
  const [editorMode, setEditorMode] = useState<EditorMode>('form');

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
                <PersonalInfoEditor />
                <ExperienceEditor />
                <EducationEditor />
                <ProjectEditor />
                <SkillEditor />
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
