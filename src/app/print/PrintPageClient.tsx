'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { ResumeLayout } from '@/components/resume/ResumeLayout';
import {
  postResumeExportResult,
  readResumeExportPayload,
  removeResumeExportPayload,
  type ResumeExportPayload,
} from '@/lib/exportPayload';
import { downloadElementToPNG } from '@/lib/image';
import { convertPxToMm, getPaperDimensions } from '@/lib/paper';

type PrintPageState =
  | { status: 'loading' }
  | { status: 'redirecting' }
  | { status: 'ready'; payload: ResumeExportPayload };

export default function PrintPageClient() {
  const hasStartedRef = useRef(false);
  const [state, setState] = useState<PrintPageState>({ status: 'loading' });

  useEffect(() => {
    const exportId = new URLSearchParams(window.location.search).get('id');

    const closeOrRedirect = () => {
      setState({ status: 'redirecting' });

      if (window.opener && !window.opener.closed) {
        window.close();
        return;
      }

      window.location.replace('/builder');
    };

    if (!exportId) {
      closeOrRedirect();
      return;
    }

    const payload = readResumeExportPayload(exportId);
    if (!payload) {
      closeOrRedirect();
      return;
    }

    setState({ status: 'ready', payload });
  }, []);

  useEffect(() => {
    if (state.status !== 'ready' || hasStartedRef.current) {
      return;
    }

    hasStartedRef.current = true;
    const payload = state.payload;
    const exportId = payload.id;

    document.title = payload.filename;

    const cleanupPayload = () => {
      removeResumeExportPayload(exportId);
    };

    const closeOrRedirect = () => {
      if (window.opener && !window.opener.closed) {
        window.close();
        return;
      }

      window.location.replace('/builder');
    };

    const finishExport = (status: 'success' | 'error', message?: string) => {
      postResumeExportResult({
        exportId: payload.id,
        format: payload.format,
        status,
        message,
      });
      cleanupPayload();
      closeOrRedirect();
    };

    const handleAfterPrint = () => {
      finishExport('success');
    };

    window.addEventListener('afterprint', handleAfterPrint);

    const run = async () => {
      await document.fonts.ready;
      await new Promise((resolve) => window.setTimeout(resolve, 200));

      if (payload.format === 'png') {
        await downloadElementToPNG('resume-print-surface', payload.filename);
        finishExport('success');
        return;
      }

      const surface = document.getElementById('resume-print-surface');
      if (!surface) {
        throw new Error('print-surface-missing');
      }

      const contentHeightPx = Math.max(Math.ceil(surface.scrollHeight), getPaperDimensions(payload.resume.theme.paperSize).height);
      const pageHeightMm = Math.ceil(convertPxToMm(contentHeightPx) * 1000) / 1000;
      const pageStyle = document.getElementById('resume-print-page-style');
      if (pageStyle) {
        pageStyle.textContent = `@page { size: ${getPaperDimensions(payload.resume.theme.paperSize).mmWidth}mm ${pageHeightMm}mm; margin: 0; }`;
      }

      window.print();
    };

    run().catch((error) => {
      console.error('print-page-export-failed', error);
      finishExport('error', payload.format === 'png' ? 'PNG 导出失败' : 'PDF 导出失败');
    });

    return () => {
      window.removeEventListener('afterprint', handleAfterPrint);
    };
  }, [state]);

  const renderContent = useMemo(() => {
    if (state.status === 'loading') {
      return (
        <div className="min-h-screen flex items-center justify-center bg-white text-gray-500">
          正在准备导出页面...
        </div>
      );
    }

    if (state.status === 'redirecting') {
      return null;
    }

    const { payload } = state;
    const paper = getPaperDimensions(payload.resume.theme.paperSize);
    const translations = {
      experience: payload.translations.experience,
      education: payload.translations.education,
      projects: payload.translations.projects,
      skills: payload.translations.skills,
      present: payload.translations.present,
      customSection: payload.translations.customSection,
    };

    return (
      <>
        <style id="resume-print-page-style">
          {`@page { size: ${paper.mmWidth}mm ${paper.mmHeight}mm; margin: 0; }`}
        </style>
        <div className="min-h-screen bg-white flex justify-center py-6 print:py-0">
          <div
            id="resume-print-surface"
            className="bg-white shadow-xl print:shadow-none"
            style={{
              width: `${paper.width}px`,
              fontFamily: `"${payload.resume.theme.fontFamily}", "Noto Sans SC", system-ui, sans-serif`,
            }}
          >
            <div id="resume-print-content" className="relative w-full h-full">
              <ResumeLayout data={payload.resume} translations={translations} />
            </div>
          </div>
        </div>
      </>
    );
  }, [state]);

  return renderContent;
}
