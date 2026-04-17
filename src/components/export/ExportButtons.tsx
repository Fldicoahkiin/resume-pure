'use client';

import { useState } from 'react';
import { useResumeStore } from '@/store/resumeStore';
import { Download } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { exportToPNG } from '@/lib/image';
import { exportToPDF } from '@/lib/pdf';

export function ExportButtons() {
  const { t } = useTranslation();
  const { resume } = useResumeStore();
  const [loadingPDF, setLoadingPDF] = useState(false);
  const [loadingPNG, setLoadingPNG] = useState(false);

  const translations = {
    summary: t('pdf.summary'),
    experience: t('pdf.experience'),
    education: t('pdf.education'),
    projects: t('pdf.projects'),
    skills: t('pdf.skills'),
    technologies: t('pdf.technologies'),
    contributions: t('pdf.contributions'),
    present: t('pdf.present'),
    customSection: t('editor.customSection.title'),
    skillLevel: {
      core: t('pdf.skillLevel.core'),
      proficient: t('pdf.skillLevel.proficient'),
      familiar: t('pdf.skillLevel.familiar'),
    },
  };

  const handleExportPDF = async () => {
    setLoadingPDF(true);
    try {
      await exportToPDF(resume, 'resume.pdf', translations);
    } catch (error) {
      alert(t('export.pdfExportFailed') + (error as Error).message);
    } finally {
      setLoadingPDF(false);
    }
  };

  const handleExportPNG = async () => {
    setLoadingPNG(true);
    try {
      await exportToPNG('resume.png');
    } catch (error) {
      alert(t('export.pngExportFailed') + (error as Error).message);
    } finally {
      setLoadingPNG(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleExportPNG}
        disabled={loadingPNG}
        className="flex items-center gap-1.5 px-4 sm:px-5 py-2 bg-gray-900 text-white text-sm rounded-lg hover:bg-gray-800 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100 transition disabled:opacity-50"
        title={t('export.png')}
      >
        <Download size={16} />
        {loadingPNG ? '...' : t('export.png')}
      </button>
      <button
        onClick={handleExportPDF}
        disabled={loadingPDF}
        className="flex items-center gap-1.5 px-4 sm:px-5 py-2 bg-gray-900 text-white text-sm rounded-lg hover:bg-gray-800 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100 transition disabled:opacity-50"
      >
        <Download size={16} />
        {loadingPDF ? t('export.exporting') : t('export.pdf')}
      </button>
    </div>
  );
}
