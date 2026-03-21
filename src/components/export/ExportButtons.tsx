'use client';

import { useState } from 'react';
import { useResumeStore } from '@/store/resumeStore';
import { Download } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export function ExportButtons() {
  const { t } = useTranslation();
  const { resume } = useResumeStore();
  const [loadingPDF, setLoadingPDF] = useState(false);
  const [loadingPNG, setLoadingPNG] = useState(false);

  const handleExportPDF = async () => {
    setLoadingPDF(true);
    try {
      const { exportToPDF } = await import('@/lib/image');
      await exportToPDF('resume-preview', 'resume.pdf', resume.theme.paperSize);
    } catch (error) {
      alert(t('export.pdfExportFailed') + (error as Error).message);
    } finally {
      setLoadingPDF(false);
    }
  };

  const handleExportPNG = async () => {
    setLoadingPNG(true);
    try {
      const { exportToPNG } = await import('@/lib/image');
      await exportToPNG('resume-preview', 'resume.png');
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
