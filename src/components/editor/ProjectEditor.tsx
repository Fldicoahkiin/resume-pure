'use client';

import { ChangeEvent, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Github, Image as ImageIcon, Eye, EyeOff, Lightbulb, Plus, RefreshCw, Star, Trash2 } from 'lucide-react';
import { LogoBadge } from '@/components/LogoBadge';
import { fetchGitHubRepoMeta } from '@/lib/githubRepo';
import { readImageFileAsDataUrl } from '@/lib/image';
import { resolveSkillLogo } from '@/lib/skillLogo';
import { createEntityId } from '@/lib/id';
import { projectAnchor, projectContributionAnchor } from '@/lib/previewAnchor';
import { useResumeStore } from '@/store/resumeStore';
import { Project, ProjectContribution } from '@/types';
import { BulletListTextarea } from './BulletListTextarea';
import { DraggableItem } from './DraggableItem';

interface ProjectEditorProps {
  embedded?: boolean;
}

type SyncState = 'idle' | 'loading' | 'success' | 'error';

type TranslationFn = (key: string, options?: Record<string, unknown>) => string;

interface RepoStatus {
  state: SyncState;
  message?: string;
  syncedUrl?: string;
}

interface ProjectCardProps {
  project: Project;
  repoStatus?: RepoStatus;
  logoError?: string;
  t: TranslationFn;
  onUpdate: (projectId: string, patch: Partial<Project>) => void;
  onSyncRepo: (project: Project, force?: boolean) => Promise<void>;
  onUploadLogo: (projectId: string, event: ChangeEvent<HTMLInputElement>) => Promise<void>;
  onAddContribution: (project: Project) => void;
  onDeleteContribution: (project: Project, contributionId: string) => void;
  onUpdateContribution: (project: Project, contributionId: string, patch: Partial<ProjectContribution>) => void;
}



function getDateValue(project: Project, presentLabel: string): string {
  if (project.current) {
    return project.startDate ? `${project.startDate} - ${presentLabel}` : presentLabel;
  }

  if (!project.startDate && !project.endDate) {
    return '';
  }

  return `${project.startDate}${project.startDate && project.endDate ? ' - ' : ''}${project.endDate}`;
}

