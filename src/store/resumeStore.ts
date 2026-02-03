import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ResumeData, defaultResumeData, PersonalInfo, Experience, Education, SkillGroup, Project, Language, Award } from '@/types';

interface ResumeState extends ResumeData {
  setResumeData: (data: ResumeData) => void;
  updatePersonalInfo: (info: Partial<PersonalInfo>) => void;
  addExperience: (experience: Experience) => void;
  updateExperience: (id: string, experience: Partial<Experience>) => void;
  removeExperience: (id: string) => void;
  addEducation: (education: Education) => void;
  updateEducation: (id: string, education: Partial<Education>) => void;
  removeEducation: (id: string) => void;
  addSkillGroup: (skillGroup: SkillGroup) => void;
  updateSkillGroup: (id: string, skillGroup: Partial<SkillGroup>) => void;
  removeSkillGroup: (id: string) => void;
  addProject: (project: Project) => void;
  updateProject: (id: string, project: Partial<Project>) => void;
  removeProject: (id: string) => void;
  addLanguage: (language: Language) => void;
  updateLanguage: (id: string, language: Partial<Language>) => void;
  removeLanguage: (id: string) => void;
  addAward: (award: Award) => void;
  updateAward: (id: string, award: Partial<Award>) => void;
  removeAward: (id: string) => void;
  setTheme: (theme: string) => void;
  setTemplate: (template: string) => void;
  importData: (data: ResumeData) => void;
  exportData: () => string;
  resetResume: () => void;
}

export const useResumeStore = create<ResumeState>()(
  persist(
    (set, get) => ({
      ...defaultResumeData,
      
      setResumeData: (data) => set({ ...data }),
      
      updatePersonalInfo: (info) =>
        set((state) => ({
          personalInfo: { ...state.personalInfo, ...info },
        })),
      
      addExperience: (experience) =>
        set((state) => ({
          experience: [...state.experience, experience],
        })),
      
      updateExperience: (id, experience) =>
        set((state) => ({
          experience: state.experience.map((exp) =>
            exp.id === id ? { ...exp, ...experience } : exp
          ),
        })),
      
      removeExperience: (id) =>
        set((state) => ({
          experience: state.experience.filter((exp) => exp.id !== id),
        })),
      
      addEducation: (education) =>
        set((state) => ({
          education: [...state.education, education],
        })),
      
      updateEducation: (id, education) =>
        set((state) => ({
          education: state.education.map((edu) =>
            edu.id === id ? { ...edu, ...education } : edu
          ),
        })),
      
      removeEducation: (id) =>
        set((state) => ({
          education: state.education.filter((edu) => edu.id !== id),
        })),
      
      addSkillGroup: (skillGroup) =>
        set((state) => ({
          skills: [...state.skills, skillGroup],
        })),
      
      updateSkillGroup: (id, skillGroup) =>
        set((state) => ({
          skills: state.skills.map((sg) =>
            sg.id === id ? { ...sg, ...skillGroup } : sg
          ),
        })),
      
      removeSkillGroup: (id) =>
        set((state) => ({
          skills: state.skills.filter((sg) => sg.id !== id),
        })),
      
      addProject: (project) =>
        set((state) => ({
          projects: [...state.projects, project],
        })),
      
      updateProject: (id, project) =>
        set((state) => ({
          projects: state.projects.map((proj) =>
            proj.id === id ? { ...proj, ...project } : proj
          ),
        })),
      
      removeProject: (id) =>
        set((state) => ({
          projects: state.projects.filter((proj) => proj.id !== id),
        })),
      
      addLanguage: (language) =>
        set((state) => ({
          languages: [...state.languages, language],
        })),
      
      updateLanguage: (id, language) =>
        set((state) => ({
          languages: state.languages.map((lang) =>
            lang.id === id ? { ...lang, ...language } : lang
          ),
        })),
      
      removeLanguage: (id) =>
        set((state) => ({
          languages: state.languages.filter((lang) => lang.id !== id),
        })),
      
      addAward: (award) =>
        set((state) => ({
          awards: [...state.awards, award],
        })),
      
      updateAward: (id, award) =>
        set((state) => ({
          awards: state.awards.map((awd) =>
            awd.id === id ? { ...awd, ...award } : awd
          ),
        })),
      
      removeAward: (id) =>
        set((state) => ({
          awards: state.awards.filter((awd) => awd.id !== id),
        })),
      
      setTheme: (theme) => set({ theme }),
      setTemplate: (template) => set({ template }),
      
      importData: (data) => set({ ...data }),
      
      exportData: () => JSON.stringify(get(), null, 2),
      
      resetResume: () => set({ ...defaultResumeData }),
    }),
    {
      name: 'resume-storage',
    }
  )
);
