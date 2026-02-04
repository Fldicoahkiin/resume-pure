import { ResumeData } from '@/types';
import yaml from 'js-yaml';

export const exportToJSON = (data: ResumeData): string => {
  return JSON.stringify(data, null, 2);
};

export const exportToYAML = (data: ResumeData): string => {
  return yaml.dump(data, {
    indent: 2,
    lineWidth: 120,
    noRefs: true,
  });
};

export const importFromJSON = (content: string): ResumeData => {
  return JSON.parse(content);
};

export const importFromYAML = (content: string): ResumeData => {
  return yaml.load(content) as ResumeData;
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
