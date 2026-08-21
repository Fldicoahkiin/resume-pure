import { describe, expect, it } from 'vitest';
import { exportToJSON, importFromJSON } from './export';
import { createInitialResume } from './resumeData';

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
});
