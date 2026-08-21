'use client';

import type { ChangeEvent } from 'react';
import { RotateCcw, Upload } from 'lucide-react';
import { LogoBadge } from '@/components/LogoBadge';
import { normalizeImageSource } from '@/lib/imageSource';
import { resolveProjectLogo } from '@/lib/projectLogo';
import type { Project } from '@/types';
import { ProjectOption, type TranslationFn } from './shared';

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
  const projectLogo = resolveProjectLogo(project);
  const customLogo = project.customLogo?.trim() || '';
  const normalizedCustomLogo = normalizeImageSource(customLogo);
  const isEmbeddedLogo = normalizedCustomLogo?.toLowerCase().startsWith('data:image/') === true;
  const logoUrl = isEmbeddedLogo ? '' : customLogo;
  const hasInvalidLogoUrl = Boolean(logoUrl && !normalizedCustomLogo);
  const hintId = `project-logo-hint-${project.id}`;
  const sourceLabel = projectLogo?.source === 'custom'
    ? isEmbeddedLogo
      ? t('editor.projects.uploadedLogo')
      : t('editor.projects.externalLogo')
    : projectLogo?.source === 'repository'
      ? t('editor.projects.repoAvatar')
      : t('editor.projects.noLogo');

  return (
    <section className="space-y-3 border-t border-gray-200 pt-5 dark:border-gray-700">
      <div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-gray-900 dark:text-white">{t('editor.projects.logoTitle')}</p>
          <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{t('editor.projects.logoHint')}</p>
        </div>
        <div className="-ml-2 mt-2 flex flex-wrap items-center gap-1">
          <ProjectOption
            checked={project.showLogo !== false}
            label={t('editor.projects.showLogo')}
            onChange={(checked) => onUpdate({ showLogo: checked })}
          />
          <ProjectOption
            checked={project.showStars !== false}
            label={t('editor.projects.showStars')}
            onChange={(checked) => onUpdate({ showStars: checked })}
          />
        </div>
      </div>

      <div className="grid grid-cols-[64px_minmax(0,1fr)] items-start gap-3">
        <div className="flex flex-col items-center gap-1.5">
          <LogoBadge
            src={projectLogo?.src}
            alt={project.name || t('editor.projects.logoTitle')}
            label={project.name || t('editor.projects.logoTitle')}
            size={48}
            variant={projectLogo?.source === 'custom' ? 'square' : 'round'}
            fit={projectLogo?.source === 'custom' ? 'contain' : 'cover'}
            className={project.showLogo === false ? 'opacity-50' : undefined}
          />
          <span className="max-w-16 text-center text-[11px] leading-tight text-gray-500 dark:text-gray-400">
            {sourceLabel}
          </span>
        </div>

        <div className="min-w-0 space-y-2">
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">
            {t('editor.projects.logoUrl')}
            <input
              type="url"
              value={logoUrl}
              onChange={(event) => onUpdate({ customLogo: event.target.value })}
              placeholder={t('editor.projects.logoUrlPlaceholder')}
              aria-invalid={hasInvalidLogoUrl}
              aria-describedby={hintId}
              className={`mt-1 block w-full rounded-md border bg-white px-3 py-2 text-sm font-normal text-gray-900 shadow-sm outline-none transition focus:ring-2 dark:bg-gray-700 dark:text-white ${
                hasInvalidLogoUrl
                  ? 'border-red-300 focus:border-red-400 focus:ring-red-100 dark:border-red-500/70 dark:focus:ring-red-500/20'
                  : 'border-gray-300 focus:border-blue-400 focus:ring-blue-100 dark:border-gray-600 dark:focus:border-blue-500 dark:focus:ring-blue-500/20'
              }`}
            />
          </label>

          <p id={hintId} className={`text-xs leading-5 ${hasInvalidLogoUrl ? 'text-red-500 dark:text-red-300' : 'text-gray-500 dark:text-gray-400'}`}>
            {hasInvalidLogoUrl ? t('editor.projects.logoUrlInvalid') : t('editor.projects.logoUrlHint')}
          </p>
          {logoError && (
            <p role="alert" className="text-xs text-red-500 dark:text-red-300">{logoError}</p>
          )}

          <div className="flex flex-wrap items-center gap-2">
            <label className="inline-flex h-9 cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-md border border-gray-300 bg-white px-3 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50 focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-offset-2 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 dark:focus-within:ring-offset-gray-800">
              <Upload size={14} />
              {t('editor.projects.uploadLogo')}
              <input
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={(event) => void onUploadLogo(project.id, event)}
              />
            </label>
            {customLogo && (
              <button
                type="button"
                onClick={() => onUpdate({ customLogo: '' })}
                className="inline-flex h-9 items-center gap-1.5 whitespace-nowrap rounded-md border border-gray-300 bg-white px-3 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 dark:focus-visible:ring-offset-gray-800"
              >
                <RotateCcw size={14} />
                {t('editor.projects.clearCustomLogo')}
              </button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
