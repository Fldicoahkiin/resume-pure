'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';
import { ProjectProofRef } from '@/types';

export function PullRequestPickerDialog({
  repoUrl,
  refs,
  onCreateSingle,
  onCreateMerged,
  onClose,
}: {
  repoUrl: string;
  refs: ProjectProofRef[];
  onCreateSingle: (selected: ProjectProofRef[]) => void;
  onCreateMerged: (selected: ProjectProofRef[], summary: string) => void;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set(refs.map(r => r.id)));
  const [mode, setMode] = useState<'single' | 'merged'>('single');
  const [mergedSummary, setMergedSummary] = useState('');

  const allSelected = selectedIds.size === refs.length && refs.length > 0;

  const toggleAll = () => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(refs.map((r) => r.id)));
    }
  };

  const toggleItem = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedIds(next);
  };

  const selectedRefs = refs.filter((r) => selectedIds.has(r.id));

  const handleConfirm = () => {
    if (selectedRefs.length === 0) return;
    if (mode === 'single') {
      onCreateSingle(selectedRefs);
    } else {
      onCreateMerged(selectedRefs, mergedSummary);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm dark:bg-black/60"
        onClick={onClose}
      />

      <div className="relative flex max-h-[85vh] w-full max-w-2xl flex-col rounded-2xl bg-white shadow-2xl ring-1 ring-gray-200 dark:bg-gray-800 dark:ring-gray-700">
        <div className="flex shrink-0 items-center justify-between border-b border-gray-100 p-4 dark:border-gray-700">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{t('editor.projects.importPrDialogTitle')}</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {t('editor.projects.importPrDialogHint', { repo: repoUrl.replace(/^https?:\/\/(www\.)?github\.com\//, '') })}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300"
          >
            <X size={18} />
          </button>
        </div>

        <div className="shrink-0 border-b border-gray-100 bg-gray-50/50 p-2 dark:border-gray-700 dark:bg-gray-800/50">
          <label className="flex cursor-pointer items-center gap-2 px-3 py-1 text-sm font-medium text-gray-700 dark:text-gray-300">
            <input
              type="checkbox"
              checked={allSelected}
              onChange={toggleAll}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-600 dark:border-gray-600 dark:bg-gray-700 dark:ring-offset-gray-800"
            />
            {t('editor.projects.toggleAll', { selected: selectedIds.size, total: refs.length })}
          </label>
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          {refs.map((ref) => (
            <label
              key={ref.id}
              className="flex cursor-pointer items-start gap-3 rounded-xl p-3 transition hover:bg-gray-50 dark:hover:bg-gray-700/50"
            >
              <input
                type="checkbox"
                checked={selectedIds.has(ref.id)}
                onChange={() => toggleItem(ref.id)}
                className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-600 dark:border-gray-600 dark:bg-gray-700 dark:ring-offset-gray-800"
              />
              <div className="flex-1 overflow-hidden">
                <p className="text-sm font-medium text-gray-900 line-clamp-2 dark:text-white">
                  {ref.title || `PR #${ref.number}`}
                </p>
                <div className="mt-1 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                  <span className="font-mono">#{ref.number}</span>
                  {ref.mergedAt && (
                    <span>
                      {t('editor.projects.mergedAt', { date: new Date(ref.mergedAt).toLocaleDateString() })}
                    </span>
                  )}
                </div>
              </div>
            </label>
          ))}
        </div>

        <div className="shrink-0 space-y-4 border-t border-gray-100 p-4 dark:border-gray-700">
          <div className="flex gap-4">
            <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              <input
                type="radio"
                checked={mode === 'single'}
                onChange={() => setMode('single')}
                className="h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-600 dark:border-gray-600 dark:bg-gray-700 dark:ring-offset-gray-800"
              />
              {t('editor.projects.prModeSingle')}
            </label>
            <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              <input
                type="radio"
                checked={mode === 'merged'}
                onChange={() => setMode('merged')}
                className="h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-600 dark:border-gray-600 dark:bg-gray-700 dark:ring-offset-gray-800"
              />
              {t('editor.projects.prModeMerged')}
            </label>
          </div>

          {mode === 'merged' && (
            <div>
              <input
                type="text"
                value={mergedSummary}
                onChange={(e) => setMergedSummary(e.target.value)}
                placeholder={t('editor.projects.mergedSummaryPlaceholder')}
                className="block w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm font-normal text-gray-900 shadow-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                autoFocus
              />
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              {t('common.cancel')}
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={selectedRefs.length === 0 || (mode === 'merged' && !mergedSummary.trim())}
              className="rounded-xl bg-gray-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100"
            >
              {t('editor.projects.confirmImport', { count: selectedRefs.length })}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
