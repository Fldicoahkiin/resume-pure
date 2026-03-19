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
  showBulletPoints?: boolean; // 是否以项目符号展示描述，默认 true
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
  showBulletPoints?: boolean; // 是否以项目符号展示描述，默认 true
}

export interface Project {
  id: string;
  name: string;
  role?: string;
  startDate: string;
  endDate: string;
  current?: boolean;
  url?: string;
  repoUrl?: string;
  repoStars?: number;
  repoAvatarUrl?: string;
  customLogo?: string;
  description: string[];
  technologies?: string[];
  contributions?: ProjectContribution[];
  showLogo?: boolean;
  showStars?: boolean;
  showTechnologies?: boolean;
  showContributions?: boolean;
  showBulletPoints?: boolean;
  visible?: boolean;
}

export interface ProjectContribution {
  id: string;
  summary: string;
  url: string;
}

export type SkillLevel = 'core' | 'proficient' | 'familiar';

export interface SkillItem {
  id: string;
  name: string;
  level: SkillLevel;
  context?: string;
  logo?: string;
  showLogo?: boolean;
  showContext?: boolean;
}

export interface Skill {
  id: string;
  category: string;
  categoryIcon?: string;
  items: SkillItem[];
  tags?: string[];
  visible?: boolean;
}

export interface SectionConfig {
  id: string;
  title: string;
  visible: boolean;
  order: number;
  isCustom?: boolean; // 是否为自定义模块
}

// 自定义模块内容项
export interface CustomSectionItem {
  id: string;
  title?: string;      // 可选标题（如：奖项名称、证书名称）
  subtitle?: string;   // 可选副标题（如：颁发机构）
  date?: string;       // 可选日期
  description: string[]; // 描述列表
  showBulletPoints?: boolean; // 是否以项目符号展示描述，默认 true
  url?: string;           // 项目/成果链接
  repoUrl?: string;       // GitHub 仓库链接
  repoStars?: number;     // Star 数
  repoAvatarUrl?: string; // 仓库/组织头像
  showStars?: boolean;    // 是否展示 Star 数
  showLogo?: boolean;     // 是否展示 Logo
}

// 自定义模块
export interface CustomSection {
  id: string;          // 对应 SectionConfig 的 id
  items: CustomSectionItem[];
}

export interface ThemeConfig {
  primaryColor: string;
  fontFamily: string;
  fontSize: number;
  spacing: number;
  lineHeight: number;
  enableLinks?: boolean; // 是否启用超链接，默认 true
  paperSize: PaperSize;
}

export type PaperSize = 'A4' | 'Letter' | 'Legal' | 'A3';

export interface ResumeData {
  schemaVersion: number; // 数据结构版本号，用于迁移与兼容
  personalInfo: PersonalInfo;
  experience: Experience[];
  education: Education[];
  projects: Project[];
  skills: Skill[];
  customSections: CustomSection[];
  sections: SectionConfig[];
  theme: ThemeConfig;
}
