import { ResumeData } from '@/types';
import yaml from 'js-yaml';
import { normalizeResumeData } from '@/lib/resumeData';
import { exportRawResumeData, prepareImportedResumeData } from '@/lib/rawData';

export const exportToJSON = (data: ResumeData): string => {
  return JSON.stringify(exportRawResumeData(data), null, 2);
};

export const exportToYAML = (data: ResumeData): string => {
  return yaml.dump(exportRawResumeData(data), {
    indent: 2,
    lineWidth: 120,
    noRefs: true,
  });
};

export const importFromJSON = (content: string): ResumeData => {
  return normalizeResumeData(prepareImportedResumeData(JSON.parse(content)));
};

export const importFromYAML = (content: string): ResumeData => {
  return normalizeResumeData(
    prepareImportedResumeData(yaml.load(content, {
      json: true,
      schema: yaml.JSON_SCHEMA,
    }))
  );
};

export const downloadFile = (content: string, filename: string, type: string) => {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
