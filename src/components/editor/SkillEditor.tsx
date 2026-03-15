'use client';

import { ChangeEvent, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Eye, EyeOff, Image as ImageIcon, Plus, Trash2, Wrench } from 'lucide-react';
import { LogoBadge } from '@/components/LogoBadge';
import { createEntityId } from '@/lib/id';
import { readImageFileAsDataUrl } from '@/lib/image';
import { skillAnchor, skillItemAnchor } from '@/lib/previewAnchor';
import { resolveSkillLogo } from '@/lib/skillLogo';
import { useResumeStore } from '@/store/resumeStore';
import { Skill, SkillItem, SkillLevel } from '@/types';

interface SkillEditorProps {
  embedded?: boolean;
}

const SKILL_LEVEL_OPTIONS: SkillLevel[] = ['core', 'proficient', 'familiar'];

function createEmptySkillItem(): SkillItem {
  return {
    id: createEntityId('skill-item'),
    name: '',
    level: 'proficient',
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
  };
}

function ToggleButton({
  active,
  activeLabel,
  inactiveLabel,
  onClick,
}: {
  active: boolean;
  activeLabel: string;
  inactiveLabel: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition ${
        active
          ? 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-500/40 dark:bg-blue-500/10 dark:text-blue-200'
          : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:text-white'
      }`}
      aria-pressed={active}
    >
      {active ? <Eye size={14} /> : <EyeOff size={14} />}
      {active ? activeLabel : inactiveLabel}
    </button>
  );
}

export function SkillEditor({ embedded = false }: SkillEditorProps) {
  const { t } = useTranslation();
  const { resume, hasHydrated, addSkill, updateSkill, deleteSkill } = useResumeStore();
  const [logoErrorMap, setLogoErrorMap] = useState<Record<string, string>>({});

  if (!hasHydrated) {
    return (
      <div className={embedded ? 'animate-pulse' : 'rounded-lg bg-white p-6 shadow animate-pulse dark:bg-gray-800'}>
        <div className="mb-4 h-6 w-1/4 rounded bg-gray-200 dark:bg-gray-700" />
        <div className="h-32 rounded bg-gray-200 dark:bg-gray-700" />
      </div>
    );
  }

  const handleAdd = () => {
    addSkill(createEmptySkill());
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

  const handleLogoUpload = async (skill: Skill, item: SkillItem, event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const errorKey = `${skill.id}:${item.id}`;

    try {
      const dataUrl = await readImageFileAsDataUrl(file);
      updateSkillItem(skill, item.id, { logo: dataUrl });
      setLogoErrorMap((current) => ({ ...current, [errorKey]: '' }));
    } catch (error) {
      const message = error instanceof Error && error.message === 'image-too-large'
        ? t('editor.skills.logoTooLarge')
        : t('editor.skills.logoUploadFailed');
      setLogoErrorMap((current) => ({ ...current, [errorKey]: message }));
    } finally {
      event.target.value = '';
    }
  };

  const content = (
    <>
      {resume.skills.length === 0 ? (
        <div className="py-6 text-center text-sm text-gray-400 dark:text-gray-500">
          {t('editor.skills.noSkills')}
        </div>
      ) : (
        <div className="space-y-4">
          {resume.skills.map((skill) => (
            <div
              key={skill.id}
              data-editor-anchor={skillAnchor(skill.id)}
              className="rounded-2xl border border-gray-200 bg-gray-50/70 p-4 shadow-sm dark:border-gray-700 dark:bg-gray-900/30"
            >
              <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                <div className="flex-1 min-w-[220px]">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t('editor.skills.category')}
                    <input
                      type="text"
                      value={skill.category}
                      onChange={(event) => updateSkill(skill.id, { category: event.target.value })}
                      className="mt-1 block w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-base font-normal text-gray-900 shadow-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                      placeholder={t('editor.skills.categoryPlaceholder')}
                    />
                  </label>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => addSkillItem(skill)}
                    className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 transition hover:border-gray-300 hover:text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200"
                  >
                    <Plus size={12} />
                    {t('editor.skills.addItem')}
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteSkill(skill.id)}
                    className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 transition hover:border-gray-300 hover:text-red-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200"
                    title={t('editor.skills.deleteCategory')}
                  >
                    <Trash2 size={12} />
                    {t('editor.skills.deleteCategory')}
                  </button>
                </div>
              </div>

              {skill.items.length === 0 ? (
                <div className="rounded-xl border border-dashed border-gray-200 px-3 py-4 text-center text-xs text-gray-400 dark:border-gray-600 dark:text-gray-500">
                  {t('editor.skills.noItems')}
                </div>
              ) : (
                <div className="space-y-3">
                  {skill.items.map((item, index) => {
                    const resolvedLogo = resolveSkillLogo(item.name);
                    const resolvedSvgUrl = resolvedLogo
                      ? `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${resolvedLogo.color}"><path d="${resolvedLogo.svgPath}"/></svg>`)}`
                      : undefined;
                    const previewLogo = item.logo || resolvedSvgUrl;
                    const errorKey = `${skill.id}:${item.id}`;

                    return (
                      <div
                        key={item.id}
                        data-editor-anchor={skillItemAnchor(skill.id, item.id)}
                        className="rounded-2xl border border-gray-200 bg-white p-3 dark:border-gray-600 dark:bg-gray-800/60"
                      >
                        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                          <p className="text-xs font-medium uppercase tracking-[0.12em] text-gray-500 dark:text-gray-400">
                            {t('editor.skills.itemLabel', { index: index + 1 })}
                          </p>
                          <div className="flex flex-wrap gap-2">
                            <ToggleButton
                              active={item.showLogo !== false}
                              activeLabel={t('editor.skills.showLogo')}
                              inactiveLabel={t('editor.skills.hideLogo')}
                              onClick={() => updateSkillItem(skill, item.id, { showLogo: item.showLogo === false })}
                            />
                            <ToggleButton
                              active={item.showContext !== false}
                              activeLabel={t('editor.skills.showContext')}
                              inactiveLabel={t('editor.skills.hideContext')}
                              onClick={() => updateSkillItem(skill, item.id, { showContext: item.showContext === false })}
                            />
                            <button
                              type="button"
                              onClick={() => deleteSkillItem(skill, item.id)}
                              className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 transition hover:border-gray-300 hover:text-red-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200"
                              title={t('editor.skills.deleteItem')}
                            >
                              <Trash2 size={12} />
                              {t('editor.skills.deleteItem')}
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[88px_minmax(0,1fr)]">
                          <div className="space-y-2">
                            <LogoBadge
                              src={previewLogo}
                              alt={item.name || t('editor.skills.logoTitle')}
                              label={item.name || t('editor.skills.logoTitle')}
                              size={68}
                              fit="contain"
                            />
                            <label className="inline-flex w-full cursor-pointer items-center justify-center gap-1 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 transition hover:border-gray-300 hover:text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200">
                              <ImageIcon size={12} />
                              {t('editor.skills.uploadLogo')}
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(event) => void handleLogoUpload(skill, item, event)}
                              />
                            </label>
                            <button
                              type="button"
                              onClick={() => updateSkillItem(skill, item.id, { logo: '' })}
                              className="inline-flex w-full items-center justify-center gap-1 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 transition hover:border-gray-300 hover:text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200"
                            >
                              <Trash2 size={12} />
                              {t('editor.skills.clearLogo')}
                            </button>
                          </div>

                          <div className="space-y-3">
                            <div className="grid grid-cols-1 gap-3 md:grid-cols-[minmax(0,1fr)_168px]">
                              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                {t('editor.skills.itemName')}
                                <input
                                  type="text"
                                  value={item.name}
                                  onChange={(event) => updateSkillItem(skill, item.id, { name: event.target.value })}
                                  className="mt-1 block w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-base font-normal text-gray-900 shadow-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                  placeholder={t('editor.skills.itemNamePlaceholder')}
                                />
                              </label>
                              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                {t('editor.skills.level')}
                                <select
                                  value={item.level}
                                  onChange={(event) => updateSkillItem(skill, item.id, { level: event.target.value as SkillLevel })}
                                  className="mt-1 block w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-base font-normal text-gray-900 shadow-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                >
                                  {SKILL_LEVEL_OPTIONS.map((level) => (
                                    <option key={level} value={level}>
                                      {t(`editor.skills.levelOptions.${level}`)}
                                    </option>
                                  ))}
                                </select>
                              </label>
                            </div>

                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                              {t('editor.skills.context')}
                              <input
                                type="text"
                                value={item.context || ''}
                                onChange={(event) => updateSkillItem(skill, item.id, { context: event.target.value })}
                                className="mt-1 block w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-base font-normal text-gray-900 shadow-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                placeholder={t('editor.skills.contextPlaceholder')}
                              />
                            </label>

                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                              {t('editor.skills.logoUrl')}
                              <input
                                type="text"
                                value={item.logo || ''}
                                onChange={(event) => updateSkillItem(skill, item.id, { logo: event.target.value })}
                                className="mt-1 block w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-base font-normal text-gray-900 shadow-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                placeholder={t('editor.skills.logoUrlPlaceholder')}
                              />
                              {errorKey in logoErrorMap && logoErrorMap[errorKey] && (
                                <p className="mt-2 text-xs text-red-500 dark:text-red-300">{logoErrorMap[errorKey]}</p>
                              )}
                              {!item.logo && resolvedLogo && (
                                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                                  {t('editor.skills.logoAutoHint')}
                                </p>
                              )}
                            </label>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
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
        <Wrench className="h-5 w-5 text-gray-600 dark:text-gray-400" />
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{t('editor.skills.title')}</h2>
      </div>
      {content}
    </section>
  );
}
