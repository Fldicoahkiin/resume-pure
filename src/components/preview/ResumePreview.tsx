'use client';

import {
  createContext,
  CSSProperties,
  KeyboardEvent,
  ReactNode,
  useContext,
} from 'react';
import { useResumeStore } from '@/store/resumeStore';
import { useTranslation } from 'react-i18next';
import { getPaperDimensions } from '@/lib/paper';
import { ResumeLayout, ResumeSelectableBlockProps } from '@/components/resume/ResumeLayout';

const SKELETON_SECTION_KEYS = ['skeleton-1', 'skeleton-2', 'skeleton-3'];
const DEFAULT_PAPER_DIMENSIONS = getPaperDimensions('A4');

interface ResumePreviewProps {
  onSelectAnchor?: (anchor: string) => void;
  activeAnchor?: string | null;
}

interface SelectableBlockProps {
  anchor: string;
  activeAnchor?: string | null;
  onSelectAnchor?: (anchor: string) => void;
  className?: string;
  children: ReactNode;
  style?: CSSProperties;
  pageBreakable?: boolean;
}

interface PreviewSelectionContextValue {
  activeAnchor?: string | null;
  onSelectAnchor?: (anchor: string) => void;
}

const PreviewSelectionContext = createContext<PreviewSelectionContextValue>({
  activeAnchor: null,
  onSelectAnchor: undefined,
});

function SelectableBlock({
  anchor,
  activeAnchor,
  onSelectAnchor,
  className,
  children,
  style,
}: SelectableBlockProps) {
  const isSelectable = typeof onSelectAnchor === 'function';
  const isActive = activeAnchor === anchor;

  const handleActivate = () => {
    onSelectAnchor?.(anchor);
  };

  const interactiveClass = isSelectable
    ? 'cursor-pointer rounded-sm transition hover:bg-blue-50/70 dark:hover:bg-blue-900/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400'
    : '';
  const activeClass = isActive
    ? 'ring-2 ring-blue-400 bg-blue-50/70 dark:bg-blue-900/25'
    : '';

  const interactiveProps = isSelectable ? {
    role: 'button',
    tabIndex: 0,
    onClick: handleActivate,
    onKeyDown: (event: KeyboardEvent<HTMLDivElement>) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        handleActivate();
      }
    },
  } : {};

  return (
    <div
      {...interactiveProps}
      className={`${className || ''} ${interactiveClass} ${activeClass}`.trim()}
      style={style}
    >
      {children}
    </div>
  );
}

function PreviewSelectableBlock({
  anchor,
  className,
  style,
  children,
}: ResumeSelectableBlockProps) {
  const { activeAnchor, onSelectAnchor } = useContext(PreviewSelectionContext);

  return (
    <SelectableBlock
      anchor={anchor}
      activeAnchor={activeAnchor}
      onSelectAnchor={onSelectAnchor}
      className={className}
      style={style}
    >
      {children}
    </SelectableBlock>
  );
}

export function ResumePreview({
  onSelectAnchor,
  activeAnchor,
}: ResumePreviewProps) {
  const { resume, hasHydrated } = useResumeStore();
  const { t } = useTranslation();
  const { theme } = resume;
  const paper = getPaperDimensions(theme.paperSize);

  if (!hasHydrated) {
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

  const previewStyle: CSSProperties = {
    width: `${paper.width}px`,
    minHeight: `${paper.height}px`,
    fontFamily: `"${theme.fontFamily}", "Noto Sans SC", system-ui, sans-serif`,
  };

  const translations = {
    experience: t('preview.experience'),
    education: t('preview.education'),
    projects: t('preview.projects'),
    skills: t('preview.skills'),
    present: t('pdf.present'),
    customSection: t('editor.customSection.title'),
  };

  return (
    <div
      id="resume-preview"
      className="bg-white mx-auto shadow-xl print:shadow-none"
      style={previewStyle}
    >
      <div id="resume-preview-content" className="relative w-full h-full">
        <PreviewSelectionContext.Provider value={{ activeAnchor, onSelectAnchor }}>
          <ResumeLayout
            data={resume}
            translations={translations}
            SelectableBlock={PreviewSelectableBlock}
          />
        </PreviewSelectionContext.Provider>
      </div>
    </div>
  );
}
