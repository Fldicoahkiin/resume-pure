'use client';

import { Plus, Trash2 } from 'lucide-react';
import { projectProofAnchor } from '@/lib/previewAnchor';
import { Project, ProjectProof, ProjectProofRef } from '@/types';
import { ToggleButton, type TranslationFn } from './shared';

export function ProjectProofsPanel({
  project,
  t,
  onUpdate,
  onAddProof,
  onDeleteProof,
  onUpdateProof,
  onAddProofRef,
  onDeleteProofRef,
  onUpdateProofRef,
}: {
  project: Project;
  t: TranslationFn;
  onUpdate: (patch: Partial<Project>) => void;
  onAddProof: (project: Project) => void;
  onDeleteProof: (project: Project, proofId: string) => void;
  onUpdateProof: (project: Project, proofId: string, patch: Partial<ProjectProof>) => void;
  onAddProofRef: (project: Project, proofId: string) => void;
  onDeleteProofRef: (project: Project, proofId: string, refId: string) => void;
  onUpdateProofRef: (project: Project, proofId: string, refId: string, patch: Partial<ProjectProofRef>) => void;
}) {
  const proofs = project.proofs || [];

  return (
    <div className="space-y-3 rounded-2xl border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-800/60">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-gray-900 dark:text-white">{t('editor.projects.contributionsTitle')}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">{t('editor.projects.contributionsHint')}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <ToggleButton
            active={project.showProofs !== false}
            activeLabel={t('editor.projects.showContributions')}
            inactiveLabel={t('editor.projects.hideContributions')}
            onClick={() => onUpdate({ showProofs: project.showProofs === false })}
          />
          <button
            type="button"
            onClick={() => onAddProof(project)}
            className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 transition hover:border-gray-300 hover:text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200"
          >
            <Plus size={12} />
            {t('editor.projects.addContribution')}
          </button>
        </div>
      </div>

      {proofs.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-200 px-3 py-4 text-center text-xs text-gray-400 dark:border-gray-600 dark:text-gray-500">
          {t('editor.projects.noContributions')}
        </div>
      ) : (
        <div className="space-y-2">
          {proofs.map((proof, index) => (
            <div
              key={proof.id}
              data-editor-anchor={projectProofAnchor(project.id, proof.id)}
              className="rounded-xl border border-gray-200 bg-gray-50 p-3 dark:border-gray-600 dark:bg-gray-700/40"
            >
              <div className="mb-2 flex items-center justify-between gap-2">
                <p className="text-xs font-medium uppercase tracking-[0.12em] text-gray-500 dark:text-gray-400">
                  {t('editor.projects.contributionLabel', { index: index + 1 })}
                </p>
                <button
                  type="button"
                  onClick={() => onDeleteProof(project, proof.id)}
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
                    value={proof.summary}
                    onChange={(event) => onUpdateProof(project, proof.id, { summary: event.target.value })}
                    className="mt-1 block w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm font-normal text-gray-900 shadow-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    placeholder={t('editor.projects.contributionSummaryPlaceholder')}
                  />
                </label>

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400">{t('editor.projects.refs')}</p>
                    <button
                      type="button"
                      onClick={() => onAddProofRef(project, proof.id)}
                      className="inline-flex items-center gap-0.5 rounded-full border border-gray-200 bg-white px-2 py-0.5 text-xs text-gray-500 transition hover:border-gray-300 hover:text-gray-700 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300"
                    >
                      <Plus size={10} />
                      {t('editor.projects.addRef')}
                    </button>
                  </div>
                  {proof.refs.length === 0 ? (
                    <p className="text-xs text-gray-400 dark:text-gray-500">{t('editor.projects.noRefs')}</p>
                  ) : (
                    proof.refs.map((ref) => (
                      <div key={ref.id} className="flex items-center gap-2">
                        <select
                          value={ref.type}
                          onChange={(event) => onUpdateProofRef(project, proof.id, ref.id, { type: event.target.value as ProjectProofRef['type'] })}
                          className="w-20 rounded-lg border border-gray-200 bg-white px-2 py-1 text-xs dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                        >
                          <option value="pr">PR</option>
                          <option value="commit">Commit</option>
                          <option value="issue">Issue</option>
                          <option value="link">Link</option>
                        </select>
                        <input
                          type="text"
                          value={ref.url}
                          onChange={(event) => onUpdateProofRef(project, proof.id, ref.id, { url: event.target.value })}
                          className="flex-1 rounded-lg border border-gray-200 bg-white px-2 py-1 text-xs dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                          placeholder="URL"
                        />
                        {(ref.type === 'pr' || ref.type === 'issue') && (
                          <input
                            type="number"
                            value={ref.number ?? ''}
                            onChange={(event) => onUpdateProofRef(project, proof.id, ref.id, { number: event.target.value ? Number(event.target.value) : undefined })}
                            className="w-16 rounded-lg border border-gray-200 bg-white px-2 py-1 text-xs dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                            placeholder="#"
                          />
                        )}
                        <button
                          type="button"
                          onClick={() => onDeleteProofRef(project, proof.id, ref.id)}
                          className="rounded-full p-0.5 text-gray-400 transition hover:text-red-500"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
