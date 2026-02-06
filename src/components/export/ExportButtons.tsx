'use client';

import { useState } from 'react';
import { useResumeStore } from '@/store/resumeStore';
import { exportToJSON, downloadFile } from '@/lib/export';
import { exportToPDF, PDFTranslations } from '@/lib/pdf';
import { exportToPNG } from '@/lib/image';
import { Download } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export function ExportButtons() {
  const { t } = useTranslation();
  const { resume } = useResumeStore();
  const [loadingPDF, setLoadingPDF] = useState(false);
  const [loadingPNG, setLoadingPNG] = useState(false);

  const handleExportJSON = () => {
    try {
      const json = exportToJSON(resume);
      downloadFile(json, 'resume.json', 'application/json');
    } catch (error) {
      alert(t('export.exportFailed') + (error as Error).message);
    }
  };

  const handleExportPDF = async () => {
    setLoadingPDF(true);
    try {
      const pdfTranslations: PDFTranslations = {
        summary: t('pdf.summary'),
        experience: t('pdf.experience'),
        education: t('pdf.education'),
        projects: t('pdf.projects'),
        skills: t('pdf.skills'),
        technologies: t('pdf.technologies'),
        present: t('pdf.present'),
      };
      await exportToPDF(resume, 'resume.pdf', pdfTranslations);
    } catch (error) {
      alert(t('export.pdfExportFailed') + (error as Error).message);
    } finally {
      setLoadingPDF(false);
    }
  };

  const handleExportPNG = async () => {
    setLoadingPNG(true);
    try {
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
        onClick={handleExportJSON}
        className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition"
      >
        <Download size={16} />
        {t('export.json')}
      </button>
      <button
        onClick={handleExportPNG}
        disabled={loadingPNG}
        className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition disabled:opacity-50"
      >
        <Download size={16} />
        {loadingPNG ? '...' : t('export.png')}
      </button>
      <button
        onClick={handleExportPDF}
        disabled={loadingPDF}
        className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-white bg-gray-900 dark:bg-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100 rounded transition disabled:opacity-50"
      >
        <Download size={16} />
        {loadingPDF ? t('export.exporting') : t('export.pdf')}
      </button>
    </div>
  );
}
