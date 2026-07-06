'use client';

import { ChangeEvent } from 'react';
import { Image as ImageIcon, Star, Trash2 } from 'lucide-react';
import { LogoBadge } from '@/components/LogoBadge';
import { Project } from '@/types';
import { getProjectLogo, ToggleButton, type TranslationFn } from './shared';

export function ProjectLogoPanel({
  project,
  logoError,
  t,
  onUpdate,
  onUploadLogo,
}: {
  project: Project;
  logoError?: string;
  t: TranslationFn;
  onUpdate: (patch: Partial<Project>) => void;
  onUploadLogo: (projectId: string, event: ChangeEvent<HTMLInputElement>) => Promise<void>;
}) {
  const logoSrc = getProjectLogo(project);

  return (
    <div className="space-y-3 rounded-2xl border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-800/60">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-gray-900 dark:text-white">{t('editor.projects.logoTitle')}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">{t('editor.projects.logoHint')}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <ToggleButton
            active={project.showLogo !== false}
            activeLabel={t('editor.projects.showLogo')}
            inactiveLabel={t('editor.projects.hideLogo')}
            onClick={() => onUpdate({ showLogo: project.showLogo === false })}
          />
          <ToggleButton
            active={project.showStars !== false}
            activeLabel={t('editor.projects.showStars')}
            inactiveLabel={t('editor.projects.hideStars')}
            onClick={() => onUpdate({ showStars: project.showStars === false })}
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-dashed border-gray-200 bg-gray-50 px-3 py-3 dark:border-gray-600 dark:bg-gray-700/40">
        <LogoBadge
          src={logoSrc}
          alt={project.name || t('editor.projects.logoTitle')}
          label={project.name || t('editor.projects.logoTitle')}
          size={52}
          variant="round"
        />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
            <span className="inline-flex items-center gap-1 rounded-full bg-white px-2 py-1 dark:bg-gray-800">
              <ImageIcon size={12} />
              {project.customLogo ? t('editor.projects.customLogo') : t('editor.projects.repoAvatar')}
            </span>
            {typeof project.repoStars === 'number' && (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-1 text-amber-700 dark:bg-amber-400/10 dark:text-amber-200">
                <Star size={12} />
                {project.repoStars}
              </span>
            )}
          </div>
          {logoError && (
            <p className="mt-2 text-xs text-red-500 dark:text-red-300">{logoError}</p>
          )}
        </div>
        <label className="inline-flex cursor-pointer items-center gap-1 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 transition hover:border-gray-300 hover:text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200">
          <ImageIcon size={12} />
          {t('editor.projects.uploadLogo')}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(event) => void onUploadLogo(project.id, event)}
          />
        </label>
        <button
          type="button"
          onClick={() => onUpdate({ customLogo: '' })}
          className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 transition hover:border-gray-300 hover:text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200"
        >
          <Trash2 size={12} />
          {t('editor.projects.clearCustomLogo')}
        </button>
      </div>
    </div>
  );
}
