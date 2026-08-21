'use client';

import type { Project } from '@/types';
import { projectAnchor } from '@/lib/previewAnchor';
import { BulletListTextarea } from '../BulletListTextarea';
import { ProjectFormFields } from './ProjectFormFields';
import { ProjectLogoPanel } from './ProjectLogoPanel';
import { ProjectTechPanel } from './ProjectTechPanel';
import { ProjectProofsPanel } from './ProjectProofsPanel';
import { ProjectOption, type ProjectCardProps } from './shared';

export function ProjectCard({
  project,
  repoStatus,
  logoError,
  t,
  onUpdate,
  onSyncRepo,
  onUploadLogo,
  onAddProof,
  onDeleteProof,
  onUpdateProof,
  onAddProofRef,
  onDeleteProofRef,
  onUpdateProofRef,
  onFetchPullRequests,
  fetchStatus,
}: ProjectCardProps) {
  const updateProject = (patch: Partial<Project>) => onUpdate(project.id, patch);

  return (
    <div
      data-editor-anchor={projectAnchor(project.id)}
    >
      <div className="space-y-5">
        <ProjectFormFields
          project={project}
          repoStatus={repoStatus}
          t={t}
          onUpdate={updateProject}
          onSyncRepo={onSyncRepo}
          onFetchPullRequests={onFetchPullRequests}
          fetchStatus={fetchStatus}
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
        <div className="space-y-3 border-t border-gray-200 pt-5 dark:border-gray-700">
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
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">{t('editor.projects.compactLayout')}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{t('editor.projects.compactLayoutHint')}</p>
            </div>
            <ProjectOption
              checked={project.layout === 'compact'}
              label={t('editor.projects.enabled')}
              onChange={(checked) => updateProject({ layout: checked ? 'compact' : 'comfortable' })}
            />
          </div>
        </div>
        <ProjectProofsPanel
          project={project}
          t={t}
          onUpdate={updateProject}
          onAddProof={onAddProof}
          onDeleteProof={onDeleteProof}
          onUpdateProof={onUpdateProof}
          onAddProofRef={onAddProofRef}
          onDeleteProofRef={onDeleteProofRef}
          onUpdateProofRef={onUpdateProofRef}
        />
      </div>
    </div>
  );
}
