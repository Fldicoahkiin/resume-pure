import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ResumeData, ThemeConfig, SectionConfig, Experience, Education, Project, Skill } from '@/types';

// 深度合并函数，确保嵌套对象正确合并
function deepMerge(target: ResumeData, source: Partial<ResumeData>): ResumeData {
  // 合并 sections，确保旧数据中缺少 title 的 section 能获得默认标题
  const defaultTitles: Record<string, string> = {
    summary: '个人简介',
    experience: '工作经历',
    education: '教育背景',
    projects: '项目经验',
    skills: '技能专长',
  };

  const mergedSections = source.sections
    ? source.sections.map(section => ({
        ...section,
        title: section.title || defaultTitles[section.id] || section.id,
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
  updateTheme: (theme: Partial<ThemeConfig>) => void;
  updateSectionConfig: (sectionId: string, config: Partial<SectionConfig>) => void;
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
  sections: [
    { id: 'summary', title: '个人简介', visible: true, order: 1 },
    { id: 'experience', title: '工作经历', visible: true, order: 2 },
    { id: 'education', title: '教育背景', visible: true, order: 3 },
    { id: 'projects', title: '项目经验', visible: true, order: 4 },
    { id: 'skills', title: '技能专长', visible: true, order: 5 },
  ],
  theme: {
    primaryColor: '#3b82f6',
    fontFamily: 'Inter',
    fontSize: 11,
    spacing: 8,
    lineHeight: 1.5,
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
