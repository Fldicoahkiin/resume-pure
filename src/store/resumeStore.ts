import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ResumeData, ThemeConfig, SectionConfig, Experience, Education, Project, Skill, ContactItem, ContactIconConfig, CustomSectionType, CustomSection } from '@/types';
import { createInitialResume, normalizeResumeData } from '@/lib/resumeData';
import { createEntityId } from '@/lib/id';

interface ResumeStore {
  resume: ResumeData;
  hasHydrated: boolean;
  updatePersonalInfo: (info: Partial<ResumeData['personalInfo']>) => void;
  updateIconConfig: (config: Partial<ContactIconConfig>) => void;
  updateTheme: (theme: Partial<ThemeConfig>) => void;
  updateSectionConfig: (sectionId: string, config: Partial<SectionConfig>) => void;
  reorderSections: (sections: SectionConfig[]) => void;
  addExperience: (exp: Experience) => void;
  updateExperience: (id: string, exp: Partial<Experience>) => void;
  deleteExperience: (id: string) => void;
  addEducation: (edu: Education) => void;
  updateEducation: (id: string, edu: Partial<Education>) => void;
  deleteEducation: (id: string) => void;
  addProject: (proj: Project) => void;
  updateProject: (id: string, proj: Partial<Project>) => void;
  deleteProject: (id: string) => void;
  reorderProjects: (projects: Project[]) => void;
  addSkill: (skill: Skill) => void;
  updateSkill: (id: string, skill: Partial<Skill>) => void;
  deleteSkill: (id: string) => void;
  reorderSkills: (skills: Skill[]) => void;
  // 联系方式相关
  addContact: (contact: ContactItem) => void;
  updateContact: (id: string, contact: Partial<ContactItem>) => void;
  deleteContact: (id: string) => void;
  reorderContacts: (contacts: ContactItem[]) => void;
  // 自定义模块相关
  addCustomSection: (title: string) => string;
  deleteCustomSection: (sectionId: string) => void;
  addCustomSectionItem: (sectionId: string, item: CustomSection['items'][number]) => void;
  updateCustomSectionItem: (sectionId: string, itemId: string, item: Partial<CustomSection['items'][number]>) => void;
  deleteCustomSectionItem: (sectionId: string, itemId: string) => void;
  updateCustomSection: (sectionId: string, update: Partial<{ type: CustomSectionType, items: CustomSection['items'] }>) => void;
  reorderCustomSectionItems: (sectionId: string, items: CustomSection['items']) => void;
  importData: (data: unknown) => void;
  reset: () => void;
  canUndo: boolean;
  canRedo: boolean;
  undo: () => void;
  redo: () => void;
}

const initialResume: ResumeData = createInitialResume();
/** 300ms 内的连续变更合并为一次撤销步（避免逐字符入栈） */
const HISTORY_GROUP_MS = 300;
const HISTORY_LIMIT = 100;

