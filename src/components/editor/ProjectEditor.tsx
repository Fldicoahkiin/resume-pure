'use client';

import { useResumeStore } from '@/store/resumeStore';
import { Project } from '@/types';
import { Lightbulb, Plus, Trash2 } from 'lucide-react';

interface ProjectEditorProps {
  embedded?: boolean;
}

export function ProjectEditor({ embedded = false }: ProjectEditorProps) {
  const { resume, hasHydrated, addProject, updateProject, deleteProject } = useResumeStore();

  if (!hasHydrated) {
    return (
      <div className={embedded ? "animate-pulse" : "rounded-lg bg-white dark:bg-gray-800 p-6 shadow animate-pulse"}>
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4"></div>
        <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
      </div>
    );
  }

  const handleAdd = () => {
    const newProj: Project = {
      id: Date.now().toString(),
      name: '',
      role: '',
      startDate: '',
      endDate: '',
      current: false,
      url: '',
      description: [''],
      technologies: [],
    };
    addProject(newProj);
  };

  const handleUpdateDescription = (id: string, index: number, value: string) => {
    const proj = resume.projects.find(p => p.id === id);
    if (proj) {
      const newDesc = [...proj.description];
      newDesc[index] = value;
      updateProject(id, { description: newDesc });
    }
  };

  const handleAddDescription = (id: string) => {
    const proj = resume.projects.find(p => p.id === id);
    if (proj) {
      updateProject(id, { description: [...proj.description, ''] });
    }
  };

  const handleRemoveDescription = (id: string, index: number) => {
    const proj = resume.projects.find(p => p.id === id);
    if (proj && proj.description.length > 1) {
      const newDesc = proj.description.filter((_, i) => i !== index);
      updateProject(id, { description: newDesc });
    }
  };

  const handleUpdateTechnologies = (id: string, value: string) => {
    const technologies = value.split(',').map(t => t.trim()).filter(Boolean);
    updateProject(id, { technologies });
  };

  const content = (
    <>
      {resume.projects.length === 0 ? (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <Lightbulb className="h-12 w-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
          <p className="text-sm">暂无项目经验</p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">点击下方按钮添加你的项目经历</p>
        </div>
      ) : (
        resume.projects.map((proj, idx) => (
          <div key={proj.id}>
            {idx !== 0 && <div className="my-4 border-t-2 border-dotted border-gray-200 dark:border-gray-600" />}

            <div className="relative grid grid-cols-6 gap-3">
              <button
                onClick={() => deleteProject(proj.id)}
                className="absolute right-0 top-0 p-1 text-gray-400 hover:text-red-500"
                title="删除此项目"
              >
                <Trash2 size={16} />
              </button>

            <label className="col-span-full text-sm font-medium text-gray-700 dark:text-gray-300">
              项目名称
              <input
                type="text"
                value={proj.name}
                onChange={(e) => updateProject(proj.id, { name: e.target.value })}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-base font-normal bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder=""
              />
            </label>

            <label className="col-span-4 text-sm font-medium text-gray-700 dark:text-gray-300">
              角色
              <input
                type="text"
                value={proj.role || ''}
                onChange={(e) => updateProject(proj.id, { role: e.target.value })}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-base font-normal bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder=""
              />
            </label>

            <label className="col-span-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              时间
              <input
                type="text"
                value={proj.current ? `${proj.startDate} - 至今` : `${proj.startDate}${proj.endDate ? ' - ' + proj.endDate : ''}`}
                onChange={(e) => {
                  const [start, end] = e.target.value.split(' - ');
                  updateProject(proj.id, {
                    startDate: start || '',
                    endDate: end === '至今' ? '' : (end || ''),
                    current: end === '至今'
                  });
                }}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-base font-normal bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder=""
              />
            </label>

            <label className="col-span-full text-sm font-medium text-gray-700 dark:text-gray-300">
              技术栈
              <input
                type="text"
                value={(proj.technologies || []).join(', ')}
                onChange={(e) => handleUpdateTechnologies(proj.id, e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-base font-normal bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder=""
              />
            </label>

            <div className="col-span-full text-sm font-medium text-gray-700 dark:text-gray-300">
              项目描述
              <div className="mt-1 space-y-2">
                {proj.description.map((desc, descIdx) => (
                  <div key={descIdx} className="flex gap-2">
                    <span className="mt-2.5 text-gray-400">•</span>
                    <input
                      type="text"
                      value={desc}
                      onChange={(e) => handleUpdateDescription(proj.id, descIdx, e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-base font-normal bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder=""
                    />
                    {proj.description.length > 1 && (
                      <button
                        onClick={() => handleRemoveDescription(proj.id, descIdx)}
                        className="p-2 text-gray-400 hover:text-red-500"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  onClick={() => handleAddDescription(proj.id)}
                  className="text-sm text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  + 添加描述
                </button>
              </div>
            </div>
          </div>
        </div>
      ))
      )}

      <div className="mt-4 flex justify-end">
        <button
          onClick={handleAdd}
          className="flex items-center gap-1 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm hover:bg-gray-50 dark:hover:bg-gray-600"
        >
          <Plus size={16} />
          添加项目
        </button>
      </div>
    </>
  );

  if (embedded) {
    return content;
  }

  return (
    <section className="rounded-lg bg-white dark:bg-gray-800 p-6 shadow">
      <div className="flex items-center gap-2 mb-4">
        <Lightbulb className="h-5 w-5 text-gray-600 dark:text-gray-400" />
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">项目经验</h2>
      </div>
      {content}
    </section>
  );
}
