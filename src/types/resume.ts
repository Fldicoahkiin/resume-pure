// 可用的联系方式图标类型
export type ContactIconType =
  | 'mail' | 'phone' | 'map-pin' | 'globe' | 'linkedin' | 'github'
  | 'twitter' | 'instagram' | 'facebook' | 'youtube' | 'dribbble' | 'behance'
  | 'link' | 'user' | 'briefcase' | 'calendar' | 'message-circle' | 'at-sign';

// 联系方式项目
export interface ContactItem {
  id: string;
  type: ContactIconType;
  value: string;
  href?: string;  // 可选的超链接地址
  order: number;
}

// 基础联系方式图标配置
export interface ContactIconConfig {
  emailIcon?: ContactIconType;
  phoneIcon?: ContactIconType;
  locationIcon?: ContactIconType;
  websiteIcon?: ContactIconType;
  linkedinIcon?: ContactIconType;
  githubIcon?: ContactIconType;
}

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
  // 基础联系方式的自定义图标
  iconConfig?: ContactIconConfig;
  // 额外的自定义联系方式
  contacts?: ContactItem[];
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
  enableLinks?: boolean; // 是否启用超链接，默认 true
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
