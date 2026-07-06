'use client';

import { ChangeEvent } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { createEntityId } from '@/lib/id';
import { Project, ProjectProof, ProjectProofRef } from '@/types';

export type SyncState = 'idle' | 'loading' | 'success' | 'error';

export type TranslationFn = (key: string, options?: Record<string, unknown>) => string;

export interface RepoStatus {
  state: SyncState;
  message?: string;
  syncedUrl?: string;
}

export interface PrPickerState {
  projectId: string;
  refs: ProjectProofRef[];
}

export interface ProjectCardProps {
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
}

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

export function getProjectLogo(project: Project): string | undefined {
  return project.customLogo || project.repoAvatarUrl;
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

export function ToggleButton({
  active,
  activeLabel,
  inactiveLabel,
  onClick,
}: {
  active: boolean;
  activeLabel: string;
  inactiveLabel: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition ${
        active
          ? 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-500/40 dark:bg-blue-500/10 dark:text-blue-200'
          : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:text-white'
      }`}
      aria-pressed={active}
    >
      {active ? <Eye size={14} /> : <EyeOff size={14} />}
      {active ? activeLabel : inactiveLabel}
    </button>
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
