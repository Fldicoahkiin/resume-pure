import { describe, expect, it } from 'vitest';
import { exportToJSON, importFromJSON } from './export';
import { createInitialResume } from './resumeData';
import type { Skill } from '@/types';

describe('resume export', () => {
  it('round-trips the school in raw JSON', () => {
    const resume = createInitialResume();
    resume.personalInfo.school = '四川传媒学院';

    const exported = exportToJSON(resume);
    const imported = importFromJSON(exported);

    expect(JSON.parse(exported).personalInfo.school).toBe('四川传媒学院');
    expect(imported.personalInfo.school).toBe('四川传媒学院');
  });

  it('normalizes older raw JSON without a school', () => {
    const resume = createInitialResume();
    const raw = JSON.parse(exportToJSON(resume));
    delete raw.personalInfo.school;

    expect(importFromJSON(JSON.stringify(raw)).personalInfo.school).toBe('');
  });

  it('keeps skills written as a delimited string', () => {
    const raw = JSON.parse(exportToJSON(createInitialResume()));
    raw.skills = [{ category: '前端', items: 'React, TypeScript、Vue；Next.js' }];

    const [skill] = importFromJSON(JSON.stringify(raw)).skills;

    expect(skill.category).toBe('前端');
    expect(skill.items.map((item) => item.name)).toEqual(['React', 'TypeScript', 'Vue', 'Next.js']);
  });

  it('keeps skill entries named by label, skill or title', () => {
    const raw = JSON.parse(exportToJSON(createInitialResume()));
    raw.skills = [{
      category: '后端',
      items: [{ label: 'Go', level: 'core' }, { skill: 'Rust' }, { title: 'PostgreSQL', context: '主力数据库' }],
    }];

    const [skill] = importFromJSON(JSON.stringify(raw)).skills;

    expect(skill.items.map((item) => item.name)).toEqual(['Go', 'Rust', 'PostgreSQL']);
    expect(skill.items[0].level).toBe('core');
    expect(skill.items[2].context).toBe('主力数据库');
  });

  it('keeps delimited skills inside a custom skill section', () => {
    const raw = JSON.parse(exportToJSON(createInitialResume()));
    raw.customSections = [{ key: 'tools', type: 'skill', items: [{ category: '工具', items: 'Git、Docker' }] }];
    raw.sections.push({ key: 'tools', title: '工具', visible: true });

    const [section] = importFromJSON(JSON.stringify(raw)).customSections;
    const [skill] = section.items as Skill[];

    expect(skill.items.map((item) => item.name)).toEqual(['Git', 'Docker']);
  });

  it('keeps exported skill entries that only have a context', () => {
    const raw = JSON.parse(exportToJSON(createInitialResume()));
    raw.skills = [{
      category: 'xx',
      items: [
        { name: '', level: 'core', context: '熟悉分布式系统设计', logo: '', showLogo: true, showContext: true },
        { name: '', level: 'core', context: '', logo: '', showLogo: true, showContext: true },
      ],
      visible: true,
    }];

    const [skill] = importFromJSON(JSON.stringify(raw)).skills;

    expect(skill.items.map((item) => item.context)).toEqual(['熟悉分布式系统设计']);
  });
});
