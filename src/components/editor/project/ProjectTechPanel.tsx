'use client';

import { useState, type KeyboardEvent } from 'react';
import { X } from 'lucide-react';
import { resolveSkillLogo } from '@/lib/skillLogo';
import type { Project } from '@/types';
import { ProjectOption, type TranslationFn } from './shared';

export function ProjectTechPanel({
  project,
  t,
  onUpdate,
}: {
  project: Project;
  t: TranslationFn;
  onUpdate: (patch: Partial<Project>) => void;
}) {
  const [inputValue, setInputValue] = useState('');
  const technologies = project.technologies || [];

  const addTech = (raw: string) => {
    const value = raw.trim();
    if (!value || technologies.includes(value)) return;
    onUpdate({ technologies: [...technologies, value] });
  };

  const removeTech = (index: number) => {
    onUpdate({ technologies: technologies.filter((_, i) => i !== index) });
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' || event.key === 'Tab') {
      if (inputValue.trim()) {
        event.preventDefault();
        addTech(inputValue);
        setInputValue('');
      }
    }
    if (event.key === 'Backspace' && inputValue === '' && technologies.length > 0) {
      removeTech(technologies.length - 1);
    }
  };

  return (
    <section className="space-y-3 border-t border-gray-200 pt-5 dark:border-gray-700">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-gray-900 dark:text-white">{t('editor.projects.techTitle')}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">{t('editor.projects.techHint')}</p>
        </div>
        <ProjectOption
          checked={project.showTechnologies !== false}
          label={t('editor.projects.showTechnologies')}
          onChange={(checked) => onUpdate({ showTechnologies: checked })}
        />
      </div>
      <div className="flex min-h-10 flex-wrap items-center gap-1.5 rounded-md border border-gray-300 bg-white px-2 py-1.5 shadow-sm focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 dark:border-gray-600 dark:bg-gray-700 dark:focus-within:border-blue-400 dark:focus-within:ring-blue-500/20">
        {technologies.map((tech, index) => {
          const logo = resolveSkillLogo(tech);
          return (
            <span
              key={tech}
              className="inline-flex items-center gap-1.5 rounded-md bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700 dark:bg-gray-600 dark:text-gray-200"
            >
              {logo && (
                <svg viewBox="0 0 24 24" fill={logo.color} xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 shrink-0">
                  <path d={logo.svgPath} />
                </svg>
              )}
              {tech}
              <button
                type="button"
                onClick={() => removeTech(index)}
                aria-label={t('editor.projects.removeTechnology', { technology: tech })}
                title={t('editor.projects.removeTechnology', { technology: tech })}
                className="ml-0.5 rounded-sm text-gray-400 transition-colors hover:text-red-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              >
                <X size={12} />
              </button>
            </span>
          );
        })}
        <input
          type="text"
          value={inputValue}
          onChange={(event) => setInputValue(event.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => {
            if (inputValue.trim()) {
              addTech(inputValue);
              setInputValue('');
            }
          }}
          aria-label={t('editor.projects.technologies')}
          className="min-w-[120px] flex-1 bg-transparent px-1 py-1 text-sm text-gray-900 outline-none placeholder:text-gray-400 dark:text-white"
          placeholder={technologies.length === 0 ? t('editor.projects.technologiesPlaceholder') : ''}
        />
      </div>
    </section>
  );
}
