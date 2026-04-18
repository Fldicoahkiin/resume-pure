'use client';

import { useState } from 'react';
import { Download } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { exportToPNG } from '@/lib/image';
import { exportToPDF } from '@/lib/pdf';
import { useResumeStore } from '@/store/resumeStore';

function buildExportErrorMessage(prefix: string, error: unknown) {
  const normalizedPrefix = prefix.trim().replace(/[：:]\s*$/, '');
  const message = error instanceof Error ? error.message.trim().replace(/^[：:]\s*/, '') : '';

  if (!message || message === normalizedPrefix) {
    return normalizedPrefix;
  }

  return `${normalizedPrefix}：${message}`;
}

export function ExportButtons() {
  const { t } = useTranslation();
  const { resume } = useResumeStore();
  const [loadingPDF, setLoadingPDF] = useState(false);
  const [loadingPNG, setLoadingPNG] = useState(false);

  const renderOptions = {
    theme: resume.theme,
    translations: {
      experience: t('preview.experience'),
      education: t('preview.education'),
      projects: t('preview.projects'),
      skills: t('preview.skills'),
      present: t('pdf.present'),
      customSection: t('editor.customSection.title'),
    },
  } as const;

  const handleExportPDF = async () => {
    setLoadingPDF(true);
    try {
      await exportToPDF(resume, renderOptions, 'resume.pdf');
    } catch (error) {
      alert(buildExportErrorMessage(t('export.pdfExportFailed'), error));
    } finally {
      setLoadingPDF(false);
    }
  };

  const handleExportPNG = async () => {
    setLoadingPNG(true);
    try {
      await exportToPNG(resume, renderOptions, 'resume.png');
    } catch (error) {
      alert(buildExportErrorMessage(t('export.pngExportFailed'), error));
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
