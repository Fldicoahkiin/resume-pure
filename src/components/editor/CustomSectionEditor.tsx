'use client';

import { useState, useCallback } from 'react';
import { useResumeStore } from '@/store/resumeStore';
import { CustomSectionItem } from '@/types';
import { Plus, Trash2, FileText, Github, RefreshCw, Eye, EyeOff, Star } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { customItemAnchor } from '@/lib/previewAnchor';
import { createEntityId } from '@/lib/id';
import { fetchGitHubRepoMeta } from '@/lib/githubRepo';
import { LogoBadge } from '@/components/LogoBadge';
import { BulletListTextarea } from './BulletListTextarea';

type SyncState = 'idle' | 'loading' | 'success' | 'error';

interface RepoStatus {
  state: SyncState;
  message?: string;
  syncedUrl?: string;
}

interface CustomSectionEditorProps {
  sectionId: string;
  embedded?: boolean;
}

export function CustomSectionEditor({ sectionId, embedded = false }: CustomSectionEditorProps) {
  const { t } = useTranslation();
  const {
    resume,
    hasHydrated,
    addCustomSectionItem,
    updateCustomSectionItem,
    deleteCustomSectionItem,
  } = useResumeStore();

  const [repoStatusMap, setRepoStatusMap] = useState<Record<string, RepoStatus>>({});

  const customSection = resume.customSections.find((s) => s.id === sectionId);

  const handleSyncRepo = useCallback(async (item: CustomSectionItem) => {
    const repoUrl = item.repoUrl?.trim();
    if (!repoUrl) {
      setRepoStatusMap((prev) => ({
        ...prev,
        [item.id]: { state: 'error', message: t('editor.customSection.repoMissing') },
      }));
      return;
    }

    const current = repoStatusMap[item.id];
    if (current?.syncedUrl === repoUrl && current?.state === 'success') return;

    setRepoStatusMap((prev) => ({
      ...prev,
      [item.id]: { state: 'loading', message: t('editor.customSection.repoSyncing') },
    }));

    try {
      const meta = await fetchGitHubRepoMeta(repoUrl);
      updateCustomSectionItem(sectionId, item.id, {
        repoUrl: meta.normalizedUrl,
        repoStars: meta.stars,
        repoAvatarUrl: meta.avatarUrl,
      });
      setRepoStatusMap((prev) => ({
        ...prev,
        [item.id]: {
          state: 'success',
          message: t('editor.customSection.repoSynced', { stars: meta.stars }),
          syncedUrl: meta.normalizedUrl,
        },
      }));
    } catch {
      setRepoStatusMap((prev) => ({
        ...prev,
        [item.id]: { state: 'error', message: t('editor.customSection.repoSyncFailed') },
      }));
    }
  }, [repoStatusMap, sectionId, t, updateCustomSectionItem]);

  if (!hasHydrated) {
    return (
      <div className={embedded ? 'animate-pulse' : 'rounded-lg bg-white dark:bg-gray-800 p-6 shadow animate-pulse'}>
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4"></div>
        <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
      </div>
    );
  }

  const handleAdd = () => {
    const newItem: CustomSectionItem = {
      id: createEntityId('custom-item'),
      title: '',
      subtitle: '',
      date: '',
      description: [''],
      showBulletPoints: false,
    };
    addCustomSectionItem(sectionId, newItem);
  };

  const content = (
    <>
      {!customSection || customSection.items.length === 0 ? (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <FileText className="h-12 w-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
          <p className="text-sm">{t('editor.customSection.noItems')}</p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{t('editor.customSection.addHint')}</p>
        </div>
      ) : (
        customSection.items.map((item, idx) => {
          const repoStatus = repoStatusMap[item.id];
          const logoSrc = item.repoAvatarUrl;

          return (
            <div key={item.id} data-editor-anchor={customItemAnchor(sectionId, item.id)}>
              {idx !== 0 && <div className="my-4 border-t-2 border-dotted border-gray-200 dark:border-gray-600" />}

              <div className="relative space-y-3">
                <button
                  onClick={() => deleteCustomSectionItem(sectionId, item.id)}
                  className="absolute right-0 top-0 p-1 text-gray-400 hover:text-red-500"
                  title={t('editor.customSection.deleteTitle')}
                >
                  <Trash2 size={16} />
                </button>

                {/* 标题 + 日期 */}
                <div className="grid grid-cols-6 gap-3 pr-8">
                  <label className="col-span-4 text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t('editor.customSection.itemTitle')}
                    <input
                      type="text"
                      value={item.title || ''}
                      onChange={(e) => updateCustomSectionItem(sectionId, item.id, { title: e.target.value })}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-base font-normal bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </label>

                  <label className="col-span-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t('editor.customSection.date')}
                    <input
                      type="text"
                      value={item.date || ''}
                      onChange={(e) => updateCustomSectionItem(sectionId, item.id, { date: e.target.value })}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-base font-normal bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </label>
                </div>

                {/* 副标题 */}
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t('editor.customSection.subtitle')}
                  <input
                    type="text"
                    value={item.subtitle || ''}
                    onChange={(e) => updateCustomSectionItem(sectionId, item.id, { subtitle: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-base font-normal bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </label>

                {/* GitHub 仓库 + 同步 */}
                <div className="rounded-xl border border-gray-200 bg-gray-50/50 p-3 dark:border-gray-700 dark:bg-gray-800/40 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                      <Github size={14} />
                      {t('editor.customSection.repoUrl')}
                    </div>
                    <div className="flex items-center gap-2">
                      {/* Star 开关 */}
                      <button
                        type="button"
                        onClick={() => updateCustomSectionItem(sectionId, item.id, { showStars: item.showStars === false ? true : false })}
                        className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium transition ${
                          item.showStars !== false
                            ? 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-400'
                            : 'border-gray-200 text-gray-400 dark:border-gray-600'
                        }`}
                      >
                        {item.showStars !== false ? <Star size={10} /> : <Star size={10} />}
                        {item.showStars !== false ? t('editor.customSection.showStars') : t('editor.customSection.hideStars')}
                      </button>
                      {/* Logo 开关 */}
                      <button
                        type="button"
                        onClick={() => updateCustomSectionItem(sectionId, item.id, { showLogo: item.showLogo === false ? true : false })}
                        className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium transition ${
                          item.showLogo !== false
                            ? 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-400'
                            : 'border-gray-200 text-gray-400 dark:border-gray-600'
                        }`}
                      >
                        {item.showLogo !== false ? <Eye size={10} /> : <EyeOff size={10} />}
                        {item.showLogo !== false ? t('editor.customSection.showLogo') : t('editor.customSection.hideLogo')}
                      </button>
                      {/* 同步按钮 */}
                      <button
                        type="button"
                        onClick={() => void handleSyncRepo(item)}
                        disabled={repoStatus?.state === 'loading'}
                        className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-white px-2.5 py-0.5 text-xs font-medium text-gray-600 transition hover:border-gray-300 hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200"
                      >
                        <RefreshCw size={10} className={repoStatus?.state === 'loading' ? 'animate-spin' : ''} />
                        {t('editor.customSection.syncRepo')}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {item.showLogo !== false && logoSrc && (
                      <LogoBadge src={logoSrc} alt={item.title || ''} label={item.title || ''} size={28} variant="round" />
                    )}
                    <input
                      type="text"
                      value={item.repoUrl || ''}
                      onChange={(e) => updateCustomSectionItem(sectionId, item.id, { repoUrl: e.target.value })}
                      onBlur={() => { if (item.repoUrl?.trim()) void handleSyncRepo(item); }}
                      className="flex-1 px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder={t('editor.customSection.repoPlaceholder')}
                    />
                  </div>

                  {repoStatus?.message && (
                    <div className={`flex items-center gap-1.5 text-xs ${
                      repoStatus.state === 'success' ? 'text-green-600 dark:text-green-400'
                      : repoStatus.state === 'error' ? 'text-red-500 dark:text-red-400'
                      : 'text-gray-500 dark:text-gray-400'
                    }`}>
                      <Github size={11} />
                      {repoStatus.message}
                    </div>
                  )}
                </div>

                {/* URL */}
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t('editor.customSection.url')}
                  <input
                    type="text"
                    value={item.url || ''}
                    onChange={(e) => updateCustomSectionItem(sectionId, item.id, { url: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-base font-normal bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder={t('editor.customSection.urlPlaceholder')}
                  />
                </label>

                {/* 描述 */}
                <BulletListTextarea
                  label={t('editor.customSection.description')}
                  value={item.description}
                  showBulletPoints={item.showBulletPoints !== false}
                  onChange={(nextValue) => updateCustomSectionItem(sectionId, item.id, { description: nextValue })}
                  onToggleShowBulletPoints={(nextValue) => updateCustomSectionItem(sectionId, item.id, { showBulletPoints: nextValue })}
                  showBulletPointsLabel={t('editor.customSection.showBulletPoints')}
                  hideBulletPointsLabel={t('editor.customSection.hideBulletPoints')}
                  placeholder={t('editor.customSection.descriptionPlaceholder')}
                />
              </div>
            </div>
          );
        })
      )}

      <div className="mt-4 flex justify-end">
        <button
          onClick={handleAdd}
          className="flex items-center gap-1 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm hover:bg-gray-50 dark:hover:bg-gray-600"
        >
          <Plus size={16} />
          {t('editor.customSection.addItem')}
        </button>
      </div>
    </>
  );

  if (embedded) {
    return content;
  }

  return (
    <section className="rounded-lg bg-white dark:bg-gray-800 p-6 shadow">
      <div className="flex items-center gap-2 mb-4">
        <FileText className="h-5 w-5 text-gray-600 dark:text-gray-400" />
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          {resume.sections.find((s) => s.id === sectionId)?.title || t('editor.customSection.title')}
        </h2>
      </div>
      {content}
    </section>
  );
}
