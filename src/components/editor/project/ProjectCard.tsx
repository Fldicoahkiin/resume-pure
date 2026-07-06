'use client';

import { Project } from '@/types';
import { projectAnchor } from '@/lib/previewAnchor';
import { BulletListTextarea } from '../BulletListTextarea';
import { ProjectFormFields } from './ProjectFormFields';
import { ProjectLogoPanel } from './ProjectLogoPanel';
import { ProjectTechPanel } from './ProjectTechPanel';
import { ProjectProofsPanel } from './ProjectProofsPanel';
import { ToggleButton, type ProjectCardProps } from './shared';

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
      <div className="space-y-4">
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

      <div className="mt-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-gray-100 pt-3 dark:border-gray-800">
          <div>
            <p className="text-sm font-semibold text-gray-900 dark:text-white">{t('editor.projects.compactLayout')}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{t('editor.projects.compactLayoutHint')}</p>
          </div>
          <ToggleButton
            active={project.layout === 'compact'}
            activeLabel={t('editor.projects.enabled')}
            inactiveLabel={t('editor.projects.disabled')}
            onClick={() => updateProject({ layout: project.layout === 'compact' ? 'comfortable' : 'compact' })}
          />
        </div>
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
