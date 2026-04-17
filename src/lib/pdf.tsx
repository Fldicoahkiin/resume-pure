import {
  createResumeExportUrl,
  openResumeExportFrame,
  removeResumeExportPayload,
  saveResumeExportPayload,
  waitForResumeExport,
} from '@/lib/exportPayload';
import type { PDFTranslations, ResumeData } from '@/types';

const defaultTranslations: PDFTranslations = {
  summary: '个人简介',
  experience: '工作经历',
  education: '教育背景',
  projects: '项目经验',
  skills: '技能专长',
  technologies: '技术栈',
  contributions: '贡献记录',
  present: '至今',
  customSection: '自定义模块',
  skillLevel: {
    core: '核心',
    proficient: '熟练',
    familiar: '了解',
  },
};

export async function exportToPDF(
  data: ResumeData,
  filename: string = 'resume.pdf',
  translations: PDFTranslations = defaultTranslations
): Promise<void> {
  let exportId: string | null = null;

  try {
    exportId = saveResumeExportPayload({
      resume: data,
      translations,
      format: 'pdf',
      filename,
    });
    const exportUrl = createResumeExportUrl(exportId);
    const exportFrame = openResumeExportFrame(exportUrl);
    await waitForResumeExport(exportId, 'pdf', exportFrame);
  } catch (error) {
    if (exportId) {
      removeResumeExportPayload(exportId);
    }
    console.error('PDF 导出失败:', error);
    throw new Error('PDF export failed');
  }
}
