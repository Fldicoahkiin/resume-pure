import { ResumeData } from '@/types';
import { createInitialResume, normalizeResumeData } from './resumeData';
import { createEntityId } from './id';

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
      if (proj.contributions && proj.contributions.length > 0) {
        lines.push('职责:');
        proj.contributions.forEach(contrib => lines.push(`- ${contrib.summary}`));
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

  return lines.join('\n');
}

export function importFromMarkdown(md: string): ResumeData {
  const data = createInitialResume();
  const lines = md.split('\n');
  let currentSection = '';
  let currentItem: any = null;
  let currentContext = '';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    if (line.startsWith('# ')) {
      currentSection = line.substring(2).trim();
      currentItem = null;
      currentContext = '';
      continue;
    }

    if (line.startsWith('## ')) {
      const title = line.substring(3).trim();
      if (currentSection === '个人信息') {
        if (title === '个人简介') {
          currentContext = 'summary';
        }
      } else if (currentSection === '工作经历') {
        currentItem = { id: createEntityId('exp'), company: title, description: [] };
        data.experience.push(currentItem);
        currentContext = '';
      } else if (currentSection === '教育背景') {
        currentItem = { id: createEntityId('edu'), school: title, description: [] };
        data.education.push(currentItem);
        currentContext = '';
      } else if (currentSection === '项目经历') {
        currentItem = { id: createEntityId('proj'), name: title, description: [], contributions: [], technologies: [] };
        data.projects.push(currentItem);
        currentContext = '';
      } else if (currentSection === '专业技能') {
        currentItem = { id: createEntityId('skill'), category: title, items: [] };
        data.skills.push(currentItem);
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
      
      if (currentSection === '个人信息' && !currentContext) {
        if (key === '姓名') data.personalInfo.name = val;
        else if (key === '邮箱') data.personalInfo.email = val;
        else if (key === '电话') data.personalInfo.phone = val;
        else if (key === '地点') data.personalInfo.location = val;
        else {
           // Maybe custom contact
        }
      } else if (currentItem) {
        if (key === '描述' || key === '职责' || key === '项') {
          currentContext = key;
        } else if (key === '时间') {
          const separatorIdx = val.indexOf(' - ');
          if (separatorIdx !== -1) {
            currentItem.startDate = val.slice(0, separatorIdx).trim();
            currentItem.endDate = val.slice(separatorIdx + 3).trim();
          } else {
            currentItem.startDate = val.trim();
            currentItem.endDate = '';
          }
        } else if (key === '职位') {
          currentItem.position = val;
        } else if (key === '学历') {
          currentItem.degree = val;
        } else if (key === '角色') {
          currentItem.role = val;
        } else if (key === '链接') {
          currentItem.url = val;
        } else if (key === '技术') {
          currentItem.technologies = val.split(',').map((s: string) => s.trim()).filter(Boolean);
        }
      }
      continue;
    }

    if (line.startsWith('- ')) {
      const val = line.substring(2).trim();
      if (currentItem) {
        if (currentContext === '描述') {
          (currentItem.description = currentItem.description || []).push(val);
        } else if (currentContext === '职责') {
          (currentItem.contributions = currentItem.contributions || []).push({ id: createEntityId('con'), summary: val });
        } else if (currentContext === '项' && currentSection === '专业技能') {
           const match = val.match(/^(.*?)(?:\s*\((.*?)\))?$/);
           const name = match ? match[1].trim() : val;
           const level = match && match[2] ? match[2].trim() : 'proficient';
           currentItem.items.push({ id: createEntityId('item'), name, level: level as any });
        }
      }
      continue;
    }
  }

  return normalizeResumeData(data);
}
