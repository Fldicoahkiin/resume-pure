'use client';

import { useResumeStore } from '@/store/resumeStore';
import { Skill } from '@/types';
import { Wrench, Plus, Trash2 } from 'lucide-react';

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
      </div>

      {resume.skills.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <Wrench className="h-12 w-12 mx-auto mb-3 text-gray-300" />
          <p className="text-sm">暂无技能信息</p>
          <p className="text-xs text-gray-400 mt-1">点击下方按钮添加你的技能专长</p>
        </div>
      ) : (
        resume.skills.map((skill, idx) => (
          <div key={skill.id}>
            {idx !== 0 && <div className="my-4 border-t-2 border-dotted border-gray-200" />}

            <div className="relative grid grid-cols-6 gap-3">
              <button
                onClick={() => deleteSkill(skill.id)}
                className="absolute right-0 top-0 p-1 text-gray-400 hover:text-red-500"
                title="删除此技能分类"
              >
                <Trash2 size={16} />
              </button>

            <label className="col-span-2 text-sm font-medium text-gray-700">
              类别
              <input
                type="text"
                value={skill.category}
                onChange={(e) => updateSkill(skill.id, { category: e.target.value })}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-base font-normal"
                placeholder="编程语言"
              />
            </label>

            <label className="col-span-4 text-sm font-medium text-gray-700">
              技能项
              <input
                type="text"
                value={skill.items.join(', ')}
                onChange={(e) => handleUpdateItems(skill.id, e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-base font-normal"
                placeholder="JavaScript, TypeScript, Python (用逗号分隔)"
              />
            </label>
          </div>
        </div>
      ))
      )}

      <div className="mt-4 flex justify-end">
        <button
          onClick={handleAdd}
          className="flex items-center gap-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50"
        >
          <Plus size={16} />
          添加技能
        </button>
      </div>
    </section>
  );
}
