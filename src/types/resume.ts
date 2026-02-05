export interface PersonalInfo {
  name: string;
  title?: string;
  email: string;
  phone: string;
  location: string;
  website?: string;
  linkedin?: string;
  github?: string;
  summary: string;
}

export interface Experience {
  id: string;
  company: string;
  position: string;
  location?: string;
  startDate: string;
  endDate: string;
  current?: boolean;
  description: string[];
}

export interface Education {
  id: string;
  school: string;
  degree: string;
  major: string;
  location?: string;
  startDate: string;
  endDate: string;
  gpa?: string;
  description?: string[];
}

export interface Project {
  id: string;
  name: string;
  role?: string;
  startDate: string;
  endDate: string;
  current?: boolean;
  url?: string;
  description: string[];
  technologies?: string[];
}

export interface Skill {
  id: string;
  category: string;
  items: string[];
}

export interface SectionConfig {
  id: string;
  title: string;
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
