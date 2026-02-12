'use client';

import { useResumeStore } from '@/store/resumeStore';
import { Project } from '@/types';
import { Lightbulb, Plus, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface ProjectEditorProps {
  embedded?: boolean;
}

export function ProjectEditor({ embedded = false }: ProjectEditorProps) {
  const { t } = useTranslation();
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
          <p className="text-sm">{t('editor.projects.noProjects')}</p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{t('editor.projects.addHint')}</p>
        </div>
      ) : (
        resume.projects.map((proj, idx) => (
          <div key={proj.id}>
            {idx !== 0 && <div className="my-4 border-t-2 border-dotted border-gray-200 dark:border-gray-600" />}

            <div className="relative grid grid-cols-6 gap-3">
              <button
                onClick={() => deleteProject(proj.id)}
                className="absolute right-0 top-0 p-1 text-gray-400 hover:text-red-500"
                title={t('editor.projects.deleteTitle')}
              >
                <Trash2 size={16} />
              </button>

            <label className="col-span-full text-sm font-medium text-gray-700 dark:text-gray-300">
              {t('editor.projects.name')}
              <input
                type="text"
                value={proj.name}
                onChange={(e) => updateProject(proj.id, { name: e.target.value })}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-base font-normal bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder=""
              />
            </label>

            <label className="col-span-4 text-sm font-medium text-gray-700 dark:text-gray-300">
              {t('editor.projects.role')}
              <input
                type="text"
                value={proj.role || ''}
                onChange={(e) => updateProject(proj.id, { role: e.target.value })}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-base font-normal bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder=""
              />
            </label>

            <label className="col-span-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              {t('editor.projects.date')}
              <input
                type="text"
                value={proj.current
                  ? (proj.startDate ? `${proj.startDate} - ${t('preview.present')}` : t('preview.present'))
                  : (proj.startDate || proj.endDate ? `${proj.startDate}${proj.startDate && proj.endDate ? ' - ' : ''}${proj.endDate}` : '')
                }
                onChange={(e) => {
                  const val = e.target.value;
                  const presentText = t('preview.present');
                  const isPresent = val.includes(presentText) || val.toLowerCase().includes('present');

                  if (isPresent) {
                    const start = val.replace(presentText, '').replace(/-/g, '').trim();
                    updateProject(proj.id, {
                      startDate: start,
                      endDate: '',
                      current: true
                    });
                  } else {
                    const parts = val.split(' - ');
                    updateProject(proj.id, {
                      startDate: parts[0] || '',
                      endDate: parts[1] || '',
                      current: false
                    });
                  }
                }}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-base font-normal bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder=""
              />
            </label>

            <label className="col-span-full text-sm font-medium text-gray-700 dark:text-gray-300">
              {t('editor.projects.technologies')}
              <input
                type="text"
                value={(proj.technologies || []).join(', ')}
                onChange={(e) => handleUpdateTechnologies(proj.id, e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-base font-normal bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder=""
              />
            </label>

            <div className="col-span-full text-sm font-medium text-gray-700 dark:text-gray-300">
              {t('editor.projects.description')}
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
                  {t('editor.projects.addDescription')}
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
          {t('editor.projects.addProject')}
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
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{t('editor.projects.title')}</h2>
      </div>
      {content}
    </section>
  );
}