function parseDateValue(value: string, presentLabel: string) {
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

function createEmptyContribution(): ProjectContribution {
  return {
    id: createEntityId('contribution'),
    summary: '',
    url: '',
  };
}

function getProjectLogo(project: Project): string | undefined {
  return project.customLogo || project.repoAvatarUrl;
}

function getRepoErrorMessage(t: TranslationFn, error: unknown): string {
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

function ToggleButton({
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

function RepoStatusText({ status }: { status?: RepoStatus }) {
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


function ProjectFormFields({
  project,
  repoStatus,
  t,
  onUpdate,
  onSyncRepo,
}: {
  project: Project;
  repoStatus?: RepoStatus;
  t: TranslationFn;
  onUpdate: (patch: Partial<Project>) => void;
  onSyncRepo: (project: Project, force?: boolean) => Promise<void>;
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

function ProjectLogoPanel({
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

function ProjectTechPanel({
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

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
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
    <div className="space-y-3 rounded-2xl border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-800/60">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-gray-900 dark:text-white">{t('editor.projects.techTitle')}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">{t('editor.projects.techHint')}</p>
        </div>
        <ToggleButton
          active={project.showTechnologies !== false}
          activeLabel={t('editor.projects.showTechnologies')}
          inactiveLabel={t('editor.projects.hideTechnologies')}
          onClick={() => onUpdate({ showTechnologies: project.showTechnologies === false })}
        />
      </div>
      <div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-gray-300 bg-white px-2 py-1.5 dark:border-gray-600 dark:bg-gray-700">
        {technologies.map((tech, index) => {
          const logo = resolveSkillLogo(tech);
          return (
            <span
              key={tech}
              className="inline-flex items-center gap-1 rounded-full bg-gray-50 border border-gray-200 px-2 py-0.5 text-xs font-medium text-gray-700 dark:bg-gray-600 dark:border-gray-500 dark:text-gray-200"
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
                className="ml-0.5 text-gray-400 transition hover:text-red-500"
              >
                ×
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
          className="min-w-[120px] flex-1 bg-transparent px-1 py-1 text-sm text-gray-900 outline-none placeholder:text-gray-400 dark:text-white"
          placeholder={technologies.length === 0 ? t('editor.projects.technologiesPlaceholder') : ''}
        />
      </div>
    </div>
  );
}

function ProjectContributionsPanel({
  project,
  t,
  onUpdate,
  onAddContribution,
  onDeleteContribution,
  onUpdateContribution,
}: {
  project: Project;
  t: TranslationFn;
  onUpdate: (patch: Partial<Project>) => void;
  onAddContribution: (project: Project) => void;
  onDeleteContribution: (project: Project, contributionId: string) => void;
  onUpdateContribution: (project: Project, contributionId: string, patch: Partial<ProjectContribution>) => void;
}) {
  const contributions = project.contributions || [];

  return (
    <div className="space-y-3 rounded-2xl border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-800/60">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-gray-900 dark:text-white">{t('editor.projects.contributionsTitle')}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">{t('editor.projects.contributionsHint')}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <ToggleButton
            active={project.showContributions !== false}
            activeLabel={t('editor.projects.showContributions')}
            inactiveLabel={t('editor.projects.hideContributions')}
            onClick={() => onUpdate({ showContributions: project.showContributions === false })}
          />
          <button
            type="button"
            onClick={() => onAddContribution(project)}
            className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 transition hover:border-gray-300 hover:text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200"
          >
            <Plus size={12} />
            {t('editor.projects.addContribution')}
          </button>
        </div>
      </div>

      {contributions.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-200 px-3 py-4 text-center text-xs text-gray-400 dark:border-gray-600 dark:text-gray-500">
          {t('editor.projects.noContributions')}
        </div>
      ) : (
        <div className="space-y-2">
          {contributions.map((contribution, index) => (
            <div
              key={contribution.id}
              data-editor-anchor={projectContributionAnchor(project.id, contribution.id)}
              className="rounded-xl border border-gray-200 bg-gray-50 p-3 dark:border-gray-600 dark:bg-gray-700/40"
            >
              <div className="mb-2 flex items-center justify-between gap-2">
                <p className="text-xs font-medium uppercase tracking-[0.12em] text-gray-500 dark:text-gray-400">
                  {t('editor.projects.contributionLabel', { index: index + 1 })}
                </p>
                <button
                  type="button"
                  onClick={() => onDeleteContribution(project, contribution.id)}
                  className="rounded-full p-1 text-gray-400 transition hover:bg-white hover:text-red-500 dark:hover:bg-gray-800"
                  title={t('editor.projects.deleteContribution')}
                >
                  <Trash2 size={14} />
                </button>
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t('editor.projects.contributionSummary')}
                  <input
                    type="text"
                    value={contribution.summary}
                    onChange={(event) => onUpdateContribution(project, contribution.id, { summary: event.target.value })}
                    className="mt-1 block w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm font-normal text-gray-900 shadow-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    placeholder={t('editor.projects.contributionSummaryPlaceholder')}
                  />
                </label>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t('editor.projects.contributionUrl')}
                  <input
                    type="text"
                    value={contribution.url}
                    onChange={(event) => onUpdateContribution(project, contribution.id, { url: event.target.value })}
                    className="mt-1 block w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm font-normal text-gray-900 shadow-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    placeholder={t('editor.projects.contributionUrlPlaceholder')}
                  />
                </label>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ProjectCard({
  project,
  repoStatus,
  logoError,
  t,
  onUpdate,
  onSyncRepo,
  onUploadLogo,
  onAddContribution,
  onDeleteContribution,
  onUpdateContribution,
}: ProjectCardProps) {
  const updateProject = (patch: Partial<Project>) => onUpdate(project.id, patch);

  return (
    <div
      data-editor-anchor={projectAnchor(project.id)}
    >
      <div className="space-y-4">
        <ProjectFormFields
          project={project}
          repoStatus={repoStatus}
          t={t}
          onUpdate={updateProject}
          onSyncRepo={onSyncRepo}
        />
        <ProjectLogoPanel
          project={project}
          logoError={logoError}
          t={t}
          onUpdate={updateProject}
          onUploadLogo={onUploadLogo}
        />
        <ProjectTechPanel
          project={project}
          t={t}
          onUpdate={updateProject}
        />
        <ProjectContributionsPanel
          project={project}
          t={t}
          onUpdate={updateProject}
          onAddContribution={onAddContribution}
          onDeleteContribution={onDeleteContribution}
          onUpdateContribution={onUpdateContribution}
        />
      </div>

      <div className="mt-4">
        <BulletListTextarea
          className="col-span-full"
          label={t('editor.projects.description')}
          value={project.description}
          showBulletPoints={project.showBulletPoints !== false}
          onChange={(nextValue) => updateProject({ description: nextValue })}
          onToggleShowBulletPoints={(nextValue) => updateProject({ showBulletPoints: nextValue })}
          showBulletPointsLabel={t('editor.projects.showBulletPoints')}
          hideBulletPointsLabel={t('editor.projects.hideBulletPoints')}
          placeholder={t('editor.projects.descriptionPlaceholder')}
        />
      </div>
    </div>
  );
}

export function ProjectEditor({ embedded = false }: ProjectEditorProps) {
  const { t } = useTranslation();
  const { resume, hasHydrated, addProject, updateProject, deleteProject, reorderProjects } = useResumeStore();
  const [repoStatusMap, setRepoStatusMap] = useState<Record<string, RepoStatus>>({});
  const [logoErrorMap, setLogoErrorMap] = useState<Record<string, string>>({});
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);

  if (!hasHydrated) {
    return (
      <div className={embedded ? 'animate-pulse' : 'rounded-lg bg-white p-6 shadow animate-pulse dark:bg-gray-800'}>
        <div className="mb-4 h-6 w-1/4 rounded bg-gray-200 dark:bg-gray-700" />
        <div className="h-32 rounded bg-gray-200 dark:bg-gray-700" />
      </div>
    );
  }

  const handleAdd = () => {
    const newProject: Project = {
      id: createEntityId('proj'),
      name: '',
      role: '',
      startDate: '',
      endDate: '',
      current: false,
      url: '',
      repoUrl: '',
      description: [''],
      technologies: [],
      contributions: [],
      showLogo: true,
      showStars: true,
      showTechnologies: true,
      showContributions: true,
      showBulletPoints: true,
    };

    addProject({ ...newProject, visible: true });
  };

  const updateRepoStatus = (projectId: string, nextStatus: RepoStatus) => {
    setRepoStatusMap((current) => ({
      ...current,
      [projectId]: nextStatus,
    }));
  };

  const handleRepoSync = async (project: Project, force: boolean = false) => {
    const repoUrl = project.repoUrl?.trim();
    if (!repoUrl) {
      if (force) {
        updateRepoStatus(project.id, {
          state: 'error',
          message: t('editor.projects.repoMissing'),
        });
      }
      return;
    }

    const currentStatus = repoStatusMap[project.id];
    if (!force && currentStatus?.syncedUrl === repoUrl) {
      return;
    }

    updateRepoStatus(project.id, {
      state: 'loading',
      message: t('editor.projects.repoSyncing'),
      syncedUrl: currentStatus?.syncedUrl,
    });

    try {
      const meta = await fetchGitHubRepoMeta(repoUrl);
      updateProject(project.id, {
        repoUrl: meta.normalizedUrl,
        repoStars: meta.stars,
        repoAvatarUrl: meta.avatarUrl,
      });
      updateRepoStatus(project.id, {
        state: 'success',
        message: t('editor.projects.repoSynced', { stars: meta.stars }),
        syncedUrl: meta.normalizedUrl,
      });
    } catch (error) {
      updateRepoStatus(project.id, {
        state: 'error',
        message: getRepoErrorMessage(t, error),
        syncedUrl: currentStatus?.syncedUrl,
      });
    }
  };

  const handleProjectLogoUpload = async (projectId: string, event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const dataUrl = await readImageFileAsDataUrl(file);
      updateProject(projectId, { customLogo: dataUrl });
      setLogoErrorMap((current) => ({ ...current, [projectId]: '' }));
    } catch {
      setLogoErrorMap((current) => ({ ...current, [projectId]: t('editor.projects.logoUploadFailed') }));
    } finally {
      event.target.value = '';
    }
  };

  const handleUpdateContribution = (project: Project, contributionId: string, patch: Partial<ProjectContribution>) => {
    updateProject(project.id, {
      contributions: (project.contributions || []).map((item) => (
        item.id === contributionId ? { ...item, ...patch } : item
      )),
    });
  };

  const handleAddContribution = (project: Project) => {
    updateProject(project.id, {
      contributions: [...(project.contributions || []), createEmptyContribution()],
    });
  };

  const handleDeleteContribution = (project: Project, contributionId: string) => {
    updateProject(project.id, {
      contributions: (project.contributions || []).filter((item) => item.id !== contributionId),
    });
  };

  const handleDragStart = (idx: number) => {
    setDraggedIdx(idx);
  };

  const handleDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    if (draggedIdx === null || draggedIdx === idx) return;
    const items = [...resume.projects];
    const [removed] = items.splice(draggedIdx, 1);
    items.splice(idx, 0, removed);
    reorderProjects(items);
    setDraggedIdx(idx);
  };

  const handleDragEnd = () => {
    setDraggedIdx(null);
  };

  const content = (
    <>
      {resume.projects.length === 0 ? (
        <div className="py-8 text-center text-gray-500 dark:text-gray-400">
          <Lightbulb className="mx-auto mb-3 h-12 w-12 text-gray-300 dark:text-gray-600" />
          <p className="text-sm">{t('editor.projects.noProjects')}</p>
          <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">{t('editor.projects.addHint')}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {resume.projects.map((project, idx) => (
            <DraggableItem
              key={project.id}
              id={project.id}
              title={project.name || t('editor.projects.cardTitle')}
              visible={project.visible !== false}
              onToggleVisible={() => updateProject(project.id, { visible: project.visible === false })}
              onDragStart={() => handleDragStart(idx)}
              onDragOver={(e) => handleDragOver(e, idx)}
              onDragEnd={handleDragEnd}
              isDragging={draggedIdx === idx}
              headerActions={
                <button
                  type="button"
                  onClick={() => deleteProject(project.id)}
                  className="p-1 rounded text-gray-400 hover:text-red-500 transition"
                  title={t('editor.projects.deleteTitle')}
                >
                  <Trash2 size={16} />
                </button>
              }
              initialCollapsed
            >
              <ProjectCard
                project={project}
                repoStatus={repoStatusMap[project.id]}
                logoError={logoErrorMap[project.id]}
                t={t}
                onUpdate={updateProject}
                onSyncRepo={handleRepoSync}
                onUploadLogo={handleProjectLogoUpload}
                onAddContribution={handleAddContribution}
                onDeleteContribution={handleDeleteContribution}
                onUpdateContribution={handleUpdateContribution}
              />
            </DraggableItem>
          ))}
        </div>
      )}

      <div className="mt-4 flex justify-end">
        <button
          type="button"
          onClick={handleAdd}
          className="flex items-center gap-1 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
        >
          <Plus size={16} />
          {t('editor.projects.addProject')}
        </button>
      </div>
    </>
  );

  if (embedded) {
    return content;
  }

  return (
    <section className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
      <div className="mb-4 flex items-center gap-2">
        <Lightbulb className="h-5 w-5 text-gray-600 dark:text-gray-400" />
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{t('editor.projects.title')}</h2>
      </div>
      {content}
    </section>
  );
}
