'use client';

import { useResumeStore } from '@/store/resumeStore';
import { Education } from '@/types';
import { GraduationCap, Plus, Trash2 } from 'lucide-react';

interface EducationEditorProps {
  embedded?: boolean;
}

export function EducationEditor({ embedded = false }: EducationEditorProps) {
  const { resume, hasHydrated, addEducation, updateEducation, deleteEducation } = useResumeStore();

  if (!hasHydrated) {
    return (
      <div className={embedded ? "animate-pulse" : "rounded-lg bg-white p-6 shadow animate-pulse"}>
        <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
        <div className="h-32 bg-gray-200 rounded"></div>
      </div>
    );
  }

  const handleAdd = () => {
    const newEdu: Education = {
      id: Date.now().toString(),
      school: '',
      degree: '',
      major: '',
      location: '',
      startDate: '',
      endDate: '',
      gpa: '',
      description: [],
    };
    addEducation(newEdu);
  };

  const content = (
    <>
      {resume.education.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <GraduationCap className="h-12 w-12 mx-auto mb-3 text-gray-300" />
          <p className="text-sm">暂无教育背景</p>
          <p className="text-xs text-gray-400 mt-1">点击下方按钮添加你的教育经历</p>
        </div>
      ) : (
        resume.education.map((edu, idx) => (
          <div key={edu.id}>
            {idx !== 0 && <div className="my-4 border-t-2 border-dotted border-gray-200" />}

            <div className="relative grid grid-cols-6 gap-3">
              <button
                onClick={() => deleteEducation(edu.id)}
                className="absolute right-0 top-0 p-1 text-gray-400 hover:text-red-500"
                title="删除此教育经历"
              >
                <Trash2 size={16} />
              </button>

            <label className="col-span-full text-sm font-medium text-gray-700">
              学校
              <input
                type="text"
                value={edu.school}
                onChange={(e) => updateEducation(edu.id, { school: e.target.value })}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-base font-normal"
                placeholder=""
              />
            </label>

            <label className="col-span-4 text-sm font-medium text-gray-700">
              学位 / 专业
              <input
                type="text"
                value={`${edu.degree}${edu.major ? ' - ' + edu.major : ''}`}
                onChange={(e) => {
                  const [degree, major] = e.target.value.split(' - ');
                  updateEducation(edu.id, { degree: degree || '', major: major || '' });
                }}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-base font-normal"
                placeholder=""
              />
            </label>

            <label className="col-span-2 text-sm font-medium text-gray-700">
              时间
              <input
                type="text"
                value={`${edu.startDate}${edu.endDate ? ' - ' + edu.endDate : ''}`}
                onChange={(e) => {
                  const [start, end] = e.target.value.split(' - ');
                  updateEducation(edu.id, { startDate: start || '', endDate: end || '' });
                }}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-base font-normal"
                placeholder=""
              />
            </label>

            <label className="col-span-2 text-sm font-medium text-gray-700">
              GPA
              <input
                type="text"
                value={edu.gpa || ''}
                onChange={(e) => updateEducation(edu.id, { gpa: e.target.value })}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-base font-normal"
                placeholder=""
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
          添加教育
        </button>
      </div>
    </>
  );

  if (embedded) {
    return content;
  }

  return (
    <section className="rounded-lg bg-white p-6 shadow">
      <div className="flex items-center gap-2 mb-4">
        <GraduationCap className="h-5 w-5 text-gray-600" />
        <h2 className="text-lg font-semibold text-gray-900">教育背景</h2>
      </div>
      {content}
    </section>
  );
}
