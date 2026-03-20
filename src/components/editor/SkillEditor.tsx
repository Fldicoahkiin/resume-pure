'use client';

import { ChangeEvent, useState } from 'react';
import NextImage from 'next/image';
import { useTranslation } from 'react-i18next';
import { Eye, EyeOff, Image as ImageIcon, Plus, Trash2, Wrench, Settings2 } from 'lucide-react';
import { readImageFileAsDataUrl } from '@/lib/image';
import { createEntityId } from '@/lib/id';
import { skillAnchor, skillItemAnchor } from '@/lib/previewAnchor';
import { resolveSkillLogo } from '@/lib/skillLogo';
import { useResumeStore } from '@/store/resumeStore';
import { Skill, SkillItem } from '@/types';
import { DraggableItem } from './DraggableItem';

interface SkillEditorProps {
  embedded?: boolean;
  sectionId?: string;
}

function createEmptySkillItem(): SkillItem {
  return {
    id: createEntityId('skill-item'),
    name: '',
    level: 'core',
    context: '',
    logo: '',
    showLogo: true,
    showContext: true,
  };
}

function createEmptySkill(): Skill {
  return {
    id: createEntityId('skill'),
    category: '',
    items: [createEmptySkillItem()],
    tags: [],
  };
}

export function SkillEditor({ embedded = false, sectionId }: SkillEditorProps) {
  const { t } = useTranslation();
  const store = useResumeStore();
  const { resume, hasHydrated } = store;

  const skills = sectionId
    ? (resume.customSections.find((s) => s.id === sectionId)?.items as Skill[] || [])
    : resume.skills;

  const addSkill = sectionId
    ? (skill: Skill) => store.addCustomSectionItem(sectionId, skill)
    : store.addSkill;

  const updateSkill = sectionId
    ? (id: string, skill: Partial<Skill>) => store.updateCustomSectionItem(sectionId, id, skill)
    : store.updateSkill;

  const deleteSkill = sectionId
    ? (id: string) => store.deleteCustomSectionItem(sectionId, id)
    : store.deleteSkill;

  const reorderSkills = sectionId
    ? (items: Skill[]) => store.reorderCustomSectionItems(sectionId, items)
    : store.reorderSkills;
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);

  if (!hasHydrated) {
    return (
      <div className={embedded ? 'animate-pulse' : 'rounded-lg bg-white p-6 shadow animate-pulse dark:bg-gray-800'}>
        <div className="mb-4 h-6 w-1/4 rounded bg-gray-200 dark:bg-gray-700" />
        <div className="h-32 rounded bg-gray-200 dark:bg-gray-700" />
      </div>
    );
  }

  const handleAdd = () => {
    addSkill({ ...createEmptySkill(), visible: true });
  };

  const updateSkillItem = (skill: Skill, itemId: string, patch: Partial<SkillItem>) => {
    updateSkill(skill.id, {
      items: skill.items.map((item) => (
        item.id === itemId ? { ...item, ...patch } : item
      )),
    });
  };

  const addSkillItem = (skill: Skill) => {
    updateSkill(skill.id, {
      items: [...skill.items, createEmptySkillItem()],
    });
  };

  const deleteSkillItem = (skill: Skill, itemId: string) => {
    updateSkill(skill.id, {
      items: skill.items.filter((item) => item.id !== itemId),
    });
  };

  const handleDragStart = (idx: number) => {
    setDraggedIdx(idx);
  };

  const handleDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    if (draggedIdx === null || draggedIdx === idx) return;
    const items = [...skills];
    const [removed] = items.splice(draggedIdx, 1);
    items.splice(idx, 0, removed);
    reorderSkills(items);
    setDraggedIdx(idx);
  };

  const handleDragEnd = () => {
    setDraggedIdx(null);
  };

  const content = (
    <>
      {skills.length === 0 ? (
        <div className="py-8 text-center text-gray-500 dark:text-gray-400">
          <Wrench className="mx-auto mb-3 h-12 w-12 text-gray-300 dark:text-gray-600" />
          <p className="text-sm">{t('editor.skills.noSkills')}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {skills.map((skill, idx) => (
            <DraggableItem
              key={skill.id}
              id={skill.id}
              title={skill.category || t('editor.skills.categoryPlaceholder')}
              visible={skill.visible !== false}
              onToggleVisible={() => updateSkill(skill.id, { visible: skill.visible === false })}
              onDragStart={() => handleDragStart(idx)}
              onDragOver={(e) => handleDragOver(e, idx)}
              onDragEnd={handleDragEnd}
              isDragging={draggedIdx === idx}
              headerActions={
                <button
                  type="button"
                  onClick={() => deleteSkill(skill.id)}
                  className="p-1 rounded text-gray-400 hover:text-red-500 transition"
                  title={t('editor.skills.deleteCategory')}
                >
                  <Trash2 size={16} />
                </button>
              }
              initialCollapsed
            >
              <SkillCard
                skill={skill}
                updateSkill={updateSkill}
                addSkillItem={addSkillItem}
                updateSkillItem={updateSkillItem}
                deleteSkillItem={deleteSkillItem}
                t={t}
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
          {t('editor.skills.addSkill')}
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
        <Wrench className="text-blue-500" size={20} />
        <h2 className="text-lg font-bold text-gray-900 dark:text-white">{t('editor.skills.title')}</h2>
      </div>
      {content}
    </section>
  );
}

function SkillCard({
  skill,
  updateSkill,
  addSkillItem,
  updateSkillItem,
  deleteSkillItem,
  t,
}: {
  skill: Skill;
  updateSkill: (id: string, patch: Partial<Skill>) => void;
  addSkillItem: (skill: Skill) => void;
  updateSkillItem: (skill: Skill, itemId: string, patch: Partial<SkillItem>) => void;
  deleteSkillItem: (skill: Skill, itemId: string) => void;
  t: (key: string, options?: Record<string, unknown>) => string;
}) {
  return (
    <div data-editor-anchor={skillAnchor(skill.id)}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex-1 min-w-[220px]">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider dark:text-gray-400 mb-1 block">
            {t('editor.skills.category')}
          </label>
          <input
            type="text"
            value={skill.category}
            onChange={(e) => updateSkill(skill.id, { category: e.target.value })}
            className="block w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-base font-medium text-gray-900 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            placeholder={t('editor.skills.categoryPlaceholder')}
          />
        </div>
        <div className="flex gap-2 self-end">
          <button
            type="button"
            onClick={() => addSkillItem(skill)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-600 transition hover:border-gray-300 hover:text-blue-600 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:text-blue-400"
          >
            <Plus size={16} />
            {t('editor.skills.addItem')}
          </button>
        </div>
      </div>

      <div className="mb-4">
        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider dark:text-gray-400 mb-1 block">
          {t('editor.skills.tags')}
        </label>
        <input
          type="text"
          value={(skill.tags || []).join(', ')}
          onChange={(e) => {
            const tags = e.target.value.split(',').map(s => s.trim()).filter(Boolean);
            updateSkill(skill.id, { tags });
          }}
          className="block w-full rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-600 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300"
          placeholder={t('editor.skills.tagsPlaceholder')}
        />
      </div>

      {skill.items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-200 px-3 py-4 text-center text-xs text-gray-400 dark:border-gray-600 dark:text-gray-500">
          {t('editor.skills.noItems')}
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {skill.items.map((item) => (
            <SkillItemRow
              key={item.id}
              skill={skill}
              item={item}
              updateSkillItem={updateSkillItem}
              deleteSkillItem={deleteSkillItem}
              t={t}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function SkillItemRow({
  skill,
  item,
  updateSkillItem,
  deleteSkillItem,
  t,
}: {
  skill: Skill;
  item: SkillItem;
  updateSkillItem: (skill: Skill, itemId: string, patch: Partial<SkillItem>) => void;
  deleteSkillItem: (skill: Skill, itemId: string) => void;
  t: (key: string, options?: Record<string, unknown>) => string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const resolvedLogo = resolveSkillLogo(item.name);

  const handleLogoUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await readImageFileAsDataUrl(file);
      updateSkillItem(skill, item.id, { logo: dataUrl });
    } catch (error) {
      console.error(error);
    } finally {
      event.target.value = '';
    }
  };

  return (
    <div
      data-editor-anchor={skillItemAnchor(skill.id, item.id)}
      className="group flex flex-col gap-2 rounded-xl bg-white p-2 shadow-sm border border-gray-100 transition focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-300 dark:bg-gray-800 dark:border-gray-700 dark:focus-within:border-blue-500/50"
    >
      <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gray-50 dark:bg-gray-700/50 ${item.showLogo === false ? 'opacity-50' : ''}`}>
          {item.logo ? (
            <NextImage src={item.logo} alt="" width={20} height={20} unoptimized className="h-5 w-5 object-contain" />
          ) : resolvedLogo ? (
            <svg viewBox="0 0 24 24" fill={resolvedLogo.color} className="h-4 w-4">
              <path d={resolvedLogo.svgPath} />
            </svg>
          ) : (
            <Wrench className="h-3.5 w-3.5 text-gray-300 dark:text-gray-500" />
          )}
        </div>
        <input
          type="text"
          value={item.name}
          onChange={(e) => updateSkillItem(skill, item.id, { name: e.target.value })}
          className="w-28 sm:w-32 shrink-0 outline-none border-transparent bg-transparent px-2 py-1 text-sm font-medium text-gray-900 placeholder:font-normal placeholder:text-gray-400 focus:border-transparent focus:ring-0 dark:text-gray-100 dark:placeholder:text-gray-600"
          placeholder={t('editor.skills.itemNamePlaceholder')}
        />
        <input
          type="text"
          value={item.context || ''}
          onChange={(e) => updateSkillItem(skill, item.id, { context: e.target.value })}
          className={`min-w-[100px] flex-1 outline-none border-transparent bg-transparent px-2 py-1 text-sm text-gray-500 focus:border-transparent focus:ring-0 dark:text-gray-400 ${item.showContext === false ? 'line-through opacity-50' : ''}`}
          placeholder={t('editor.skills.contextPlaceholder')}
        />
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`shrink-0 p-1.5 transition sm:opacity-0 group-hover:opacity-100 focus:opacity-100 ${isOpen ? 'text-blue-500 sm:opacity-100' : 'text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}
          title="高级设置"
        >
          <Settings2 size={16} />
        </button>
        <button
          type="button"
          onClick={() => deleteSkillItem(skill, item.id)}
          className="shrink-0 p-1.5 text-gray-400 opacity-100 transition hover:text-red-500 sm:opacity-0 group-hover:opacity-100 focus:opacity-100"
          title={t('editor.skills.deleteItem')}
        >
          <Trash2 size={16} />
        </button>
      </div>
      {isOpen && (
        <div className="flex flex-wrap items-center gap-3 border-t border-gray-100 pt-2 pl-10 dark:border-gray-700">
          <label className="inline-flex cursor-pointer items-center gap-1.5 rounded bg-gray-50 px-2 py-1 text-xs font-medium text-gray-600 transition hover:bg-gray-100 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600">
            <ImageIcon size={12} />
            {t('editor.skills.uploadLogo')}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(event) => void handleLogoUpload(event)}
            />
          </label>
          {item.logo && (
            <button
              type="button"
              onClick={() => updateSkillItem(skill, item.id, { logo: '' })}
              className="text-xs text-red-500 hover:underline"
            >
              {t('editor.skills.clearLogo')}
            </button>
          )}
          <div className="h-3 w-px bg-gray-200 dark:bg-gray-600"></div>
          <button
            type="button"
            onClick={() => updateSkillItem(skill, item.id, { showLogo: item.showLogo === false })}
            className={`flex items-center gap-1 text-xs font-medium ${item.showLogo !== false ? 'text-blue-600' : 'text-gray-400'}`}
          >
            {item.showLogo !== false ? <Eye size={12} /> : <EyeOff size={12} />}
            Logo: {item.showLogo !== false ? '显示' : '隐藏'}
          </button>
          <button
            type="button"
            onClick={() => updateSkillItem(skill, item.id, { showContext: item.showContext === false })}
            className={`flex items-center gap-1 text-xs font-medium ${item.showContext !== false ? 'text-blue-600' : 'text-gray-400'}`}
          >
            {item.showContext !== false ? <Eye size={12} /> : <EyeOff size={12} />}
            描述: {item.showContext !== false ? '显示' : '隐藏'}
          </button>
        </div>
      )}
    </div>
  );
}
