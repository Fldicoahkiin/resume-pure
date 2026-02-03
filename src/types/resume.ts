export interface PersonalInfo {
  name: string;
  email: string;
  phone: string;
  linkedin?: string;
  github?: string;
  website?: string;
  address?: string;
  summary?: string;
}

export interface Experience {
  id: string;
  title: string;
  company: string;
  location: string;
  startDate: string;
  endDate: string | 'Present';
  description: string[];
}

export interface Education {
  id: string;
  degree: string;
  major: string;
  university: string;
  location: string;
  startDate: string;
  endDate: string;
  gpa?: string;
  description?: string[];
}

export interface SkillGroup {
  id: string;
  name: string;
  skills: string[];
}

export interface Project {
  id: string;
  name: string;
  link?: string;
  startDate: string;
  endDate: string;
  description: string[];
}

export interface Language {
  id: string;
  name: string;
  proficiency: 'Native' | 'Fluent' | 'Intermediate' | 'Basic';
}

export interface Award {
  id: string;
  name: string;
  issuer: string;
  date: string;
  description?: string;
}

export interface ResumeData {
  id: string;
  personalInfo: PersonalInfo;
  experience: Experience[];
  education: Education[];
  skills: SkillGroup[];
  projects: Project[];
  languages: Language[];
  awards: Award[];
  theme: string;
  template: string;
}

export const defaultResumeData: ResumeData = {
  id: '',
  personalInfo: {
    name: '',
    email: '',
    phone: '',
  },
  experience: [],
  education: [],
  skills: [],
  projects: [],
  languages: [],
  awards: [],
  theme: 'modern',
  template: 'default',
};
