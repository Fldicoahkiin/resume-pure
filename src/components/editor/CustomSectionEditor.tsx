'use client';

import { useResumeStore } from '@/store/resumeStore';
import { CustomSectionItem } from '@/types';
import { Plus, Trash2, FileText } from 'lucide-react';
import { useTranslation } from 'react-i18next';

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

  const customSection = resume.customSections.find((s) => s.id === sectionId);

  if (!hasHydrated) {
    return (
      <div className={embedded ? "animate-pulse" : "rounded-lg bg-white dark:bg-gray-800 p-6 shadow animate-pulse"}>
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4"></div>
        <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
      </div>
    );
  }

  const handleAdd = () => {
    const newItem: CustomSectionItem = {
      id: Date.now().toString(),
      title: '',
      subtitle: '',
      date: '',
      description: [''],
    };
    addCustomSectionItem(sectionId, newItem);
  };

  const handleUpdateDescription = (itemId: string, index: number, value: string) => {
    const item = customSection?.items.find((i) => i.id === itemId);
    if (item) {
      const newDesc = [...item.description];
      newDesc[index] = value;
      updateCustomSectionItem(sectionId, itemId, { description: newDesc });
    }
  };

  const handleAddDescription = (itemId: string) => {
    const item = customSection?.items.find((i) => i.id === itemId);
    if (item) {
      updateCustomSectionItem(sectionId, itemId, {
        description: [...item.description, ''],
      });
    }
  };

  const handleRemoveDescription = (itemId: string, index: number) => {
    const item = customSection?.items.find((i) => i.id === itemId);
    if (item && item.description.length > 1) {
      const newDesc = item.description.filter((_, i) => i !== index);
      updateCustomSectionItem(sectionId, itemId, { description: newDesc });
    }
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
        customSection.items.map((item, idx) => (
          <div key={item.id}>
            {idx !== 0 && <div className="my-4 border-t-2 border-dotted border-gray-200 dark:border-gray-600" />}

            <div className="relative grid grid-cols-6 gap-3">
              <button
                onClick={() => deleteCustomSectionItem(sectionId, item.id)}
                className="absolute right-0 top-0 p-1 text-gray-400 hover:text-red-500"
                title={t('editor.customSection.deleteTitle')}
              >
                <Trash2 size={16} />
              </button>

              <label className="col-span-4 text-sm font-medium text-gray-700 dark:text-gray-300">
                {t('editor.customSection.itemTitle')}
                <input
                  type="text"
                  value={item.title || ''}
                  onChange={(e) => updateCustomSectionItem(sectionId, item.id, { title: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-base font-normal bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder=""
                />
              </label>

              <label className="col-span-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                {t('editor.customSection.date')}
                <input
                  type="text"
                  value={item.date || ''}
                  onChange={(e) => updateCustomSectionItem(sectionId, item.id, { date: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-base font-normal bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder=""
                />
              </label>

              <label className="col-span-full text-sm font-medium text-gray-700 dark:text-gray-300">
                {t('editor.customSection.subtitle')}
                <input
                  type="text"
                  value={item.subtitle || ''}
                  onChange={(e) => updateCustomSectionItem(sectionId, item.id, { subtitle: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-base font-normal bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder=""
                />
              </label>

              <div className="col-span-full text-sm font-medium text-gray-700 dark:text-gray-300">
                {t('editor.customSection.description')}
                <div className="mt-1 space-y-2">
                  {item.description.map((desc, descIdx) => (
                    <div key={descIdx} className="flex gap-2">
                      <span className="mt-2.5 text-gray-400">•</span>
                      <input
                        type="text"
                        value={desc}
                        onChange={(e) => handleUpdateDescription(item.id, descIdx, e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-base font-normal bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        placeholder=""
                      />
                      {item.description.length > 1 && (
                        <button
                          onClick={() => handleRemoveDescription(item.id, descIdx)}
                          className="p-2 text-gray-400 hover:text-red-500"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    onClick={() => handleAddDescription(item.id)}
                    className="text-sm text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                  >
                    {t('editor.customSection.addDescription')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))
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
