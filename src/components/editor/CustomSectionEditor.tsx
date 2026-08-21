'use client';

import { useResumeStore } from '@/store/resumeStore';
import type { CustomSectionType, CustomSection } from '@/types';
import { useTranslation } from 'react-i18next';
import { ProjectEditor } from './ProjectEditor';
import { ExperienceEditor } from './ExperienceEditor';
import { EducationEditor } from './EducationEditor';
import { SkillEditor } from './SkillEditor';
import { CustomSectionItemsEditor } from './CustomSectionItemsEditor';
import { inferCustomSectionType } from '@/lib/resumeUtils';
import { confirmDialog } from '@/components/ConfirmDialog';

type CustomSectionEditorProps = {
  sectionId: string;
  embedded?: boolean;
};

export function CustomSectionEditor({ sectionId, embedded = false }: CustomSectionEditorProps) {
  const { t } = useTranslation();
  const { resume, hasHydrated, updateCustomSection } = useResumeStore();

  const customSection = resume.customSections.find((s) => s.id === sectionId);
  const type = customSection ? inferCustomSectionType(customSection) : 'custom';

  const typeSelect = (
    <div className="mb-5 flex flex-col gap-1.5 border-b border-gray-200 px-1 pb-4 text-sm text-gray-700 dark:border-gray-700 dark:text-gray-300 sm:flex-row sm:items-center sm:justify-between">
      <label htmlFor={`custom-section-template-${sectionId}`} className="font-medium">
        {t('editor.customSection.templateType')}
      </label>
      <select
        id={`custom-section-template-${sectionId}`}
        value={type}
        onChange={async (event) => {
          const selectElement = event.currentTarget;
          const nextType = event.target.value as CustomSectionType;
          if (nextType === type) return;

          if (customSection?.items.length && !await confirmDialog(t('editor.customSection.changeTemplateConfirm'))) {
            selectElement.value = type;
            return;
          }

          updateCustomSection(sectionId, { type: nextType, items: [] as CustomSection['items'] });
        }}
        className="form-select min-h-9 w-full cursor-pointer rounded-md border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-900 outline-none transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:focus:border-blue-400 dark:focus:ring-blue-500/20 sm:w-56"
      >
        <option value="project">{t('editor.projects.title')}</option>
        <option value="experience">{t('editor.experience.title')}</option>
        <option value="education">{t('editor.education.title')}</option>
        <option value="skill">{t('editor.skills.title')}</option>
        <option value="custom">{t('editor.customSection.title')}</option>
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
  if (type === 'custom') return <><div className="px-1">{typeSelect}</div><CustomSectionItemsEditor embedded sectionId={sectionId} /></>;

  return null;
}
