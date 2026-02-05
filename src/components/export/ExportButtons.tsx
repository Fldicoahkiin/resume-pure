'use client';

import { useState } from 'react';
import { useResumeStore } from '@/store/resumeStore';
import { exportToJSON, exportToYAML, downloadFile } from '@/lib/export';
import { exportToPDF } from '@/lib/pdf';
import { exportToPNG } from '@/lib/image';
import { FileJson, FileCode, FileImage, FileText } from 'lucide-react';

export function ExportButtons() {
  const { resume } = useResumeStore();
  const [loading, setLoading] = useState<string | null>(null);

  const handleExportJSON = () => {
    try {
      const json = exportToJSON(resume);
      downloadFile(json, 'resume.json', 'application/json');
    } catch (error) {
      alert('导出失败：' + (error as Error).message);
    }
  };

  const handleExportYAML = () => {
    try {
      const yaml = exportToYAML(resume);
      downloadFile(yaml, 'resume.yaml', 'text/yaml');
    } catch (error) {
      alert('导出失败：' + (error as Error).message);
    }
  };

  const handleExportPDF = async () => {
    setLoading('pdf');
    try {
      await exportToPDF(resume, 'resume.pdf');
    } catch (error) {
      alert('PDF 导出失败：' + (error as Error).message);
    } finally {
      setLoading(null);
    }
  };

  const handleExportPNG = async () => {
    setLoading('png');
    try {
      await exportToPNG('resume-preview', 'resume.png');
    } catch (error) {
      alert('PNG 导出失败：' + (error as Error).message);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      <button
        onClick={handleExportJSON}
        className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
      >
        <FileJson size={16} />
        导出 JSON
      </button>

      <button
        onClick={handleExportYAML}
        className="flex items-center gap-2 px-4 py-2 bg-purple-500 text-white rounded-md hover:bg-purple-600"
      >
        <FileCode size={16} />
        导出 YAML
      </button>

      <button
        onClick={handleExportPDF}
        disabled={loading === 'pdf'}
        className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 disabled:opacity-50"
      >
        <FileText size={16} />
        {loading === 'pdf' ? '导出中...' : '导出 PDF'}
      </button>

      <button
        onClick={handleExportPNG}
        disabled={loading === 'png'}
        className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 disabled:opacity-50"
      >
        <FileImage size={16} />
        {loading === 'png' ? '导出中...' : '导出 PNG'}
      </button>
    </div>
  );
}
