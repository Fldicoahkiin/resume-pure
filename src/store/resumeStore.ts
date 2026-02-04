import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ResumeData, ThemeConfig, SectionConfig } from '@/types';

interface ResumeStore {
  resume: ResumeData;
  updatePersonalInfo: (info: Partial<ResumeData['personalInfo']>) => void;
  updateTheme: (theme: Partial<ThemeConfig>) => void;
  updateSectionConfig: (sectionId: string, config: Partial<SectionConfig>) => void;
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
    { id: 'summary', visible: true, order: 1 },
    { id: 'experience', visible: true, order: 2 },
    { id: 'education', visible: true, order: 3 },
    { id: 'projects', visible: true, order: 4 },
    { id: 'skills', visible: true, order: 5 },
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

      importData: (data) => set({ resume: data }),

      reset: () => set({ resume: initialResume }),
    }),
    {
      name: 'resume-storage',
    }
  )
);
