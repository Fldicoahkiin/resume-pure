'use client';

import { ChevronDown, ChevronUp, Plus, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { customItemAnchor } from '@/lib/previewAnchor';
import { createEntityId } from '@/lib/id';
import { useResumeStore } from '@/store/resumeStore';
import { CustomSectionItem } from '@/types';
import { BulletListTextarea } from './BulletListTextarea';

interface CustomSectionItemsEditorProps {
  sectionId: string;
  embedded?: boolean;
}

function createEmptyCustomItem(): CustomSectionItem {
  return {
    id: createEntityId('custom-item'),
    title: '',
    subtitle: '',
    date: '',
    description: [''],
    url: '',
    repoUrl: '',
    repoAvatarUrl: '',
    repoStars: undefined,
    showStars: true,
    showLogo: true,
    showBulletPoints: true,
  };
}

export function CustomSectionItemsEditor({
  sectionId,
  embedded = false,
}: CustomSectionItemsEditorProps) {
  const { t } = useTranslation();
  const store = useResumeStore();
  const { resume, hasHydrated } = store;

  const items =
    (resume.customSections.find((section) => section.id === sectionId)?.items as CustomSectionItem[] | undefined) || [];

  const addItem = () => {
    store.addCustomSectionItem(sectionId, createEmptyCustomItem());
  };

  const updateItem = (itemId: string, patch: Partial<CustomSectionItem>) => {
    store.updateCustomSectionItem(sectionId, itemId, patch);
  };

  const deleteItem = (itemId: string) => {
    store.deleteCustomSectionItem(sectionId, itemId);
  };

  const moveItem = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= items.length || toIndex === fromIndex) {
      return;
    }

    const nextItems = [...items];
    const [movedItem] = nextItems.splice(fromIndex, 1);
    nextItems.splice(toIndex, 0, movedItem);
    store.reorderCustomSectionItems(sectionId, nextItems);
  };

  if (!hasHydrated) {
    return (
      <div className={embedded ? 'animate-pulse' : 'rounded-lg bg-white p-6 shadow animate-pulse dark:bg-gray-800'}>
        <div className="mb-4 h-6 w-1/4 rounded bg-gray-200 dark:bg-gray-700" />
        <div className="h-32 rounded bg-gray-200 dark:bg-gray-700" />
      </div>
    );
  }

  const content = (
    <>
      {items.length === 0 ? (
        <div className="py-8 text-center text-gray-500 dark:text-gray-400">
          <p className="text-sm">{t('editor.customSection.noItems')}</p>
          <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">{t('editor.customSection.addHint')}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((item, index) => (
            <div
              key={item.id}
              data-editor-anchor={customItemAnchor(sectionId, item.id)}
              className="rounded-2xl border border-gray-200 bg-gray-50/70 p-4 shadow-sm dark:border-gray-700 dark:bg-gray-900/30"
            >
              <div className="mb-3 flex items-center justify-between gap-2">
                <div className="min-w-0 flex-1 text-sm font-medium text-gray-900 dark:text-white truncate">
                  {item.title || t('editor.customSection.newSectionTitle')}
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => moveItem(index, index - 1)}
                    disabled={index === 0}
                    className="rounded p-1 text-gray-400 transition hover:text-gray-700 disabled:cursor-not-allowed disabled:opacity-40 dark:hover:text-gray-200"
                    title={t('editor.actions.moveUp')}
                  >
                    <ChevronUp size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveItem(index, index + 1)}
                    disabled={index === items.length - 1}
                    className="rounded p-1 text-gray-400 transition hover:text-gray-700 disabled:cursor-not-allowed disabled:opacity-40 dark:hover:text-gray-200"
                    title={t('editor.actions.moveDown')}
                  >
                    <ChevronDown size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteItem(item.id)}
                    className="rounded p-1 text-gray-400 transition hover:text-red-500"
                    title={t('editor.customSection.deleteTitle')}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 md:col-span-2">
                  {t('editor.customSection.itemTitle')}
                  <input
                    type="text"
                    value={item.title || ''}
                    onChange={(event) => updateItem(item.id, { title: event.target.value })}
                    className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-base font-normal text-gray-900 shadow-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  />
                </label>

                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t('editor.customSection.subtitle')}
                  <input
                    type="text"
                    value={item.subtitle || ''}
                    onChange={(event) => updateItem(item.id, { subtitle: event.target.value })}
                    className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-base font-normal text-gray-900 shadow-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  />
                </label>

                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t('editor.customSection.date')}
                  <input
                    type="text"
                    value={item.date || ''}
                    onChange={(event) => updateItem(item.id, { date: event.target.value })}
                    className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-base font-normal text-gray-900 shadow-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  />
                </label>

                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t('editor.customSection.url')}
                  <input
                    type="text"
                    value={item.url || ''}
                    onChange={(event) => updateItem(item.id, { url: event.target.value })}
                    className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-base font-normal text-gray-900 shadow-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    placeholder={t('editor.customSection.urlPlaceholder')}
                  />
                </label>

                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t('editor.customSection.repoUrl')}
                  <input
                    type="text"
                    value={item.repoUrl || ''}
                    onChange={(event) => updateItem(item.id, { repoUrl: event.target.value })}
                    className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-base font-normal text-gray-900 shadow-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    placeholder={t('editor.customSection.repoPlaceholder')}
                  />
                </label>

                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t('editor.customSection.logoUrl')}
                  <input
                    type="text"
                    value={item.repoAvatarUrl || ''}
                    onChange={(event) => updateItem(item.id, { repoAvatarUrl: event.target.value })}
                    className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-base font-normal text-gray-900 shadow-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    placeholder={t('editor.customSection.logoPlaceholder')}
                  />
                </label>

                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t('editor.customSection.repoStars')}
                  <input
                    type="number"
                    min="0"
                    value={item.repoStars ?? ''}
                    onChange={(event) => {
                      const nextValue = event.target.value.trim();
                      const nextNumber = Number.parseFloat(nextValue);
                      updateItem(item.id, {
                        repoStars:
                          nextValue === '' || Number.isNaN(nextNumber) ? undefined : nextNumber,
                      });
                    }}
                    className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-base font-normal text-gray-900 shadow-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  />
                </label>

                <div className="md:col-span-2 flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => updateItem(item.id, { showLogo: item.showLogo === false })}
                    className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                      item.showLogo !== false
                        ? 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-500/40 dark:bg-blue-500/10 dark:text-blue-200'
                        : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:text-white'
                    }`}
                  >
                    {item.showLogo !== false ? t('editor.customSection.showLogo') : t('editor.customSection.hideLogo')}
                  </button>

                  <button
                    type="button"
                    onClick={() => updateItem(item.id, { showStars: item.showStars === false })}
                    className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                      item.showStars !== false
                        ? 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-500/40 dark:bg-blue-500/10 dark:text-blue-200'
                        : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:text-white'
                    }`}
                  >
                    {item.showStars !== false ? t('editor.customSection.showStars') : t('editor.customSection.hideStars')}
                  </button>
                </div>

                <BulletListTextarea
                  className="md:col-span-2"
                  label={t('editor.customSection.description')}
                  value={item.description}
                  showBulletPoints={item.showBulletPoints !== false}
                  onChange={(nextValue) => updateItem(item.id, { description: nextValue })}
                  onToggleShowBulletPoints={(nextValue) => updateItem(item.id, { showBulletPoints: nextValue })}
                  showBulletPointsLabel={t('editor.customSection.showBulletPoints')}
                  hideBulletPointsLabel={t('editor.customSection.hideBulletPoints')}
                  placeholder={t('editor.customSection.descriptionPlaceholder')}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-4 flex justify-end">
        <button
          type="button"
          onClick={addItem}
          className="flex items-center gap-1 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
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
    <section className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
      <div className="mb-4 flex items-center gap-2">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{t('editor.customSection.title')}</h2>
      </div>
      {content}
    </section>
  );
}
