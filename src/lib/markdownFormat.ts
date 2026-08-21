import {
  ResumeData,
  Experience,
  Education,
  Project,
  Skill,
  SkillLevel,
  CustomSection,
  CustomSectionItem,
  CustomSectionType,
  SectionConfig,
} from '@/types';
import { createInitialResume, normalizeResumeData } from './resumeData';
import { createEntityId } from './id';

const CUSTOM_SECTION_PREFIX = '自定义模块:';

function appendDescription(lines: string[], description: string[] | undefined) {
  if (!description || description.length === 0) return;

  lines.push('描述:');
  description.forEach((item) => lines.push(`- ${item}`));
}

function appendCustomSectionItem(
  lines: string[],
  item: Project | Experience | Education | Skill | CustomSectionItem,
  type: CustomSectionType
) {
  if (type === 'project') {
    const project = item as Project;
    lines.push(`## ${project.name || '项目'}`);
    if (project.role) lines.push(`角色: ${project.role}`);
    if (project.startDate || project.endDate) {
      lines.push(`时间: ${project.startDate || ''} - ${project.endDate || ''}`);
    }
    if (project.url) lines.push(`链接: ${project.url}`);
    if (project.technologies?.length) {
      lines.push(`技术: ${project.technologies.join(', ')}`);
    }
    appendDescription(lines, project.description);
    if (project.proofs?.length) {
      lines.push('贡献证明:');
      project.proofs.forEach((proof) => lines.push(`- ${proof.summary}`));
    }
    return;
  }

  if (type === 'experience') {
    const experience = item as Experience;
    lines.push(`## ${experience.company || '公司'}`);
    if (experience.position) lines.push(`职位: ${experience.position}`);
    if (experience.startDate || experience.endDate) {
      lines.push(`时间: ${experience.startDate || ''} - ${experience.endDate || ''}`);
    }
    appendDescription(lines, experience.description);
    return;
  }

  if (type === 'education') {
    const education = item as Education;
    lines.push(`## ${education.school || '学校'}`);
    if (education.degree) lines.push(`学历: ${education.degree}`);
    if (education.startDate || education.endDate) {
      lines.push(`时间: ${education.startDate || ''} - ${education.endDate || ''}`);
    }
    appendDescription(lines, education.description);
    return;
  }

  if (type === 'skill') {
    const skill = item as Skill;
    lines.push(`## ${skill.category}`);
    if (skill.items.length > 0) {
      lines.push('项:');
      skill.items.forEach((skillItem) => {
        lines.push(`- ${skillItem.name}${skillItem.level ? ` (${skillItem.level})` : ''}`);
      });
    }
    return;
  }

  const customItem = item as CustomSectionItem;
  lines.push(`## ${customItem.title || '条目'}`);
  if (customItem.subtitle) lines.push(`副标题: ${customItem.subtitle}`);
  if (customItem.date) lines.push(`日期: ${customItem.date}`);
  if (customItem.url) lines.push(`链接: ${customItem.url}`);
  if (customItem.repoUrl) lines.push(`GitHub 仓库: ${customItem.repoUrl}`);
  if (typeof customItem.repoStars === 'number') lines.push(`Star 数: ${customItem.repoStars}`);
  if (typeof customItem.showLogo === 'boolean') lines.push(`显示图标: ${customItem.showLogo}`);
  if (typeof customItem.showStars === 'boolean') lines.push(`显示 Star: ${customItem.showStars}`);
  if (typeof customItem.showBulletPoints === 'boolean') {
    lines.push(`项目符号: ${customItem.showBulletPoints}`);
  }
  appendDescription(lines, customItem.description);
}

