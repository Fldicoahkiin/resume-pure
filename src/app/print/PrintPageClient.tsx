'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { ResumeLayout } from '@/components/resume/ResumeLayout';
import {
  postResumeExportResult,
  readResumeExportPayload,
  removeResumeExportPayload,
  type ResumeExportPayload,
} from '@/lib/exportPayload';
import { convertPxToMm, getPaperDimensions } from '@/lib/paper';

type PrintPageState =
  | { status: 'loading' }
  | { status: 'redirecting' }
  | { status: 'ready'; payload: ResumeExportPayload };

function getPrintPageStyleRule(paperWidthMm: number, pageHeightMm: number) {
  return `
    @page {
      size: ${paperWidthMm}mm ${pageHeightMm}mm;
      margin: 0;
    }

    html,
    body {
      margin: 0;
      padding: 0;
      width: ${paperWidthMm}mm;
      min-width: ${paperWidthMm}mm;
      background: #ffffff;
      overflow: visible;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    #resume-print-root {
      width: ${paperWidthMm}mm;
      min-width: ${paperWidthMm}mm;
      margin: 0;
      padding: 0;
      background: #ffffff;
    }

    #resume-print-surface {
      width: ${paperWidthMm}mm !important;
      min-width: ${paperWidthMm}mm !important;
      margin: 0 !important;
      box-shadow: none !important;
      background: #ffffff !important;
    }
  `;
}

function waitForNextPaint() {
  return new Promise<void>((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => resolve());
    });
  });
}

function isHeadlessPrintEnvironment() {
  if (typeof navigator === 'undefined') {
    return false;
  }

  return navigator.userAgent.includes('HeadlessChrome');
}

export default function PrintPageClient() {
  const hasStartedRef = useRef(false);
  const [state, setState] = useState<PrintPageState>({ status: 'loading' });
  const shouldAutoPrint = useMemo(() => {
    if (typeof window === 'undefined') {
      return true;
    }

    return new URLSearchParams(window.location.search).get('autoprint') !== '0';
  }, []);

  useEffect(() => {
    const exportId = new URLSearchParams(window.location.search).get('id');
    const isEmbedded = window.parent !== window;

    const closeOrRedirect = () => {
      setState({ status: 'redirecting' });

      if (window.opener && !window.opener.closed) {
        window.close();
        return;
      }

      if (isEmbedded) {
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
    if (state.status !== 'ready' || hasStartedRef.current || !shouldAutoPrint) {
      return;
    }

    hasStartedRef.current = true;
    const payload = state.payload;
    const exportId = payload.id;
    const isEmbedded = window.parent !== window;
    const shouldUseHeadlessFallback = isHeadlessPrintEnvironment();
    let headlessFallbackTimer: number | null = null;

    document.title = payload.filename;

    const cleanupPayload = () => {
      removeResumeExportPayload(exportId);
    };

    const closeOrRedirect = () => {
      if (window.opener && !window.opener.closed) {
        window.close();
        return;
      }

      if (isEmbedded) {
        return;
      }

      window.location.replace('/builder');
    };

    const finishExport = (status: 'success' | 'error', message?: string) => {
      postResumeExportResult({
        exportId: payload.id,
        status,
        message,
      });
      cleanupPayload();
      closeOrRedirect();
    };

    const handleAfterPrint = () => {
      if (headlessFallbackTimer !== null) {
        window.clearTimeout(headlessFallbackTimer);
        headlessFallbackTimer = null;
      }
      finishExport('success');
    };

    window.addEventListener('afterprint', handleAfterPrint);

    const run = async () => {
      await document.fonts.ready;
      await new Promise((resolve) => window.setTimeout(resolve, 200));

      const surface = document.getElementById('resume-print-surface');
      const content = document.getElementById('resume-print-content');
      if (!surface || !content) {
        throw new Error('print-surface-missing');
      }

      const contentHeightPx = Math.max(
        Math.ceil(content.scrollHeight),
        Math.ceil(content.getBoundingClientRect().height),
        1
      );
      const paper = getPaperDimensions(payload.resume.theme.paperSize);
      const pageHeightMm = Math.ceil(convertPxToMm(contentHeightPx) * 1000) / 1000;
      const pageStyle = document.getElementById('resume-print-page-style');
      if (pageStyle) {
        pageStyle.textContent = getPrintPageStyleRule(paper.mmWidth, pageHeightMm);
      }

      await waitForNextPaint();
      window.print();

      if (shouldUseHeadlessFallback) {
        headlessFallbackTimer = window.setTimeout(() => {
          finishExport('success');
        }, 1200);
      }
    };

    run().catch((error) => {
      console.error('print-page-export-failed', error);
      finishExport('error', 'PDF 导出失败');
    });

    return () => {
      if (headlessFallbackTimer !== null) {
        window.clearTimeout(headlessFallbackTimer);
      }
      window.removeEventListener('afterprint', handleAfterPrint);
    };
  }, [shouldAutoPrint, state]);

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
          {getPrintPageStyleRule(paper.mmWidth, paper.mmHeight)}
        </style>
        <div
          id="resume-print-root"
          className="bg-white mx-auto"
          style={{
            width: `${paper.width}px`,
            minWidth: `${paper.width}px`,
          }}
        >
          <div
            id="resume-print-surface"
            className="bg-white"
            style={{
              width: `${paper.width}px`,
              minWidth: `${paper.width}px`,
              fontFamily: `"${payload.resume.theme.fontFamily}", "Noto Sans SC", system-ui, sans-serif`,
            }}
          >
            <div id="resume-print-content" className="relative w-full">
              <ResumeLayout data={payload.resume} translations={translations} />
            </div>
          </div>
        </div>
      </>
    );
  }, [state]);

  return renderContent;
}
