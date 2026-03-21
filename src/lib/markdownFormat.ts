import { ResumeData, Experience, Education, Project, Skill, SkillLevel } from '@/types';
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

  return lines.join('\n');
}

export function importFromMarkdown(md: string): ResumeData {
  const data = createInitialResume();
  const lines = md.split('\n');
  let currentSection = '';
  let currentItem: Experience | Education | Project | Skill | null = null;
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
        if (key === '描述' || key === '贡献证明' || key === '项') {
          currentContext = key;
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
          const withDesc = currentItem as Experience | Education | Project;
          (withDesc.description = withDesc.description || []).push(val);
        } else if (currentContext === '贡献证明') {
          const proj = currentItem as Project;
          (proj.proofs = proj.proofs || []).push({ id: createEntityId('proof'), summary: val, refs: [] });
        } else if (currentContext === '项' && currentSection === '专业技能') {
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
