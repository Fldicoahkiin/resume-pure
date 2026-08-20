'use client';

import type { ChangeEvent } from 'react';
import { Image as ImageIcon, RotateCcw, Star, Upload } from 'lucide-react';
import { LogoBadge } from '@/components/LogoBadge';
import { normalizeImageSource } from '@/lib/imageSource';
import { resolveProjectLogo } from '@/lib/projectLogo';
import type { Project } from '@/types';
import type { TranslationFn } from './shared';

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
  const sourceLabel = projectLogo?.source === 'custom'
    ? isEmbeddedLogo
      ? t('editor.projects.uploadedLogo')
      : t('editor.projects.externalLogo')
    : projectLogo?.source === 'repository'
      ? t('editor.projects.repoAvatar')
      : t('editor.projects.noLogo');

  return (
    <section className="space-y-3 border-t border-gray-100 pt-4 dark:border-gray-700">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-gray-900 dark:text-white">{t('editor.projects.logoTitle')}</p>
          <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{t('editor.projects.logoHint')}</p>
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-gray-600 dark:text-gray-300">
          <label className="inline-flex items-center gap-2">
            <input
              type="checkbox"
              checked={project.showLogo !== false}
              onChange={(event) => onUpdate({ showLogo: event.target.checked })}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700"
            />
            {t('editor.projects.showLogo')}
          </label>
          <label className="inline-flex items-center gap-2">
            <input
              type="checkbox"
              checked={project.showStars !== false}
              onChange={(event) => onUpdate({ showStars: event.target.checked })}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700"
            />
            {t('editor.projects.showStars')}
          </label>
        </div>
      </div>

      <div className="grid grid-cols-[52px_minmax(0,1fr)] items-start gap-3">
        <LogoBadge
          src={projectLogo?.src}
          alt={project.name || t('editor.projects.logoTitle')}
          label={project.name || t('editor.projects.logoTitle')}
          size={52}
          variant={projectLogo?.source === 'custom' ? 'square' : 'round'}
          fit={projectLogo?.source === 'custom' ? 'contain' : 'cover'}
          className={project.showLogo === false ? 'opacity-50' : undefined}
        />

        <div className="min-w-0 space-y-2.5">
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">
            {t('editor.projects.logoUrl')}
            <input
              type="url"
              value={logoUrl}
              onChange={(event) => onUpdate({ customLogo: event.target.value })}
              placeholder={t('editor.projects.logoUrlPlaceholder')}
              aria-invalid={hasInvalidLogoUrl}
              className={`mt-1 block w-full rounded-md border bg-white px-3 py-2 text-sm font-normal text-gray-900 shadow-sm outline-none transition focus:ring-2 dark:bg-gray-700 dark:text-white ${
                hasInvalidLogoUrl
                  ? 'border-red-300 focus:border-red-400 focus:ring-red-100 dark:border-red-500/70 dark:focus:ring-red-500/20'
                  : 'border-gray-300 focus:border-blue-400 focus:ring-blue-100 dark:border-gray-600 dark:focus:border-blue-500 dark:focus:ring-blue-500/20'
              }`}
            />
          </label>

          <p className={`text-xs ${hasInvalidLogoUrl ? 'text-red-500 dark:text-red-300' : 'text-gray-500 dark:text-gray-400'}`}>
            {hasInvalidLogoUrl ? t('editor.projects.logoUrlInvalid') : t('editor.projects.logoUrlHint')}
          </p>
          {logoError && (
            <p className="text-xs text-red-500 dark:text-red-300">{logoError}</p>
          )}

          <div className="flex flex-wrap items-center gap-2">
            <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-600 transition hover:border-gray-300 hover:text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200">
              <Upload size={13} />
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
              disabled={!customLogo}
              className="inline-flex items-center gap-1.5 rounded-md border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-600 transition hover:border-gray-300 hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-40 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200"
            >
              <RotateCcw size={13} />
              {t('editor.projects.clearCustomLogo')}
            </button>
          </div>

          <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500 dark:text-gray-400">
            <span className="inline-flex items-center gap-1">
              <ImageIcon size={12} />
              {t('editor.projects.logoSource')}: {sourceLabel}
            </span>
            {typeof project.repoStars === 'number' && (
              <span className="inline-flex items-center gap-1">
                <Star size={12} />
                {project.repoStars}
              </span>
            )}
          </p>
        </div>
      </div>
    </section>
  );
}