export function exportToMarkdown(data: ResumeData): string {
  const lines: string[] = [];
  
  // 个人信息
  lines.push('# 个人信息');
  if (data.personalInfo.name) lines.push(`姓名: ${data.personalInfo.name}`);
  if (data.personalInfo.email) lines.push(`邮箱: ${data.personalInfo.email}`);
  if (data.personalInfo.phone) lines.push(`电话: ${data.personalInfo.phone}`);
  if (data.personalInfo.location) lines.push(`地点: ${data.personalInfo.location}`);
  
  data.personalInfo.contacts?.forEach(contact => {
    lines.push(`${contact.type}: ${contact.value}` + (contact.href ? ` (${contact.href})` : ''));
  });

  if (data.personalInfo.summary) {
    lines.push('');
    lines.push('## 个人简介');
    lines.push(data.personalInfo.summary);
  }
  lines.push('');

  // 工作经历
  if (data.experience.length > 0) {
    lines.push('# 工作经历');
    data.experience.forEach(exp => {
      lines.push(`## ${exp.company || '公司'}`);
      if (exp.position) lines.push(`职位: ${exp.position}`);
      if (exp.startDate || exp.endDate) lines.push(`时间: ${exp.startDate || ''} - ${exp.endDate || ''}`);
      if (exp.description && exp.description.length > 0) {
        lines.push('描述:');
        exp.description.forEach(desc => lines.push(`- ${desc}`));
      }
      lines.push('');
    });
  }

  // 教育背景
  if (data.education.length > 0) {
    lines.push('# 教育背景');
    data.education.forEach(edu => {
      lines.push(`## ${edu.school || '学校'}`);
      if (edu.degree) lines.push(`学历: ${edu.degree}`);
      if (edu.startDate || edu.endDate) lines.push(`时间: ${edu.startDate || ''} - ${edu.endDate || ''}`);
      if (edu.description && edu.description.length > 0) {
        lines.push('描述:');
        edu.description.forEach(desc => lines.push(`- ${desc}`));
      }
      lines.push('');
    });
  }

  // 项目经历
  if (data.projects.length > 0) {
    lines.push('# 项目经历');
    data.projects.forEach(proj => {
      lines.push(`## ${proj.name || '项目'}`);
      if (proj.role) lines.push(`角色: ${proj.role}`);
      if (proj.startDate || proj.endDate) lines.push(`时间: ${proj.startDate || ''} - ${proj.endDate || ''}`);
      if (proj.url) lines.push(`链接: ${proj.url}`);
      if (proj.technologies && proj.technologies.length > 0) {
        lines.push(`技术: ${proj.technologies.join(', ')}`);
      }
      if (proj.description && proj.description.length > 0) {
        lines.push('描述:');
        proj.description.forEach(desc => lines.push(`- ${desc}`));
      }
      if (proj.proofs && proj.proofs.length > 0) {
        lines.push('贡献证明:');
        proj.proofs.forEach(proof => lines.push(`- ${proof.summary}`));
      }
      lines.push('');
    });
  }

  // 专业技能
  if (data.skills.length > 0) {
    lines.push('# 专业技能');
    data.skills.forEach(skill => {
      lines.push(`## ${skill.category}`);
      if (skill.items && skill.items.length > 0) {
        lines.push('项:');
        skill.items.forEach(item => lines.push(`- ${item.name}${item.level ? ` (${item.level})` : ''}`));
      }
      lines.push('');
    });
  }

  const sectionById = new Map(data.sections.map((section) => [section.id, section]));
  data.customSections.forEach((section) => {
    const sectionConfig = sectionById.get(section.id);
    const type = section.type || 'custom';

    lines.push(`# ${CUSTOM_SECTION_PREFIX} ${sectionConfig?.title || '自定义模块'}`);
    lines.push(`模板: ${type}`);
    lines.push(`显示: ${sectionConfig?.visible !== false}`);
    section.items.forEach((item) => {
      appendCustomSectionItem(lines, item, type);
      lines.push('');
    });
  });

  return lines.join('\n');
}

function isCustomSectionType(value: string): value is CustomSectionType {
  return ['custom', 'project', 'experience', 'education', 'skill'].includes(value);
}

function parseMarkdownBoolean(value: string): boolean {
  return value.toLowerCase() === 'true';
}

function createCustomSectionItem(
  title: string,
  type: CustomSectionType
): Project | Experience | Education | Skill | CustomSectionItem {
  if (type === 'project') {
    return {
      id: createEntityId('proj'),
      name: title,
      startDate: '',
      endDate: '',
      description: [],
      proofs: [],
      technologies: [],
    };
  }

  if (type === 'experience') {
    return {
      id: createEntityId('exp'),
      company: title,
      position: '',
      startDate: '',
      endDate: '',
      description: [],
    };
  }

  if (type === 'education') {
    return {
      id: createEntityId('edu'),
      school: title,
      degree: '',
      major: '',
      startDate: '',
      endDate: '',
      description: [],
    };
  }

  if (type === 'skill') {
    return {
      id: createEntityId('skill'),
      category: title,
      items: [],
    };
  }

  return {
    id: createEntityId('custom-item'),
    title,
    description: [],
  };
}

