'use client';

import { useResumeStore } from '@/store/resumeStore';
import { CustomSectionType } from '@/types';
import { useTranslation } from 'react-i18next';
import { ProjectEditor } from './ProjectEditor';
import { ExperienceEditor } from './ExperienceEditor';
import { EducationEditor } from './EducationEditor';
import { SkillEditor } from './SkillEditor';

interface CustomSectionEditorProps {
  sectionId: string;
  embedded?: boolean;
}

export function CustomSectionEditor({ sectionId, embedded = false }: CustomSectionEditorProps) {
  const { t } = useTranslation();
  const { resume, hasHydrated, updateCustomSection } = useResumeStore();

  const customSection = resume.customSections.find((s) => s.id === sectionId);
  const type = customSection?.type && customSection.type !== 'custom' ? customSection.type : 'project';

  const typeSelect = (
    <div className="mb-4 flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
      <label>{t('editor.customSection.templateType', '模块模板')}:</label>
      <select
        value={type}
        onChange={(e) => {
          updateCustomSection(sectionId, { type: e.target.value as CustomSectionType, items: [] as any[] });
        }}
        className="form-select px-3 py-1 text-sm rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white cursor-pointer"
      >
        <option value="project">{t('editor.projects.title')}</option>
        <option value="experience">{t('editor.experience.title')}</option>
        <option value="education">{t('editor.education.title')}</option>
        <option value="skill">{t('editor.skills.title')}</option>
      </select>
    </div>
  );

  if (!hasHydrated) {
    return (
      <div className={embedded ? 'animate-pulse' : 'rounded-lg bg-white dark:bg-gray-800 p-6 shadow animate-pulse'}>
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4"></div>
        <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
      </div>
    );
  }

  // 严格代理渲染对应类型的表单
  if (type === 'project') return <><div className="px-1">{typeSelect}</div><ProjectEditor embedded sectionId={sectionId} /></>;
  if (type === 'experience') return <><div className="px-1">{typeSelect}</div><ExperienceEditor embedded sectionId={sectionId} /></>;
  if (type === 'education') return <><div className="px-1">{typeSelect}</div><EducationEditor embedded sectionId={sectionId} /></>;
  if (type === 'skill') return <><div className="px-1">{typeSelect}</div><SkillEditor embedded sectionId={sectionId} /></>;

  return null;
}
