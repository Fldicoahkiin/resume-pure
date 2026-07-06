'use client';

import { Github, RefreshCw, Search } from 'lucide-react';
import { Project } from '@/types';
import { getDateValue, parseDateValue, RepoStatusText, type RepoStatus, type TranslationFn } from './shared';

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
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
      <label className="text-sm font-medium text-gray-700 dark:text-gray-300 md:col-span-2">
        {t('editor.projects.name')}
        <input
          type="text"
          value={project.name}
          onChange={(event) => onUpdate({ name: event.target.value })}
          className="mt-1 block w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-base font-normal text-gray-900 shadow-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
        />
      </label>

      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
        {t('editor.projects.role')}
        <input
          type="text"
          value={project.role || ''}
          onChange={(event) => onUpdate({ role: event.target.value })}
          className="mt-1 block w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-base font-normal text-gray-900 shadow-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
        />
      </label>

      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
        {t('editor.projects.date')}
        <input
          type="text"
          value={getDateValue(project, t('preview.present'))}
          onChange={(event) => onUpdate(parseDateValue(event.target.value, t('preview.present')))}
          className="mt-1 block w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-base font-normal text-gray-900 shadow-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
        />
      </label>

      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
        {t('editor.projects.url')}
        <input
          type="text"
          value={project.url || ''}
          onChange={(event) => onUpdate({ url: event.target.value })}
          className="mt-1 block w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-base font-normal text-gray-900 shadow-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          placeholder={t('editor.projects.urlPlaceholder')}
        />
      </label>

      <div className="text-sm font-medium text-gray-700 dark:text-gray-300 md:col-span-1">
        <div className="flex items-center justify-between gap-2">
          <span>{t('editor.projects.repoUrl')}</span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => void onFetchPullRequests?.(project)}
              disabled={fetchStatus?.loading || !project.repoUrl}
              title={t('editor.projects.importPrTitle')}
              className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-medium text-gray-600 transition hover:border-gray-300 hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200"
            >
              {fetchStatus?.loading ? <RefreshCw size={12} className="animate-spin" /> : <Search size={12} />}
              {t('editor.projects.importPr')}
            </button>
            <button
              type="button"
              onClick={() => void onSyncRepo(project, true)}
              disabled={repoStatus?.state === 'loading'}
              className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-medium text-gray-600 transition hover:border-gray-300 hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200"
            >
              <RefreshCw size={12} className={repoStatus?.state === 'loading' ? 'animate-spin' : ''} />
              {t('editor.projects.syncRepo')}
            </button>
          </div>
        </div>
        <input
          type="text"
          value={project.repoUrl || ''}
          onChange={(event) => onUpdate({ repoUrl: event.target.value })}
          onBlur={(event) => void onSyncRepo({ ...project, repoUrl: event.target.value })}
          className="mt-1 block w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-base font-normal text-gray-900 shadow-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          placeholder={t('editor.projects.repoPlaceholder')}
        />
        {repoStatus?.message && (
          <div className="mt-1 flex min-h-5 items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
            <Github size={12} />
            <RepoStatusText status={repoStatus} />
          </div>
        )}
      </div>
    </div>
  );
}
