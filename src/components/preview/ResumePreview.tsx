'use client';

import {
  CSSProperties,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import Image from 'next/image';
import { useTranslation } from 'react-i18next';
import { getPaperDimensions } from '@/lib/paper';
import {
  clearCachedRenderArtifact,
  getRenderArtifactKey,
  storeCachedRenderArtifact,
} from '@/lib/render/cache';
import { buildRenderArtifact, disposeRenderArtifact } from '@/lib/render/surface';
import type { RenderArtifact } from '@/lib/render/types';
import { useResumeStore } from '@/store/resumeStore';

const SKELETON_SECTION_KEYS = ['skeleton-1', 'skeleton-2', 'skeleton-3'];
const DEFAULT_PAPER_DIMENSIONS = getPaperDimensions('A4');
/** 连续编辑时的重建防抖窗口；首次渲染与重试不受此延迟影响 */
const PREVIEW_DEBOUNCE_MS = 250;

interface ResumePreviewProps {
  onSelectAnchor?: (anchor: string) => void;
  activeAnchor?: string | null;
  onRenderSizeChange?: (size: { width: number; height: number }) => void;
}

function ResumePreviewSkeleton() {
  return (
    <div
      className="bg-white shadow-lg mx-auto animate-pulse"
      style={{
        width: `${DEFAULT_PAPER_DIMENSIONS.width}px`,
        minHeight: `${DEFAULT_PAPER_DIMENSIONS.height}px`,
        padding: '50px',
      }}
    >
      <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
      <div className="h-5 bg-gray-200 rounded w-1/4 mb-2"></div>
      <div className="h-4 bg-gray-200 rounded w-2/3 mb-8"></div>
      <div className="space-y-6">
        {SKELETON_SECTION_KEYS.map((key) => (
          <div key={key}>
            <div className="h-5 bg-gray-200 rounded w-1/4 mb-3"></div>
            <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          </div>
        ))}
      </div>
    </div>
  );
}

function getOverlayClassName(isActive: boolean) {
  return isActive
    ? 'absolute appearance-none rounded-sm border-0 bg-transparent p-0 shadow-none ring-2 ring-blue-400/80 focus:outline-none'
    : 'absolute appearance-none rounded-sm border-0 bg-transparent p-0 shadow-none focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/70';
}

export function ResumePreview({
  onSelectAnchor,
  activeAnchor,
  onRenderSizeChange,
}: ResumePreviewProps) {
  const { resume, hasHydrated } = useResumeStore();
  const { t } = useTranslation();
  const [artifact, setArtifact] = useState<RenderArtifact | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [retryCounter, setRetryCounter] = useState(0);
  const isFirstBuildRef = useRef(true);
  const lastRetryRef = useRef(retryCounter);

  const renderOptions = useMemo(() => ({
    theme: resume.theme,
    translations: {
      experience: t('preview.experience'),
      education: t('preview.education'),
      projects: t('preview.projects'),
      skills: t('preview.skills'),
      present: t('pdf.present'),
      customSection: t('editor.customSection.title'),
    },
  }), [
    resume.theme,
    t,
  ]);
  const artifactKey = useMemo(() => getRenderArtifactKey(resume, renderOptions), [renderOptions, resume]);

  useEffect(() => {
    if (!hasHydrated) {
      return;
    }

    let disposed = false;
    setError(null);

    const runBuild = async () => {
      try {
        const nextArtifact = await buildRenderArtifact(resume, renderOptions);

        if (disposed) {
          disposeRenderArtifact(nextArtifact);
          return;
        }

        storeCachedRenderArtifact(artifactKey, nextArtifact);
        setArtifact(nextArtifact);
        onRenderSizeChange?.({
          width: nextArtifact.width,
          height: nextArtifact.height,
        });
      } catch (renderError) {
        console.error('简历预览渲染失败:', renderError);
        if (!disposed) {
          setError('resume-preview-render-failed');
        }
      }
    };

    const retried = lastRetryRef.current !== retryCounter;
    lastRetryRef.current = retryCounter;
    const immediate = isFirstBuildRef.current || retried;
    isFirstBuildRef.current = false;

    if (immediate) {
      void runBuild();
      return () => {
        disposed = true;
      };
    }

    const timer = window.setTimeout(() => void runBuild(), PREVIEW_DEBOUNCE_MS);
    return () => {
      disposed = true;
      window.clearTimeout(timer);
    };
  }, [artifactKey, hasHydrated, onRenderSizeChange, renderOptions, resume, retryCounter]);

  useEffect(() => {
    return () => {
      clearCachedRenderArtifact();
      setArtifact(null);
    };
  }, []);

  if (error) {
    return (
      <div
        className="mx-auto bg-white shadow-xl flex flex-col items-center justify-center gap-3 text-sm"
        style={{
          width: `${DEFAULT_PAPER_DIMENSIONS.width}px`,
          minHeight: `${DEFAULT_PAPER_DIMENSIONS.height}px`,
        }}
      >
        <span className="text-red-600">{t('preview.renderFailed')}</span>
        <button
          type="button"
          onClick={() => {
            setError(null);
            setRetryCounter((prev) => prev + 1);
          }}
          className="rounded border border-gray-300 px-3 py-1 text-xs text-gray-600 transition hover:bg-gray-50"
        >
          {t('preview.retry')}
        </button>
      </div>
    );
  }

  if (!hasHydrated || !artifact) {
    return <ResumePreviewSkeleton />;
  }

  const previewStyle: CSSProperties = {
    width: `${artifact.width}px`,
    minHeight: `${artifact.height}px`,
  };

  return (
    <div
      id="resume-preview"
      className="relative mx-auto overflow-hidden"
      style={previewStyle}
    >
      <Image
        src={artifact.objectUrl}
        alt="Resume Preview"
        width={artifact.width}
        height={artifact.height}
        unoptimized
        priority
        className="block w-full h-auto select-none pointer-events-none"
      />
      {onSelectAnchor && artifact.document.hitRegions.map((region, index) => {
        const isActive = activeAnchor === region.anchor;

        return (
          <button
            key={`${region.anchor}-${index}`}
            type="button"
            aria-label={region.anchor}
            onClick={() => onSelectAnchor(region.anchor)}
            className={getOverlayClassName(isActive)}
            style={{
              left: `${region.x}px`,
              top: `${region.y}px`,
              width: `${Math.max(region.width, 1)}px`,
              height: `${Math.max(region.height, 1)}px`,
            }}
          />
        );
      })}
    </div>
  );
}
