'use client';

import { useResumeStore } from '@/store/resumeStore';
import { Education } from '@/types';
import { GraduationCap, Plus, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface EducationEditorProps {
  embedded?: boolean;
}

export function EducationEditor({ embedded = false }: EducationEditorProps) {
  const { t } = useTranslation();
  const { resume, hasHydrated, addEducation, updateEducation, deleteEducation } = useResumeStore();

  if (!hasHydrated) {
    return (
      <div className={embedded ? "animate-pulse" : "rounded-lg bg-white dark:bg-gray-800 p-6 shadow animate-pulse"}>
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4"></div>
        <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
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
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <GraduationCap className="h-12 w-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
          <p className="text-sm">{t('editor.education.noEducation')}</p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{t('editor.education.addHint')}</p>
        </div>
      ) : (
        resume.education.map((edu, idx) => (
          <div key={edu.id}>
            {idx !== 0 && <div className="my-4 border-t-2 border-dotted border-gray-200 dark:border-gray-600" />}

            <div className="relative grid grid-cols-6 gap-3">
              <button
                onClick={() => deleteEducation(edu.id)}
                className="absolute right-0 top-0 p-1 text-gray-400 hover:text-red-500"
                title={t('editor.education.deleteTitle')}
              >
                <Trash2 size={16} />
              </button>

            <label className="col-span-full text-sm font-medium text-gray-700 dark:text-gray-300">
              {t('editor.education.school')}
              <input
                type="text"
                value={edu.school}
                onChange={(e) => updateEducation(edu.id, { school: e.target.value })}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-base font-normal bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder=""
              />
            </label>

            <label className="col-span-4 text-sm font-medium text-gray-700 dark:text-gray-300">
              {t('editor.education.degree')}
              <input
                type="text"
                value={`${edu.degree}${edu.major ? ' - ' + edu.major : ''}`}
                onChange={(e) => {
                  const [degree, major] = e.target.value.split(' - ');
                  updateEducation(edu.id, { degree: degree || '', major: major || '' });
                }}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-base font-normal bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder=""
              />
            </label>

            <label className="col-span-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              {t('editor.education.date')}
              <input
                type="text"
                value={`${edu.startDate}${edu.endDate ? ' - ' + edu.endDate : ''}`}
                onChange={(e) => {
                  const [start, end] = e.target.value.split(' - ');
                  updateEducation(edu.id, { startDate: start || '', endDate: end || '' });
                }}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-base font-normal bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder=""
              />
            </label>

            <label className="col-span-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              {t('editor.education.gpa')}
              <input
                type="text"
                value={edu.gpa || ''}
                onChange={(e) => updateEducation(edu.id, { gpa: e.target.value })}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-base font-normal bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
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
          className="flex items-center gap-1 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm hover:bg-gray-50 dark:hover:bg-gray-600"
        >
          <Plus size={16} />
          {t('editor.education.addEducation')}
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
        <GraduationCap className="h-5 w-5 text-gray-600 dark:text-gray-400" />
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{t('editor.education.title')}</h2>
      </div>
      {content}
    </section>
  );
}
