import type { ReactNode } from 'react';
import { Briefcase, FolderKanban, GraduationCap, Wrench } from 'lucide-react';
import { ExperienceEditor } from './ExperienceEditor';
import { EducationEditor } from './EducationEditor';
import { ProjectEditor } from './ProjectEditor';
import { SkillEditor } from './SkillEditor';

interface BuiltinSectionEntry {
  icon: ReactNode;
  editor: ReactNode;
}

/**
 * 内置模块的编辑器分发表：新增模块类型时在此登记图标与编辑器，
 * 渲染侧的对应表见 lib/render/layout 的 BUILTIN_SECTION_LAYOUTS。
 */
export const BUILTIN_SECTIONS: Record<string, BuiltinSectionEntry> = {
  experience: { icon: <Briefcase size={18} />, editor: <ExperienceEditor embedded /> },
  education: { icon: <GraduationCap size={18} />, editor: <EducationEditor embedded /> },
  projects: { icon: <FolderKanban size={18} />, editor: <ProjectEditor embedded /> },
  skills: { icon: <Wrench size={18} />, editor: <SkillEditor embedded /> },
};
