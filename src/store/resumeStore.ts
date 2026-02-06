import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ResumeData, ThemeConfig, SectionConfig, Experience, Education, Project, Skill, ContactItem, ContactIconConfig, CustomSection, CustomSectionItem } from '@/types';

// 深度合并函数，确保嵌套对象正确合并
function deepMerge(target: ResumeData, source: Partial<ResumeData>): ResumeData {
  // 合并 sections，不设置默认标题（让组件使用 i18n）
  const mergedSections = source.sections
    ? source.sections.map(section => ({
        ...section,
        // 只保留用户自定义的标题，不设置默认值
        title: section.title || '',
      }))
    : target.sections;

  return {
    personalInfo: {
      ...target.personalInfo,
      ...(source.personalInfo || {}),
    },
    experience: source.experience ?? target.experience,
    education: source.education ?? target.education,
    projects: source.projects ?? target.projects,
    skills: source.skills ?? target.skills,
    customSections: source.customSections ?? target.customSections,
    sections: mergedSections,
    theme: {
      ...target.theme,
      ...(source.theme || {}),
    },
  };
}

interface ResumeStore {
  resume: ResumeData;
  hasHydrated: boolean;
  setHasHydrated: (state: boolean) => void;
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
  addSkill: (skill: Skill) => void;
  updateSkill: (id: string, skill: Partial<Skill>) => void;
  deleteSkill: (id: string) => void;
  // 联系方式相关
  addContact: (contact: ContactItem) => void;
  updateContact: (id: string, contact: Partial<ContactItem>) => void;
  deleteContact: (id: string) => void;
  reorderContacts: (contacts: ContactItem[]) => void;
  // 自定义模块相关
  addCustomSection: (title: string) => string;
  deleteCustomSection: (sectionId: string) => void;
  addCustomSectionItem: (sectionId: string, item: CustomSectionItem) => void;
  updateCustomSectionItem: (sectionId: string, itemId: string, item: Partial<CustomSectionItem>) => void;
  deleteCustomSectionItem: (sectionId: string, itemId: string) => void;
  importData: (data: ResumeData) => void;
  reset: () => void;
}

const initialResume: ResumeData = {
  personalInfo: {
    name: '',
    email: '',
    phone: '',
    location: '',
    summary: '',
  },
  experience: [],
  education: [],
  projects: [],
  skills: [],
  customSections: [],
  sections: [
    { id: 'summary', title: '', visible: true, order: 1 },
    { id: 'experience', title: '', visible: true, order: 2 },
    { id: 'education', title: '', visible: true, order: 3 },
    { id: 'projects', title: '', visible: true, order: 4 },
    { id: 'skills', title: '', visible: true, order: 5 },
  ],
  theme: {
    primaryColor: '#3b82f6',
    fontFamily: 'Inter',
    fontSize: 11,
    spacing: 8,
    lineHeight: 1.5,
    enableLinks: true,
  },
};

