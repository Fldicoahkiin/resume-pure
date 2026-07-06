'use client';

import { ChangeEvent, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Lightbulb, Plus, Trash2 } from 'lucide-react';
import { fetchGitHubRepoMeta, fetchGitHubPullRequests } from '@/lib/githubRepo';
import { readImageFileAsDataUrl, toDataUrl } from '@/lib/image';
import { createEntityId } from '@/lib/id';
import { useResumeStore } from '@/store/resumeStore';
import { Project, ProjectProof, ProjectProofRef } from '@/types';
import { DraggableItem } from './DraggableItem';
import { ProjectCard } from './project/ProjectCard';
import { PullRequestPickerDialog } from './project/PullRequestPickerDialog';
import {
  createEmptyProof,
  createEmptyProofRef,
  getRepoErrorMessage,
  type PrPickerState,
  type RepoStatus,
} from './project/shared';

interface ProjectEditorProps {
  embedded?: boolean;
  sectionId?: string;
}

export function ProjectEditor({ embedded = false, sectionId }: ProjectEditorProps) {
  const { t } = useTranslation();
  const store = useResumeStore();
  const { resume, hasHydrated } = store;

  const projects = sectionId
    ? (resume.customSections.find((s) => s.id === sectionId)?.items as Project[] || [])
    : resume.projects;

  const addProject = sectionId
    ? (proj: Project) => store.addCustomSectionItem(sectionId, proj)
    : store.addProject;

  const updateProject = sectionId
    ? (id: string, proj: Partial<Project>) => store.updateCustomSectionItem(sectionId, id, proj)
    : store.updateProject;

  const deleteProject = sectionId
    ? (id: string) => store.deleteCustomSectionItem(sectionId, id)
    : store.deleteProject;

  const reorderProjects = sectionId
    ? (items: Project[]) => store.reorderCustomSectionItems(sectionId, items)
    : store.reorderProjects;
  const [repoStatusMap, setRepoStatusMap] = useState<Record<string, RepoStatus>>({});
  const [logoErrorMap, setLogoErrorMap] = useState<Record<string, string>>({});
  const [fetchStatusMap, setFetchStatusMap] = useState<Record<string, { loading: boolean }>>({});
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);
  const [prPicker, setPrPicker] = useState<PrPickerState | null>(null);


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
      proofs: [],
      showLogo: true,
      showStars: true,
      showTechnologies: true,
      showProofs: true,
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
      const avatarDataUrl = meta.avatarUrl ? await toDataUrl(meta.avatarUrl) : undefined;
      updateProject(project.id, {
        repoUrl: meta.normalizedUrl,
        repoStars: meta.stars,
        repoAvatarUrl: avatarDataUrl,
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

  const handleUpdateProof = (project: Project, proofId: string, patch: Partial<ProjectProof>) => {
    updateProject(project.id, {
      proofs: (project.proofs || []).map((item) => (
        item.id === proofId ? { ...item, ...patch } : item
      )),
    });
  };

  const handleAddProof = (project: Project) => {
    updateProject(project.id, {
      proofs: [...(project.proofs || []), createEmptyProof()],
    });
  };

  const handleDeleteProof = (project: Project, proofId: string) => {
    updateProject(project.id, {
      proofs: (project.proofs || []).filter((item) => item.id !== proofId),
    });
  };

  const handleAddProofRef = (project: Project, proofId: string) => {
    updateProject(project.id, {
      proofs: (project.proofs || []).map((proof) =>
        proof.id === proofId ? { ...proof, refs: [...proof.refs, createEmptyProofRef()] } : proof
      ),
    });
  };

  const handleDeleteProofRef = (project: Project, proofId: string, refId: string) => {
    updateProject(project.id, {
      proofs: (project.proofs || []).map((proof) =>
        proof.id === proofId ? { ...proof, refs: proof.refs.filter((r) => r.id !== refId) } : proof
      ),
    });
  };

  const handleUpdateProofRef = (project: Project, proofId: string, refId: string, patch: Partial<ProjectProofRef>) => {
    updateProject(project.id, {
      proofs: (project.proofs || []).map((proof) =>
        proof.id === proofId
          ? { ...proof, refs: proof.refs.map((r) => (r.id === refId ? { ...r, ...patch } : r)) }
          : proof
      ),
    });
  };

  const handleFetchPullRequests = async (project: Project) => {
    const repoUrl = project.repoUrl?.trim();
    if (!repoUrl) return;

    const githubRaw = resume.personalInfo.github?.trim() || '';
    const authorLogin = githubRaw.replace(/^https?:\/\/(www\.)?github\.com\//, '').replace(/\/+$/, '');
    if (!authorLogin) return;

    setFetchStatusMap((prev) => ({ ...prev, [project.id]: { loading: true } }));

    try {
      const refs = await fetchGitHubPullRequests(repoUrl, authorLogin);
      if (refs.length === 0) return;

      setPrPicker({ projectId: project.id, refs });
    } finally {
      setFetchStatusMap((prev) => ({ ...prev, [project.id]: { loading: false } }));
    }
  };

  const handleCreateSingleProofs = (selectedRefs: ProjectProofRef[]) => {
    if (!prPicker) return;
    const project = projects.find(p => p.id === prPicker.projectId);
    if (!project) return;

    const newProofs: ProjectProof[] = selectedRefs.map((ref) => ({
      id: createEntityId('proof'),
      summary: ref.title || `PR #${ref.number}`,
      refs: [{ ...ref, id: createEntityId('ref') }],
    }));

    updateProject(prPicker.projectId, {
      proofs: [...(project.proofs || []), ...newProofs],
    });
    setPrPicker(null);
  };

  const handleCreateMergedProof = (selectedRefs: ProjectProofRef[], summary: string) => {
    if (!prPicker) return;
    const project = projects.find(p => p.id === prPicker.projectId);
    if (!project) return;

    const newProof: ProjectProof = {
      id: createEntityId('proof'),
      summary,
      refs: selectedRefs.map(ref => ({ ...ref, id: createEntityId('ref') })),
    };

    updateProject(prPicker.projectId, {
      proofs: [...(project.proofs || []), newProof],
    });
    setPrPicker(null);
  };

  const handleDragStart = (idx: number) => {
    setDraggedIdx(idx);
  };

  const handleDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    if (draggedIdx === null || draggedIdx === idx) return;
    const items = [...projects];
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
      {projects.length === 0 ? (
        <div className="py-8 text-center text-gray-500 dark:text-gray-400">
          <Lightbulb className="mx-auto mb-3 h-12 w-12 text-gray-300 dark:text-gray-600" />
          <p className="text-sm">{t('editor.projects.noProjects')}</p>
          <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">{t('editor.projects.addHint')}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {projects.map((project, idx) => (
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
                onAddProof={handleAddProof}
                onDeleteProof={handleDeleteProof}
                onUpdateProof={handleUpdateProof}
                onAddProofRef={handleAddProofRef}
                onDeleteProofRef={handleDeleteProofRef}
                onUpdateProofRef={handleUpdateProofRef}
                onFetchPullRequests={handleFetchPullRequests}
                fetchStatus={fetchStatusMap[project.id]}
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

      {prPicker && (
        <PullRequestPickerDialog
          repoUrl={projects.find(p => p.id === prPicker.projectId)?.repoUrl || ''}
          refs={prPicker.refs}
          onCreateSingle={handleCreateSingleProofs}
          onCreateMerged={handleCreateMergedProof}
          onClose={() => setPrPicker(null)}
        />
      )}
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
