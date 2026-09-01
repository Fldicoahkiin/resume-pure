'use client';

import { ChevronDown, ChevronUp, Plus, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { createEntityId } from '@/lib/id';
import { customItemAnchor } from '@/lib/previewAnchor';
import { useResumeStore } from '@/store/resumeStore';
import type { CustomSectionItem } from '@/types';
import { BulletListTextarea } from './BulletListTextarea';

type AgentSkillEditorProps = {
  sectionId: string;
  embedded?: boolean;
};

function createAgentSkillItem(): CustomSectionItem {
  return {
    id: createEntityId('agent-skill'),
    title: '',
    subtitle: '',
    description: [''],
    url: '',
    repoUrl: '',
    showBulletPoints: false,
    showLogo: false,
    showStars: false,
  };
}

export function AgentSkillEditor({ sectionId, embedded = false }: AgentSkillEditorProps) {
  const { t } = useTranslation();
  const store = useResumeStore();
  const items = (
    store.resume.customSections.find((section) => section.id === sectionId)?.items as CustomSectionItem[] | undefined
  ) || [];

  const moveItem = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= items.length || fromIndex === toIndex) return;
    const nextItems = [...items];
    const [item] = nextItems.splice(fromIndex, 1);
    nextItems.splice(toIndex, 0, item);
    store.reorderCustomSectionItems(sectionId, nextItems);
  };

  if (!store.hasHydrated) {
    return <div className="h-32 animate-pulse rounded-md bg-gray-100 dark:bg-gray-800" />;
  }

  const content = (
    <>
      {items.length === 0 ? (
        <div className="py-8 text-center">
          <p className="text-sm text-gray-600 dark:text-gray-300">{t('editor.agentSkills.noItems')}</p>
          <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">{t('editor.agentSkills.addHint')}</p>
        </div>
      ) : (
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {items.map((item, index) => (
            <div
              key={item.id}
              data-editor-anchor={customItemAnchor(sectionId, item.id)}
              className="py-5 first:pt-0 last:pb-0"
            >
              <div className="mb-4 flex items-center gap-3">
                <p className="min-w-0 flex-1 truncate text-sm font-semibold text-gray-900 dark:text-white">
                  {item.title || t('editor.agentSkills.untitled')}
                </p>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => moveItem(index, index - 1)}
                    disabled={index === 0}
                    className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 disabled:cursor-not-allowed disabled:opacity-30 dark:hover:bg-gray-700 dark:hover:text-gray-200"
                    title={t('editor.actions.moveUp')}
                  >
                    <ChevronUp size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveItem(index, index + 1)}
                    disabled={index === items.length - 1}
                    className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 disabled:cursor-not-allowed disabled:opacity-30 dark:hover:bg-gray-700 dark:hover:text-gray-200"
                    title={t('editor.actions.moveDown')}
                  >
                    <ChevronDown size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => store.deleteCustomSectionItem(sectionId, item.id)}
                    className="rounded-md p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-300"
                    title={t('editor.agentSkills.delete')}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t('editor.agentSkills.name')}
                  <input
                    type="text"
                    value={item.title || ''}
                    onChange={(event) => store.updateCustomSectionItem(sectionId, item.id, { title: event.target.value })}
                    className="mt-1.5 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-base font-normal text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:focus:border-blue-400 dark:focus:ring-blue-500/20"
                  />
                </label>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t('editor.agentSkills.purpose')}
                  <input
                    type="text"
                    value={item.subtitle || ''}
                    onChange={(event) => store.updateCustomSectionItem(sectionId, item.id, { subtitle: event.target.value })}
                    className="mt-1.5 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-base font-normal text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:focus:border-blue-400 dark:focus:ring-blue-500/20"
                  />
                </label>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t('editor.agentSkills.repoUrl')}
                  <input
                    type="url"
                    value={item.repoUrl || ''}
                    onChange={(event) => store.updateCustomSectionItem(sectionId, item.id, { repoUrl: event.target.value })}
                    placeholder="https://github.com/owner/skill"
                    className="mt-1.5 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-base font-normal text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:focus:border-blue-400 dark:focus:ring-blue-500/20"
                  />
                </label>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t('editor.agentSkills.productUrl')}
                  <input
                    type="url"
                    value={item.url || ''}
                    onChange={(event) => store.updateCustomSectionItem(sectionId, item.id, { url: event.target.value })}
                    placeholder="https://example.com"
                    className="mt-1.5 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-base font-normal text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:focus:border-blue-400 dark:focus:ring-blue-500/20"
                  />
                </label>
                <BulletListTextarea
                  className="md:col-span-2"
                  label={t('editor.agentSkills.description')}
                  value={item.description}
                  showBulletPoints={item.showBulletPoints === true}
                  onChange={(description) => store.updateCustomSectionItem(sectionId, item.id, { description })}
                  onToggleShowBulletPoints={(showBulletPoints) => store.updateCustomSectionItem(sectionId, item.id, { showBulletPoints })}
                  showBulletPointsLabel={t('editor.customSection.showBulletPoints')}
                  hideBulletPointsLabel={t('editor.customSection.hideBulletPoints')}
                  placeholder={t('editor.agentSkills.descriptionPlaceholder')}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-5 flex justify-end">
        <button
          type="button"
          onClick={() => store.addCustomSectionItem(sectionId, createAgentSkillItem())}
          className="inline-flex min-h-9 items-center gap-2 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 dark:focus-visible:ring-offset-gray-800"
        >
          <Plus size={16} />
          {t('editor.agentSkills.add')}
        </button>
      </div>
    </>
  );

  if (embedded) return content;
  return <section className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">{content}</section>;
}