export const useResumeStore = create<ResumeStore>()(
  persist(
    (set, get) => {
      // past/future 走闭包（不持久化、不触发订阅）；canUndo/canRedo 暴露给 UI。
      const history = { past: [] as ResumeData[], future: [] as ResumeData[], last: 0 };

      // 包装 set：任何改变 resume 的 action 经此自动记录撤销点，无需逐个改写 action。
      const commit = (recipe: (state: ResumeStore) => Partial<ResumeStore>) => {
        const before = get().resume;
        set(recipe);
        const after = get().resume;
        if (after === before) {
          return;
        }

        const now = Date.now();
        if (now - history.last > HISTORY_GROUP_MS) {
          history.past.push(before);
          if (history.past.length > HISTORY_LIMIT) {
            history.past.shift();
          }
          history.future = [];
        }
        history.last = now;
        set({ canUndo: history.past.length > 0, canRedo: history.future.length > 0 });
      };

      return {
      resume: initialResume,
      hasHydrated: false,
      canUndo: false,
      canRedo: false,
      undo: () => {
        if (history.past.length === 0) {
          return;
        }
        history.future.unshift(get().resume);
        const previous = history.past.pop() as ResumeData;
        // 撤销后的下一次编辑必须新开检查点并清空 future，否则 300ms 分组窗口内的
        // 编辑会跳过入栈，redo 把内容跳回撤销前的旧状态
        history.last = 0;
        set({ resume: previous, canUndo: history.past.length > 0, canRedo: true });
      },
      redo: () => {
        if (history.future.length === 0) {
          return;
        }
        history.past.push(get().resume);
        const next = history.future.shift() as ResumeData;
        history.last = 0;
        set({ resume: next, canUndo: true, canRedo: history.future.length > 0 });
      },

      updatePersonalInfo: (info) =>
        commit((state) => ({
          resume: {
            ...state.resume,
            personalInfo: { ...state.resume.personalInfo, ...info },
          },
        })),

      updateIconConfig: (config) =>
        commit((state) => ({
          resume: {
            ...state.resume,
            personalInfo: {
              ...state.resume.personalInfo,
              iconConfig: { ...state.resume.personalInfo.iconConfig, ...config },
            },
          },
        })),

      updateTheme: (theme) =>
        commit((state) => ({
          resume: {
            ...state.resume,
            theme: { ...state.resume.theme, ...theme },
          },
        })),

      updateSectionConfig: (sectionId, config) =>
        commit((state) => ({
          resume: {
            ...state.resume,
            sections: state.resume.sections.map((section) =>
              section.id === sectionId ? { ...section, ...config } : section
            ),
          },
        })),

      reorderSections: (sections) =>
        commit((state) => ({
          resume: {
            ...state.resume,
            sections: sections.map((s, idx) => ({ ...s, order: idx + 1 })),
          },
        })),

      addExperience: (exp) =>
        commit((state) => ({
          resume: {
            ...state.resume,
            experience: [...state.resume.experience, exp],
          },
        })),

      updateExperience: (id, exp) =>
        commit((state) => ({
          resume: {
            ...state.resume,
            experience: state.resume.experience.map((item) =>
              item.id === id ? { ...item, ...exp } : item
            ),
          },
        })),

      deleteExperience: (id) =>
        commit((state) => ({
          resume: {
            ...state.resume,
            experience: state.resume.experience.filter((item) => item.id !== id),
          },
        })),

      addEducation: (edu) =>
        commit((state) => ({
          resume: {
            ...state.resume,
            education: [...state.resume.education, edu],
          },
        })),

      updateEducation: (id, edu) =>
        commit((state) => ({
          resume: {
            ...state.resume,
            education: state.resume.education.map((item) =>
              item.id === id ? { ...item, ...edu } : item
            ),
          },
        })),

      deleteEducation: (id) =>
        commit((state) => ({
          resume: {
            ...state.resume,
            education: state.resume.education.filter((item) => item.id !== id),
          },
        })),

      addProject: (proj) =>
        commit((state) => ({
          resume: {
            ...state.resume,
            projects: [...state.resume.projects, proj],
          },
        })),

      updateProject: (id, proj) =>
        commit((state) => ({
          resume: {
            ...state.resume,
            projects: state.resume.projects.map((item) =>
              item.id === id ? { ...item, ...proj } : item
            ),
          },
        })),

      deleteProject: (id) =>
        commit((state) => ({
          resume: {
            ...state.resume,
            projects: state.resume.projects.filter((item) => item.id !== id),
          },
        })),

      reorderProjects: (projects) =>
        commit((state) => ({
          resume: { ...state.resume, projects },
        })),

      addSkill: (skill) =>
        commit((state) => ({
          resume: {
            ...state.resume,
            skills: [...state.resume.skills, skill],
          },
        })),

      updateSkill: (id, skill) =>
        commit((state) => ({
          resume: {
            ...state.resume,
            skills: state.resume.skills.map((item) =>
              item.id === id ? { ...item, ...skill } : item
            ),
          },
        })),

      deleteSkill: (id) =>
        commit((state) => ({
          resume: {
            ...state.resume,
            skills: state.resume.skills.filter((item) => item.id !== id),
          },
        })),

      reorderSkills: (skills) =>
        commit((state) => ({
          resume: { ...state.resume, skills },
        })),

      // 联系方式相关
      addContact: (contact) =>
        commit((state) => ({
          resume: {
            ...state.resume,
            personalInfo: {
              ...state.resume.personalInfo,
              contacts: [...(state.resume.personalInfo.contacts || []), contact],
            },
          },
        })),

      updateContact: (id, contact) =>
        commit((state) => ({
          resume: {
            ...state.resume,
            personalInfo: {
              ...state.resume.personalInfo,
              contacts: (state.resume.personalInfo.contacts || []).map((item) =>
                item.id === id ? { ...item, ...contact } : item
              ),
            },
          },
        })),

      deleteContact: (id) =>
        commit((state) => ({
          resume: {
            ...state.resume,
            personalInfo: {
              ...state.resume.personalInfo,
              contacts: (state.resume.personalInfo.contacts || []).filter((item) => item.id !== id),
            },
          },
        })),

      reorderContacts: (contacts) =>
        commit((state) => ({
          resume: {
            ...state.resume,
            personalInfo: {
              ...state.resume.personalInfo,
              contacts: contacts.map((c, idx) => ({ ...c, order: idx })),
            },
          },
        })),

      // 自定义模块相关
      addCustomSection: (title) => {
        const sectionId = createEntityId('custom');
        commit((state) => ({
          resume: {
            ...state.resume,
            sections: [
              ...state.resume.sections,
              {
                id: sectionId,
                title,
                visible: true,
                order: state.resume.sections.length + 1,
                isCustom: true,
              },
            ],
            customSections: [
              ...state.resume.customSections,
              { id: sectionId, items: [] },
            ],
          },
        }));
        return sectionId;
      },

      deleteCustomSection: (sectionId) =>
        commit((state) => ({
          resume: {
            ...state.resume,
            sections: state.resume.sections.filter((s) => s.id !== sectionId),
            customSections: state.resume.customSections.filter((s) => s.id !== sectionId),
          },
        })),

      updateCustomSection: (sectionId, update) =>
        commit((state) => ({
          resume: {
            ...state.resume,
            customSections: state.resume.customSections.map((section) =>
              section.id === sectionId ? { ...section, ...update } : section
            ),
          },
        })),

      reorderCustomSectionItems: (sectionId, items) =>
        commit((state) => ({
          resume: {
            ...state.resume,
            customSections: state.resume.customSections.map((section) =>
              section.id === sectionId ? { ...section, items } : section
            ),
          },
        })),

      addCustomSectionItem: (sectionId, item) =>
        commit((state) => ({
          resume: {
            ...state.resume,
            customSections: state.resume.customSections.map((section) =>
              section.id === sectionId
                ? { ...section, items: [...section.items, item] }
                : section
            ),
          },
        })),

      updateCustomSectionItem: (sectionId, itemId, item) =>
        commit((state) => ({
          resume: {
            ...state.resume,
            customSections: state.resume.customSections.map((section) =>
              section.id === sectionId
                ? {
                  ...section,
                  items: section.items.map((i) =>
                    i.id === itemId ? { ...i, ...item } : i
                  ),
                }
                : section
            ),
          },
        })),

      deleteCustomSectionItem: (sectionId, itemId) =>
        commit((state) => ({
          resume: {
            ...state.resume,
            customSections: state.resume.customSections.map((section) =>
              section.id === sectionId
                ? { ...section, items: section.items.filter((i) => i.id !== itemId) }
                : section
            ),
          },
        })),

      importData: (data) => commit(() => ({ resume: normalizeResumeData(data) })),

      reset: () => commit(() => ({ resume: createInitialResume() })),
      };
    },
    {
      name: 'resume-storage',
      // 仅持久化简历数据；撤销历史与 hydration 状态每次会话重建。
      partialize: (state) => ({ resume: state.resume }),
      merge: (persistedState, currentState) => {
        const persisted = persistedState as Partial<ResumeStore> | undefined;

        return {
          ...currentState,
          hasHydrated: true,
          resume: normalizeResumeData(persisted?.resume),
        };
      },
    }
  )
);
