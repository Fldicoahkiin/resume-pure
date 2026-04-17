'use client';

import { CSSProperties, KeyboardEvent, ReactNode, useLayoutEffect, useCallback, useRef } from 'react';
import { useResumeStore } from '@/store/resumeStore';
import { useTranslation } from 'react-i18next';
import { getPaperDimensions } from '@/lib/paper';
import { ResumeLayout, ResumeSelectableBlockProps } from '@/components/resume/ResumeLayout';
import { PdfContext } from '@/components/core/Universal';

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

function SelectableBlock({
  anchor,
  activeAnchor,
  onSelectAnchor,
  className,
  children,
  style,
  pageBreakable,
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
      data-page-breakable={pageBreakable ? "true" : undefined}
      className={`${className || ''} ${interactiveClass} ${activeClass}`.trim()}
      style={style}
    >
      {children}
    </div>
  );
}

export function ResumePreview({
  onSelectAnchor,
  activeAnchor,
}: ResumePreviewProps) {
  const { resume, hasHydrated } = useResumeStore();
  const { t } = useTranslation();

  const { personalInfo, experience, education, projects, skills, customSections, theme } = resume;
  const paper = getPaperDimensions(theme.paperSize);

  const lastUpdateHeightRef = useRef<number>(0);

  // 提取进行分页推压的纯净函数
  const applyPagination = useCallback(() => {
    const container = document.getElementById('resume-preview-content');
    if (!container) return;

    // 清除旧 Spacer，复原纯净 DOM 用于重新度量
    const oldSpacers = container.querySelectorAll('.resume-page-spacer');
    oldSpacers.forEach(el => el.remove());

    const A4_HEIGHT = paper.height;
    // 强制缩紧页面顶部补偿与底部防粘断层，避免推力过剩造成的空白过大！
    const PAGE_TOP_PADDING = 30;
    const PAGE_BOTTOM_PADDING = 30;

    const breakables = container.querySelectorAll('[data-page-breakable="true"]');
    const containerRect = container.getBoundingClientRect();
    const containerTop = containerRect.top;
    
    // 如果外部有缩放容器，getBoundingClientRect 拿到的将是缩放后的残缺值，必须用真正的比例还原回 100% 物理坐标系
    const scale = containerRect.width / paper.width;

    let totalContentHeight = 0;

    for (let i = 0; i < breakables.length; i++) {
      const el = breakables[i] as HTMLElement;
      const rect = el.getBoundingClientRect();
      const elTop = (rect.top - containerTop) / scale;
      const height = rect.height / scale;

      if (height === 0) continue;
      totalContentHeight += height;

      const currentPage = Math.floor(elTop / A4_HEIGHT);
      const absoluteBottomLimit = (currentPage * A4_HEIGHT) + A4_HEIGHT - PAGE_BOTTOM_PADDING;

      // 如果突破封锁线，将其顶到下一页
      if ((elTop + height) > absoluteBottomLimit && height < (A4_HEIGHT - PAGE_TOP_PADDING - PAGE_BOTTOM_PADDING)) {
        const targetNextPageTop = (currentPage + 1) * A4_HEIGHT + PAGE_TOP_PADDING;
        const pushDistance = targetNextPageTop - elTop;

        const spacer = document.createElement('div');
        // spacer serves as both the layout pusher and the visual indicator in preview
        spacer.className = 'resume-page-spacer relative w-full select-none';
        spacer.style.height = `${pushDistance}px`;
        
        let innerHTML = '';
        if (pushDistance > 30) {
          // 物理切页点距离当前 spacer 顶部的实际距离
          const distanceToCut = pushDistance - PAGE_TOP_PADDING;
          
          innerHTML = `
            <div class="print:hidden hide-in-export absolute inset-x-0 px-12 flex items-center justify-center pointer-events-none opacity-40 z-10" style="top: ${distanceToCut}px; transform: translateY(-50%);">
              <div class="w-full border-t border-dashed border-gray-400"></div>
              <div class="absolute bg-white px-3 text-[10px] font-semibold tracking-widest text-gray-400 uppercase">
                Page Break
              </div>
            </div>
          `;
        } else {
          const distanceToCut = pushDistance - PAGE_TOP_PADDING;
          innerHTML = `
            <div class="print:hidden hide-in-export absolute inset-x-0 px-12 flex items-center justify-center pointer-events-none opacity-40 z-10" style="top: ${distanceToCut}px; transform: translateY(-50%);">
              <div class="w-full border-t border-dashed border-gray-400"></div>
            </div>
          `;
        }
        spacer.innerHTML = innerHTML;
        
        el.parentNode?.insertBefore(spacer, el);
      }
    }

    // 记录本次清洗和排版后的纯内容度量高度
    lastUpdateHeightRef.current = totalContentHeight;
  }, [paper.height, paper.width]);

  useLayoutEffect(() => {
    if (!hasHydrated) return;

    // 初始直接排版一次
    applyPagination();

    // 延迟 300 毫秒再排版一次，防卫外部字体或网络图片异步加载造成的二次撑高
    const timer = setTimeout(() => {
      applyPagination();
    }, 300);

    const container = document.getElementById('resume-preview-content');
    if (!container) return () => clearTimeout(timer);

    let resizeTimeout: NodeJS.Timeout;
    // 建立防抖和死锁防御机制的 Resize 监听
    const observer = new ResizeObserver(() => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        const breakables = container.querySelectorAll('[data-page-breakable="true"]');
        let currentHeight = 0;
        for (let i = 0; i < breakables.length; i++) {
          currentHeight += (breakables[i] as HTMLElement).offsetHeight;
        }
        
        // 关键死锁防御：只有纯净模块的高度确实发生了非微小变化（2px 容差），才执行重量级计算
        if (Math.abs(currentHeight - lastUpdateHeightRef.current) > 2) {
          applyPagination();
        }
      }, 50); // 加入极短时间的防抖平滑
    });
    
    observer.observe(container);

    return () => {
      clearTimeout(timer);
      clearTimeout(resizeTimeout);
      observer.disconnect();
    };
  }, [
    experience, education, projects, skills, customSections, personalInfo, theme, hasHydrated, applyPagination
  ]);

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

  const BoundSelectableBlock = ({
    anchor,
    className,
    style,
    children,
    pageBreakable,
  }: ResumeSelectableBlockProps) => {
    return (
      <SelectableBlock
        anchor={anchor}
        activeAnchor={activeAnchor}
        onSelectAnchor={onSelectAnchor}
        className={className}
        style={style}
        pageBreakable={pageBreakable}
      >
        {children}
      </SelectableBlock>
    );
  };

  return (
    <div
      id="resume-preview"
      className="bg-white mx-auto shadow-xl print:shadow-none"
      style={previewStyle}
    >
      <div id="resume-preview-content" className="relative w-full h-full">
        <PdfContext.Provider value={{ isPdf: false }}>
          <ResumeLayout 
            data={resume} 
            translations={translations} 
            SelectableBlock={BoundSelectableBlock} 
          />
        </PdfContext.Provider>
      </div>
    </div>
  );
}
