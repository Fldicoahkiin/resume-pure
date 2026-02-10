'use client';

import { useState } from 'react';
import { useResumeStore } from '@/store/resumeStore';
import { exportToJSON, exportToYAML, downloadFile } from '@/lib/export';
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

  const handleExportYAML = () => {
    try {
      const yaml = exportToYAML(resume);
      downloadFile(yaml, 'resume.yaml', 'text/yaml');
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
