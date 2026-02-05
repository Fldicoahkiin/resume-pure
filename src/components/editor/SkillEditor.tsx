'use client';

import { useResumeStore } from '@/store/resumeStore';
import { Skill } from '@/types';
import { Wrench, Plus, X } from 'lucide-react';

export function SkillEditor() {
  const { resume, hasHydrated, addSkill, updateSkill, deleteSkill, updateSectionConfig } = useResumeStore();

  if (!hasHydrated) {
    return (
      <div className="rounded-lg bg-white p-6 shadow animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
        <div className="h-32 bg-gray-200 rounded"></div>
      </div>
    );
  }

  const section = resume.sections.find(s => s.id === 'skills');
  const sectionTitle = section?.title || '技能专长';

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

  return (
    <section className="rounded-lg bg-white p-6 shadow">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Wrench className="h-5 w-5 text-gray-600" />
          <input
            type="text"
            value={sectionTitle}
            onChange={(e) => updateSectionConfig('skills', { title: e.target.value })}
            className="text-lg font-semibold text-gray-900 bg-transparent border-none outline-none focus:ring-2 focus:ring-blue-500 rounded px-1 -ml-1"
          />
        </div>
        <button
          onClick={handleAdd}
          className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition"
        >
          <Plus size={16} />
          添加
        </button>
      </div>

      {resume.skills.length === 0 ? (
        <div className="text-center py-6 text-gray-400 text-sm">
          点击右上角添加技能
        </div>
      ) : (
        <div className="space-y-3">
          {resume.skills.map((skill) => (
            <div
              key={skill.id}
              className="group flex items-start gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
            >
              <input
                type="text"
                value={skill.category}
                onChange={(e) => updateSkill(skill.id, { category: e.target.value })}
                className="w-28 shrink-0 px-2 py-1.5 text-sm font-medium bg-white border border-gray-200 rounded focus:border-gray-400 focus:outline-none"
                placeholder="类别"
              />
              <input
                type="text"
                value={skill.items.join(', ')}
                onChange={(e) => handleUpdateItems(skill.id, e.target.value)}
                className="flex-1 px-2 py-1.5 text-sm bg-white border border-gray-200 rounded focus:border-gray-400 focus:outline-none"
                placeholder="技能项，用逗号分隔"
              />
              <button
                onClick={() => deleteSkill(skill.id)}
                className="p-1.5 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition"
              >
                <X size={16} />
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
