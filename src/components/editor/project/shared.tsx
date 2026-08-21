'use client';

import type { ChangeEvent } from 'react';
import { createEntityId } from '@/lib/id';
import type { Project, ProjectProof, ProjectProofRef } from '@/types';

export type SyncState = 'idle' | 'loading' | 'success' | 'error';

export type TranslationFn = (key: string, options?: Record<string, unknown>) => string;

export type RepoStatus = {
  state: SyncState;
  message?: string;
  syncedUrl?: string;
};

export type PrPickerState = {
  projectId: string;
  refs: ProjectProofRef[];
};

export type ProjectCardProps = {
  project: Project;
  repoStatus?: RepoStatus;
  logoError?: string;
  t: TranslationFn;
  onUpdate: (projectId: string, patch: Partial<Project>) => void;
  onSyncRepo: (project: Project, force?: boolean) => Promise<void>;
  onUploadLogo: (projectId: string, event: ChangeEvent<HTMLInputElement>) => Promise<void>;
  onAddProof: (project: Project) => void;
  onDeleteProof: (project: Project, proofId: string) => void;
  onUpdateProof: (project: Project, proofId: string, patch: Partial<ProjectProof>) => void;
  onAddProofRef: (project: Project, proofId: string) => void;
  onDeleteProofRef: (project: Project, proofId: string, refId: string) => void;
  onUpdateProofRef: (project: Project, proofId: string, refId: string, patch: Partial<ProjectProofRef>) => void;
  onFetchPullRequests?: (project: Project) => Promise<void>;
  fetchStatus?: { loading: boolean };
};

export function getDateValue(project: Project, presentLabel: string): string {
  if (project.current) {
    return project.startDate ? `${project.startDate} - ${presentLabel}` : presentLabel;
  }

  if (!project.startDate && !project.endDate) {
    return '';
  }

  return `${project.startDate}${project.startDate && project.endDate ? ' - ' : ''}${project.endDate}`;
}

export function parseDateValue(value: string, presentLabel: string) {
  const trimmedValue = value.trim();
  const normalizedPresentLabel = presentLabel.trim();
  const isPresent =
    trimmedValue.includes(normalizedPresentLabel) || trimmedValue.toLowerCase().includes('present');

  if (isPresent) {
    const startDate = trimmedValue
      .replace(normalizedPresentLabel, '')
      .replace(/-+/g, ' ')
      .trim();

    return {
      startDate,
      endDate: '',
      current: true,
    };
  }

  const [startDate = '', endDate = ''] = trimmedValue.split(' - ');
  return {
    startDate,
    endDate,
    current: false,
  };
}

export function createEmptyProof(): ProjectProof {
  return {
    id: createEntityId('proof'),
    summary: '',
    refs: [],
  };
}

export function createEmptyProofRef(): ProjectProofRef {
  return {
    id: createEntityId('ref'),
    type: 'link',
    url: '',
  };
}

export function getRepoErrorMessage(t: TranslationFn, error: unknown): string {
  if (!(error instanceof Error)) {
    return t('editor.projects.repoSyncFailed');
  }

  switch (error.message) {
    case 'invalid-url':
      return t('editor.projects.repoInvalid');
    case 'not-found':
      return t('editor.projects.repoNotFound');
    case 'rate-limited':
      return t('editor.projects.repoRateLimited');
    default:
      return t('editor.projects.repoSyncFailed');
  }
}

export function ProjectOption({
  checked,
  label,
  onChange,
}: {
  checked: boolean;
  label: string;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="inline-flex shrink-0 cursor-pointer items-center gap-2 whitespace-nowrap rounded-md px-2 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="h-4 w-4 rounded border-gray-300 accent-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:border-gray-600 dark:bg-gray-700 dark:accent-white dark:focus-visible:ring-offset-gray-800"
      />
      <span>{label}</span>
    </label>
  );
}

export function RepoStatusText({ status }: { status?: RepoStatus }) {
  if (!status || !status.message) {
    return null;
  }

  const colorClass = status.state === 'error'
    ? 'text-red-500 dark:text-red-300'
    : status.state === 'success'
      ? 'text-green-600 dark:text-green-300'
      : 'text-gray-500 dark:text-gray-400';

  return <p className={`text-xs ${colorClass}`}>{status.message}</p>;
}