export function importFromMarkdown(md: string): ResumeData {
  const data = createInitialResume();
  const lines = md.split('\n');
  let currentSection = '';
  let currentItem: Experience | Education | Project | Skill | CustomSectionItem | null = null;
  let currentCustomSection: CustomSection | null = null;
  let currentCustomSectionConfig: SectionConfig | null = null;
  let currentContext = '';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    if (line.startsWith('# ')) {
      const sectionTitle = line.substring(2).trim();
      currentItem = null;
      currentContext = '';
      currentCustomSection = null;
      currentCustomSectionConfig = null;

      if (sectionTitle.startsWith(CUSTOM_SECTION_PREFIX)) {
        const title = sectionTitle.slice(CUSTOM_SECTION_PREFIX.length).trim() || '自定义模块';
        const id = createEntityId('custom');
        currentSection = '自定义模块';
        currentCustomSection = { id, type: 'custom', items: [] };
        currentCustomSectionConfig = {
          id,
          title,
          visible: true,
          order: data.sections.length + 1,
          isCustom: true,
        };
        data.customSections.push(currentCustomSection);
        data.sections.push(currentCustomSectionConfig);
        continue;
      }

      currentSection = sectionTitle;
      continue;
    }

    if (line.startsWith('## ')) {
      const title = line.substring(3).trim();
      if (currentSection === '个人信息') {
        if (title === '个人简介') {
          currentContext = 'summary';
        }
      } else if (currentSection === '工作经历') {
        currentItem = { id: createEntityId('exp'), company: title, position: '', startDate: '', endDate: '', description: [] };
        data.experience.push(currentItem);
        currentContext = '';
      } else if (currentSection === '教育背景') {
        currentItem = { id: createEntityId('edu'), school: title, degree: '', major: '', startDate: '', endDate: '', description: [] };
        data.education.push(currentItem);
        currentContext = '';
      } else if (currentSection === '项目经历') {
        currentItem = { id: createEntityId('proj'), name: title, startDate: '', endDate: '', description: [], proofs: [], technologies: [] };
        data.projects.push(currentItem);
        currentContext = '';
      } else if (currentSection === '专业技能') {
        currentItem = { id: createEntityId('skill'), category: title, items: [] };
        data.skills.push(currentItem);
        currentContext = '';
      } else if (currentSection === '自定义模块' && currentCustomSection) {
        currentItem = createCustomSectionItem(title, currentCustomSection.type || 'custom');
        currentCustomSection.items.push(currentItem);
        currentContext = '';
      }
      continue;
    }

    // summary 上下文中的行优先作为正文，不走 KV 解析
    if (currentSection === '个人信息' && currentContext === 'summary') {
      data.personalInfo.summary = data.personalInfo.summary ? data.personalInfo.summary + '\n' + line : line;
      continue;
    }

    const kvMatch = line.match(/^([^:]+)[:：]\s*(.*)$/);
    if (!line.startsWith('- ') && kvMatch) {
      const key = kvMatch[1].trim();
      const val = kvMatch[2].trim();
      
      if (currentSection === '自定义模块' && currentCustomSection && !currentItem) {
        if (key === '模板' && isCustomSectionType(val)) {
          currentCustomSection.type = val;
        } else if (key === '显示' && currentCustomSectionConfig) {
          currentCustomSectionConfig.visible = parseMarkdownBoolean(val);
        }
      } else if (currentSection === '个人信息' && !currentContext) {
        if (key === '姓名') data.personalInfo.name = val;
        else if (key === '邮箱') data.personalInfo.email = val;
        else if (key === '电话') data.personalInfo.phone = val;
        else if (key === '地点') data.personalInfo.location = val;
      } else if (currentItem) {
        if (key === '描述' || key === '贡献证明' || key === '项') {
          currentContext = key;
        } else if (currentCustomSection?.type === 'custom') {
          const customItem = currentItem as CustomSectionItem;
          if (key === '副标题') customItem.subtitle = val;
          else if (key === '日期') customItem.date = val;
          else if (key === '链接') customItem.url = val;
          else if (key === 'GitHub 仓库') customItem.repoUrl = val;
          else if (key === 'Star 数') {
            const stars = Number.parseFloat(val);
            if (Number.isFinite(stars)) customItem.repoStars = stars;
          } else if (key === '显示图标') {
            customItem.showLogo = parseMarkdownBoolean(val);
          } else if (key === '显示 Star') {
            customItem.showStars = parseMarkdownBoolean(val);
          } else if (key === '项目符号') {
            customItem.showBulletPoints = parseMarkdownBoolean(val);
          }
        } else if (key === '时间') {
          (currentItem as Experience | Education | Project).startDate = val.slice(0, Math.max(0, val.indexOf(' - '))).trim() || val.trim();
          const sepIdx = val.indexOf(' - ');
          (currentItem as Experience | Education | Project).endDate = sepIdx !== -1 ? val.slice(sepIdx + 3).trim() : '';
        } else if (key === '职位') {
          (currentItem as Experience).position = val;
        } else if (key === '学历') {
          (currentItem as Education).degree = val;
        } else if (key === '角色') {
          (currentItem as Project).role = val;
        } else if (key === '链接') {
          (currentItem as Project).url = val;
        } else if (key === '技术') {
          (currentItem as Project).technologies = val.split(',').map((s: string) => s.trim()).filter(Boolean);
        }
      }
      continue;
    }

    if (line.startsWith('- ')) {
      const val = line.substring(2).trim();
      if (currentItem) {
        if (currentContext === '描述') {
          const withDesc = currentItem as Experience | Education | Project | CustomSectionItem;
          (withDesc.description = withDesc.description || []).push(val);
        } else if (currentContext === '贡献证明') {
          const proj = currentItem as Project;
          (proj.proofs = proj.proofs || []).push({ id: createEntityId('proof'), summary: val, refs: [] });
        } else if (
          currentContext === '项' &&
          (currentSection === '专业技能' || currentCustomSection?.type === 'skill')
        ) {
           const match = val.match(/^(.*?)(?:\s*\((.*?)\))?$/);
           const name = match ? match[1].trim() : val;
           const level = match && match[2] ? match[2].trim() : 'proficient';
           (currentItem as Skill).items.push({ id: createEntityId('item'), name, level: level as SkillLevel });
        }
      }
      continue;
    }
  }

  return normalizeResumeData(data);
}
