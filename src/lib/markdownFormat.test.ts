import { describe, expect, it } from 'vitest';
import { createInitialResume } from './resumeData';
import { exportToMarkdown, importFromMarkdown } from './markdownFormat';

describe('Markdown resume format', () => {
  it('round-trips the school in personal info', () => {
    const resume = createInitialResume();
    resume.personalInfo.school = '四川传媒学院';

    const markdown = exportToMarkdown(resume);
    const imported = importFromMarkdown(markdown);

    expect(markdown).toContain('学校: 四川传媒学院');
    expect(imported.personalInfo.school).toBe('四川传媒学院');
  });

  it('round-trips custom section content', () => {
    const resume = createInitialResume();
    resume.sections.push({
      id: 'custom-awards',
      title: '奖项',
      visible: true,
      order: resume.sections.length + 1,
      isCustom: true,
    });
    resume.customSections.push({
      id: 'custom-awards',
      type: 'custom',
      items: [
        {
          id: 'award-1',
          title: '年度贡献奖',
          subtitle: '示例公司',
          date: '2026',
          description: ['负责编辑器渲染链路'],
          showBulletPoints: true,
          url: 'https://example.com/award',
          showLogo: false,
          showStars: false,
        },
      ],
    });

    const markdown = exportToMarkdown(resume);
    const imported = importFromMarkdown(markdown);

    expect(markdown).toContain('# 自定义模块: 奖项');
    expect(imported.sections).toEqual(expect.arrayContaining([
      expect.objectContaining({
        title: '奖项',
        visible: true,
        isCustom: true,
      }),
    ]));
    expect(imported.customSections).toEqual([
      expect.objectContaining({
        type: 'custom',
        items: [
          expect.objectContaining({
            title: '年度贡献奖',
            subtitle: '示例公司',
            date: '2026',
            description: ['负责编辑器渲染链路'],
            showBulletPoints: true,
            url: 'https://example.com/award',
            showLogo: false,
            showStars: false,
          }),
        ],
      }),
    ]);
  });
});
