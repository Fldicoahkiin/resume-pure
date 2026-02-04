export interface PersonalInfo {
  name: string;
  email: string;
  phone: string;
  location: string;
  summary: string;
}

export interface Experience {
  id: string;
  company: string;
  position: string;
  location: string;
  startDate: string;
  endDate: string;
  current: boolean;
  description: string[];
}

export interface Education {
  id: string;
  school: string;
  degree: string;
  field: string;
  location: string;
  startDate: string;
  endDate: string;
  gpa?: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  technologies: string[];
  link?: string;
  startDate: string;
  endDate: string;
}

export interface Skill {
  category: string;
  items: string[];
}

export interface SectionConfig {
  id: string;
  visible: boolean;
  order: number;
}

export interface ThemeConfig {
  primaryColor: string;
  fontFamily: string;
  fontSize: number;
  spacing: number;
  lineHeight: number;
}

export interface ResumeData {
  personalInfo: PersonalInfo;
  experience: Experience[];
  education: Education[];
  projects: Project[];
  skills: Skill[];
  sections: SectionConfig[];
  theme: ThemeConfig;
}
