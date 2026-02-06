'use client';

import { useResumeStore } from '@/store/resumeStore';
import { Skill } from '@/types';
import { Wrench, Plus, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface SkillEditorProps {
  embedded?: boolean;
}

export function SkillEditor({ embedded = false }: SkillEditorProps) {
  const { t } = useTranslation();
  const { resume, hasHydrated, addSkill, updateSkill, deleteSkill } = useResumeStore();

  if (!hasHydrated) {
    return (
      <div className={embedded ? "animate-pulse" : "rounded-lg bg-white dark:bg-gray-800 p-6 shadow animate-pulse"}>
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4"></div>
        <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
      </div>
    );
  }

  const handleAdd = () => {
    const newSkill: Skill = {
      id: Date.now().toString(),
      category: '',
      items: [],
    };
    addSkill(newSkill);
  };

  const handleUpdateItems = (id: string, value: string) => {
    const items = value.split(',').map(t => t.trim()).filter(Boolean);
    updateSkill(id, { items });
  };

  const content = (
    <>
      {resume.skills.length === 0 ? (
        <div className="text-center py-6 text-gray-400 dark:text-gray-500 text-sm">
          {t('editor.skills.noSkills')}
        </div>
      ) : (
        <div className="space-y-3">
          {resume.skills.map((skill) => (
            <div
              key={skill.id}
              className="group flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition"
            >
              <input
                type="text"
                value={skill.category}
                onChange={(e) => updateSkill(skill.id, { category: e.target.value })}
                className="w-28 shrink-0 px-2 py-1.5 text-sm font-medium bg-white dark:bg-gray-600 border border-gray-200 dark:border-gray-500 rounded focus:border-gray-400 dark:focus:border-gray-400 focus:outline-none text-gray-900 dark:text-white"
                placeholder={t('editor.skills.category')}
              />
              <input
                type="text"
                value={skill.items.join(', ')}
                onChange={(e) => handleUpdateItems(skill.id, e.target.value)}
                className="flex-1 px-2 py-1.5 text-sm bg-white dark:bg-gray-600 border border-gray-200 dark:border-gray-500 rounded focus:border-gray-400 dark:focus:border-gray-400 focus:outline-none text-gray-900 dark:text-white"
                placeholder={t('editor.skills.itemsPlaceholder')}
              />
              <button
                onClick={() => deleteSkill(skill.id)}
                className="p-1.5 text-gray-300 dark:text-gray-500 hover:text-red-500 opacity-0 group-hover:opacity-100 transition"
              >
                <X size={16} />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="mt-4 flex justify-end">
        <button
          onClick={handleAdd}
          className="flex items-center gap-1 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm hover:bg-gray-50 dark:hover:bg-gray-600"
        >
          <Plus size={16} />
          {t('editor.skills.addSkill')}
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
        <Wrench className="h-5 w-5 text-gray-600 dark:text-gray-400" />
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{t('editor.skills.title')}</h2>
      </div>
      {content}
    </section>
  );
}
