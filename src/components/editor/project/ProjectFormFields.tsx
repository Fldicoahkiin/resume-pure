'use client';

import { RefreshCw, Search } from 'lucide-react';
import { siGithub } from 'simple-icons';
import { BrandIcon } from '@/components/BrandIcon';
import type { Project } from '@/types';
import { getDateValue, parseDateValue, RepoStatusText, type RepoStatus, type TranslationFn } from './shared';

const FIELD_CLASS_NAME = 'mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-normal text-gray-900 shadow-sm outline-none transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:focus:border-blue-400 dark:focus:ring-blue-500/20';

export function ProjectFormFields({
  project,
  repoStatus,
  t,
  onUpdate,
  onSyncRepo,
  onFetchPullRequests,
  fetchStatus,
}: {
  project: Project;
  repoStatus?: RepoStatus;
  t: TranslationFn;
  onUpdate: (patch: Partial<Project>) => void;
  onSyncRepo: (project: Project, force?: boolean) => Promise<void>;
  onFetchPullRequests?: (project: Project) => Promise<void>;
  fetchStatus?: { loading: boolean };
}) {
  return (
    <div className="space-y-4">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        {t('editor.projects.name')}
        <input
          type="text"
          value={project.name}
          onChange={(event) => onUpdate({ name: event.target.value })}
          className={FIELD_CLASS_NAME}
        />
      </label>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {t('editor.projects.role')}
          <input
            type="text"
            value={project.role || ''}
            onChange={(event) => onUpdate({ role: event.target.value })}
            className={FIELD_CLASS_NAME}
          />
        </label>

        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {t('editor.projects.date')}
          <input
            type="text"
            value={getDateValue(project, t('preview.present'))}
            onChange={(event) => onUpdate(parseDateValue(event.target.value, t('preview.present')))}
            className={FIELD_CLASS_NAME}
          />
        </label>
      </div>

      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        {t('editor.projects.url')}
        <input
          type="text"
          value={project.url || ''}
          onChange={(event) => onUpdate({ url: event.target.value })}
          className={FIELD_CLASS_NAME}
          placeholder={t('editor.projects.urlPlaceholder')}
        />
      </label>

      <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
        <label className="block">
          {t('editor.projects.repoUrl')}
          <input
            type="text"
            value={project.repoUrl || ''}
            onChange={(event) => onUpdate({ repoUrl: event.target.value })}
            onBlur={(event) => void onSyncRepo({ ...project, repoUrl: event.target.value })}
            className={FIELD_CLASS_NAME}
            placeholder={t('editor.projects.repoPlaceholder')}
          />
        </label>

        <div className="mt-2 flex flex-wrap items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => void onFetchPullRequests?.(project)}
            disabled={fetchStatus?.loading || !project.repoUrl}
            title={t('editor.projects.importPrTitle')}
            className="inline-flex h-9 items-center gap-1.5 whitespace-nowrap rounded-md border border-gray-300 bg-white px-3 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 dark:focus-visible:ring-offset-gray-800"
          >
            {fetchStatus?.loading ? <RefreshCw size={14} className="animate-spin" /> : <Search size={14} />}
            {t('editor.projects.importPr')}
          </button>
          <button
            type="button"
            onClick={() => void onSyncRepo(project, true)}
            disabled={repoStatus?.state === 'loading'}
            className="inline-flex h-9 items-center gap-1.5 whitespace-nowrap rounded-md border border-gray-300 bg-white px-3 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 dark:focus-visible:ring-offset-gray-800"
          >
            <RefreshCw size={14} className={repoStatus?.state === 'loading' ? 'animate-spin' : ''} />
            {t('editor.projects.syncRepo')}
          </button>
        </div>

        {repoStatus?.message && (
          <div className="mt-2 flex min-h-5 items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
            <BrandIcon path={siGithub.path} size={12} />
            <RepoStatusText status={repoStatus} />
          </div>
        )}
      </div>
    </div>
  );
}
