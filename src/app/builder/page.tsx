'use client';

import { PersonalInfoEditor } from '@/components/editor/PersonalInfoEditor';
import { ExperienceEditor } from '@/components/editor/ExperienceEditor';
import { EducationEditor } from '@/components/editor/EducationEditor';
import { ProjectEditor } from '@/components/editor/ProjectEditor';
import { SkillEditor } from '@/components/editor/SkillEditor';
import { ResumePreview } from '@/components/preview/ResumePreview';
import { ExportButtons } from '@/components/export/ExportButtons';
import { ImportButton } from '@/components/export/ImportButton';
import { Home } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

export default function BuilderPage() {
  const [scale, setScale] = useState(0.6);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-20">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 hover:text-blue-500">
              <Home size={20} />
              <span className="font-semibold">Resume Pure</span>
            </Link>
            <div className="flex items-center gap-3">
              <ImportButton />
              <ExportButtons />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content - 左右分栏 */}
      <div className="grid grid-cols-1 lg:grid-cols-2">
        {/* 左侧编辑区 - 所有表单垂直排列 */}
        <div className="h-[calc(100vh-57px)] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
          <div className="flex flex-col gap-6 p-6 max-w-2xl mx-auto lg:mr-0">
            <PersonalInfoEditor />
            <ExperienceEditor />
            <EducationEditor />
            <ProjectEditor />
            <SkillEditor />
            <div className="h-8" />
          </div>
        </div>

        {/* 右侧预览区 */}
        <div className="hidden lg:block bg-gray-100 h-[calc(100vh-57px)] relative">
          {/* 缩放控制条 */}
          <div className="absolute bottom-0 left-0 right-0 flex items-center justify-center gap-4 py-3 bg-gray-200 border-t z-10">
            <button
              onClick={() => setScale(s => Math.max(0.3, s - 0.1))}
              className="px-3 py-1 bg-white rounded border hover:bg-gray-50"
            >
              -
            </button>
            <span className="text-sm font-medium w-16 text-center">
              {Math.round(scale * 100)}%
            </span>
            <button
              onClick={() => setScale(s => Math.min(1, s + 0.1))}
              className="px-3 py-1 bg-white rounded border hover:bg-gray-50"
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
