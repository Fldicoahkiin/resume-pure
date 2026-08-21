'use client';

import { Plus, Trash2 } from 'lucide-react';
import { projectProofAnchor } from '@/lib/previewAnchor';
import type { Project, ProjectProof, ProjectProofRef } from '@/types';
import { ProjectOption, type TranslationFn } from './shared';

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
    <section className="space-y-3 border-t border-gray-200 pt-5 dark:border-gray-700">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-gray-900 dark:text-white">{t('editor.projects.contributionsTitle')}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">{t('editor.projects.contributionsHint')}</p>
        </div>
        <div className="flex flex-wrap items-center gap-1">
          <ProjectOption
            checked={project.showProofs !== false}
            label={t('editor.projects.showContributions')}
            onChange={(checked) => onUpdate({ showProofs: checked })}
          />
          <button
            type="button"
            onClick={() => onAddProof(project)}
            className="inline-flex h-8 items-center gap-1.5 whitespace-nowrap rounded-md border border-gray-300 bg-white px-2.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 dark:focus-visible:ring-offset-gray-800"
          >
            <Plus size={14} />
            {t('editor.projects.addContribution')}
          </button>
        </div>
      </div>

      {proofs.length === 0 ? (
        <div className="rounded-md border border-dashed border-gray-300 px-3 py-4 text-center text-xs text-gray-400 dark:border-gray-600 dark:text-gray-500">
          {t('editor.projects.noContributions')}
        </div>
      ) : (
        <div className="space-y-2">
          {proofs.map((proof, index) => (
            <div
              key={proof.id}
              data-editor-anchor={projectProofAnchor(project.id, proof.id)}
              className="rounded-md border border-gray-200 bg-gray-50 p-3 dark:border-gray-600 dark:bg-gray-700/40"
            >
              <div className="mb-2 flex items-center justify-between gap-2">
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                  {t('editor.projects.contributionLabel', { index: index + 1 })}
                </p>
                <button
                  type="button"
                  onClick={() => onDeleteProof(project, proof.id)}
                  aria-label={t('editor.projects.deleteContribution')}
                  className="rounded-md p-1 text-gray-400 transition-colors hover:bg-white hover:text-red-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:hover:bg-gray-800"
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
                    className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-normal text-gray-900 shadow-sm outline-none transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:focus:border-blue-400 dark:focus:ring-blue-500/20"
                    placeholder={t('editor.projects.contributionSummaryPlaceholder')}
                  />
                </label>

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400">{t('editor.projects.refs')}</p>
                    <button
                      type="button"
                      onClick={() => onAddProofRef(project, proof.id)}
                      className="inline-flex h-7 items-center gap-1 rounded-md border border-gray-300 bg-white px-2 text-xs text-gray-600 transition-colors hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                    >
                      <Plus size={12} />
                      {t('editor.projects.addRef')}
                    </button>
                  </div>
                  {proof.refs.length === 0 ? (
                    <p className="text-xs text-gray-400 dark:text-gray-500">{t('editor.projects.noRefs')}</p>
                  ) : (
                    proof.refs.map((ref) => (
                      <div key={ref.id} className="flex flex-wrap items-center gap-2">
                        <select
                          value={ref.type}
                          onChange={(event) => onUpdateProofRef(project, proof.id, ref.id, { type: event.target.value as ProjectProofRef['type'] })}
                          aria-label={t('editor.projects.refType')}
                          className="h-8 w-24 rounded-md border border-gray-300 bg-white px-2 text-xs outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:focus:border-blue-400 dark:focus:ring-blue-500/20"
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
                          aria-label={t('editor.projects.refUrl')}
                          className="h-8 min-w-[180px] flex-1 rounded-md border border-gray-300 bg-white px-2 text-xs outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:focus:border-blue-400 dark:focus:ring-blue-500/20"
                          placeholder="URL"
                        />
                        {(ref.type === 'pr' || ref.type === 'issue') && (
                          <input
                            type="number"
                            value={ref.number ?? ''}
                            onChange={(event) => onUpdateProofRef(project, proof.id, ref.id, { number: event.target.value ? Number(event.target.value) : undefined })}
                            aria-label={t('editor.projects.refNumber')}
                            className="h-8 w-20 rounded-md border border-gray-300 bg-white px-2 text-xs outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:focus:border-blue-400 dark:focus:ring-blue-500/20"
                            placeholder="#"
                          />
                        )}
                        <button
                          type="button"
                          onClick={() => onDeleteProofRef(project, proof.id, ref.id)}
                          aria-label={t('editor.projects.deleteRef')}
                          title={t('editor.projects.deleteRef')}
                          className="rounded-md p-1.5 text-gray-400 transition-colors hover:bg-white hover:text-red-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:hover:bg-gray-800"
                        >
                          <Trash2 size={14} />
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
    </section>
  );
}