export const useResumeStore = create<ResumeStore>()(
  persist(
    (set) => ({
      resume: initialResume,
      hasHydrated: false,
      setHasHydrated: (state) => set({ hasHydrated: state }),

      updatePersonalInfo: (info) =>
        set((state) => ({
          resume: {
            ...state.resume,
            personalInfo: { ...state.resume.personalInfo, ...info },
          },
        })),

      updateIconConfig: (config) =>
        set((state) => ({
          resume: {
            ...state.resume,
            personalInfo: {
              ...state.resume.personalInfo,
              iconConfig: { ...state.resume.personalInfo.iconConfig, ...config },
            },
          },
        })),

      updateTheme: (theme) =>
        set((state) => ({
          resume: {
            ...state.resume,
            theme: { ...state.resume.theme, ...theme },
          },
        })),

      updateSectionConfig: (sectionId, config) =>
        set((state) => ({
          resume: {
            ...state.resume,
            sections: state.resume.sections.map((section) =>
              section.id === sectionId ? { ...section, ...config } : section
            ),
          },
        })),

      reorderSections: (sections) =>
        set((state) => ({
          resume: {
            ...state.resume,
            sections: sections.map((s, idx) => ({ ...s, order: idx + 1 })),
          },
        })),

      addExperience: (exp) =>
        set((state) => ({
          resume: {
            ...state.resume,
            experience: [...state.resume.experience, exp],
          },
        })),

      updateExperience: (id, exp) =>
        set((state) => ({
          resume: {
            ...state.resume,
            experience: state.resume.experience.map((item) =>
              item.id === id ? { ...item, ...exp } : item
            ),
          },
        })),

      deleteExperience: (id) =>
        set((state) => ({
          resume: {
            ...state.resume,
            experience: state.resume.experience.filter((item) => item.id !== id),
          },
        })),

      addEducation: (edu) =>
        set((state) => ({
          resume: {
            ...state.resume,
            education: [...state.resume.education, edu],
          },
        })),

      updateEducation: (id, edu) =>
        set((state) => ({
          resume: {
            ...state.resume,
            education: state.resume.education.map((item) =>
              item.id === id ? { ...item, ...edu } : item
            ),
          },
        })),

      deleteEducation: (id) =>
        set((state) => ({
          resume: {
            ...state.resume,
            education: state.resume.education.filter((item) => item.id !== id),
          },
        })),

      addProject: (proj) =>
        set((state) => ({
          resume: {
            ...state.resume,
            projects: [...state.resume.projects, proj],
          },
        })),

      updateProject: (id, proj) =>
        set((state) => ({
          resume: {
            ...state.resume,
            projects: state.resume.projects.map((item) =>
              item.id === id ? { ...item, ...proj } : item
            ),
          },
        })),

      deleteProject: (id) =>
        set((state) => ({
          resume: {
            ...state.resume,
            projects: state.resume.projects.filter((item) => item.id !== id),
          },
        })),

      addSkill: (skill) =>
        set((state) => ({
          resume: {
            ...state.resume,
            skills: [...state.resume.skills, skill],
          },
        })),

      updateSkill: (id, skill) =>
        set((state) => ({
          resume: {
            ...state.resume,
            skills: state.resume.skills.map((item) =>
              item.id === id ? { ...item, ...skill } : item
            ),
          },
        })),

      deleteSkill: (id) =>
        set((state) => ({
          resume: {
            ...state.resume,
            skills: state.resume.skills.filter((item) => item.id !== id),
          },
        })),

      // 联系方式相关
      addContact: (contact) =>
        set((state) => ({
          resume: {
            ...state.resume,
            personalInfo: {
              ...state.resume.personalInfo,
              contacts: [...(state.resume.personalInfo.contacts || []), contact],
            },
          },
        })),

      updateContact: (id, contact) =>
        set((state) => ({
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
        set((state) => ({
          resume: {
            ...state.resume,
            personalInfo: {
              ...state.resume.personalInfo,
              contacts: (state.resume.personalInfo.contacts || []).filter((item) => item.id !== id),
            },
          },
        })),

      reorderContacts: (contacts) =>
        set((state) => ({
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
        const sectionId = `custom-${Date.now()}`;
        set((state) => ({
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
        set((state) => ({
          resume: {
            ...state.resume,
            sections: state.resume.sections.filter((s) => s.id !== sectionId),
            customSections: state.resume.customSections.filter((s) => s.id !== sectionId),
          },
        })),

      addCustomSectionItem: (sectionId, item) =>
        set((state) => ({
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
        set((state) => ({
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
        set((state) => ({
          resume: {
            ...state.resume,
            customSections: state.resume.customSections.map((section) =>
              section.id === sectionId
                ? { ...section, items: section.items.filter((i) => i.id !== itemId) }
                : section
            ),
          },
        })),

      importData: (data) => set({ resume: data }),

      reset: () => set({ resume: initialResume }),
    }),
    {
      name: 'resume-storage',
      merge: (persistedState, currentState) => {
        const persisted = persistedState as Partial<ResumeStore> | undefined;

        if (!persisted || !persisted.resume) {
          return {
            ...currentState,
            hasHydrated: true,
          };
        }

        return {
          ...currentState,
          hasHydrated: true,
          resume: deepMerge(initialResume, persisted.resume) as ResumeData,
        };
      },
    }
  )
);
